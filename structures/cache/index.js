let instance = null;
const { createClient, commandOptions } = require('redis');
const { AttachmentBuilder } = require('discord.js');

const log = require('../logging').getInstance().logger;
const config = require('../../config.json');

class RedisCache {

    constructor() {
      const client = createClient({
        url: 'redis://redis:6379'
      });
      
      client.on('error', (err) => log.error('Redis Client Error', err));

      this.client = client;
    }

    async cacheMessage(message){
      let rawAttachments = [];
      if (message.attachments) {
        if (typeof message.attachments.toJSON === 'function') {
          rawAttachments = message.attachments.toJSON();
        } else if (Array.isArray(message.attachments)) {
          rawAttachments = message.attachments;
        } else if (typeof message.attachments.values === 'function') {
          rawAttachments = Array.from(message.attachments.values());
        }
      }

      const msg = {
        author: message.author?.id ?? message.author,
        channel: message.channelId ?? message.channel?.id ?? message.channel,
        content: message.content,
        createdTimestamp: message.createdTimestamp,
        attachments: rawAttachments
      };
      const msgJson = JSON.stringify(msg);
      await this.client.set(message.id, msgJson, {EX:config.cacheExpiration, NX: true});

      const authorId = msg.author;
      const channelId = msg.channel;
      if (authorId && channelId && message.id) {
        await this.trackUserMessage(authorId, channelId, message.id);
      }

      if (rawAttachments.length > 0) {
        await this.downloadAndCacheAttachments(rawAttachments);
      }
    }

    async trackUserMessage(userId, channelId, messageId) {
      if (!userId || !channelId || !messageId) return;

      // Always track in in-memory Map for instantaneous zero-latency cross-channel lookup
      if (!this.userMessageMap) this.userMessageMap = new Map();
      const userList = this.userMessageMap.get(userId) || [];
      userList.push({ channelId, messageId, timestamp: Date.now() });
      if (userList.length > 50) userList.shift();
      this.userMessageMap.set(userId, userList);

      // Also persist to Redis list if supported
      if (this.client && typeof this.client.rPush === 'function') {
        const key = `user_msgs:${userId}`;
        const payload = JSON.stringify({ channelId, messageId, timestamp: Date.now() });
        try {
          await this.client.rPush(key, payload);
          if (typeof this.client.expire === 'function') {
            await this.client.expire(key, 1800); // 30 minutes TTL
          }
        } catch (err) {
          log.warn({ message: `Failed to track user message in Redis for user ${userId}`, error: err });
        }
      }
    }

    async getUserRecentMessages(userId) {
      if (!userId) return [];
      const memoryList = (this.userMessageMap && this.userMessageMap.get(userId)) || [];
      if (this.client && typeof this.client.lRange === 'function') {
        try {
          const key = `user_msgs:${userId}`;
          const rawList = await this.client.lRange(key, 0, -1);
          if (rawList && rawList.length > 0) {
            const redisList = rawList.map(item => {
              try { return JSON.parse(item); } catch { return null; }
            }).filter(Boolean);
            const combined = new Map();
            for (const item of memoryList) combined.set(item.messageId, item);
            for (const item of redisList) combined.set(item.messageId, item);
            return Array.from(combined.values());
          }
        } catch (err) {
          log.warn({ message: `Failed to fetch user messages from Redis for user ${userId}`, error: err });
        }
      }
      return memoryList;
    }

    async clearUserRecentMessages(userId) {
      if (!userId) return;
      if (this.userMessageMap) {
        this.userMessageMap.delete(userId);
      }
      if (this.client && typeof this.client.del === 'function') {
        try {
          const key = `user_msgs:${userId}`;
          await this.client.del(key);
        } catch (err) {
          log.warn({ message: `Failed to clear user messages from Redis for user ${userId}`, error: err });
        }
      }
    }

    async getMessage(id){
      const msgJson = await this.client.get(id);
      const msg = JSON.parse(msgJson);
      return msg;
    }

    async cacheAttachment(attachmentId, buffer, ttl = config.attachmentCacheExpiration || 86400) {
      const key = `attachment:${attachmentId}`;
      await this.client.set(key, buffer, { EX: ttl });
    }

    async getAttachment(attachmentId) {
      const key = `attachment:${attachmentId}`;
      const buffer = await this.client.get(commandOptions({ returnBuffers: true }), key);
      return buffer;
    }

    async hasAttachment(attachmentId) {
      const key = `attachment:${attachmentId}`;
      const exists = await this.client.exists(key);
      return exists === 1;
    }

    async downloadAndCacheAttachments(attachments) {
      const maxFileSize = config.maxAttachmentCacheSize || 25 * 1024 * 1024;
      const ttl = config.attachmentCacheExpiration || 86400;

      const downloadPromises = attachments.map(async (attachment) => {
        try {
          if (!attachment?.id || !attachment?.url) return;

          if (attachment.size && attachment.size > maxFileSize) {
            log.warn(`Attachment ${attachment.id} (${attachment.name || 'unnamed'}) exceeds max cache size (${attachment.size} > ${maxFileSize}), skipping.`);
            return;
          }

          if (await this.hasAttachment(attachment.id)) {
            return;
          }

          try {
            const res = await fetch(attachment.url, { signal: AbortSignal.timeout(10000) });
            if (!res.ok) {
              log.warn(`Failed to fetch attachment ${attachment.id} from ${attachment.url}: HTTP ${res.status}`);
              return;
            }

            const buffer = Buffer.from(await res.arrayBuffer());
            if (buffer.length > maxFileSize) {
              log.warn(`Attachment ${attachment.id} downloaded size (${buffer.length}) exceeds max limit (${maxFileSize}), skipping.`);
              return;
            }

            await this.cacheAttachment(attachment.id, buffer, ttl);
            log.debug(`Cached attachment ${attachment.id} (${attachment.name || 'unnamed'}, ${buffer.length} bytes, TTL ${ttl}s)`);
          } catch (fetchErr) {
            log.warn({ message: `Error downloading attachment ${attachment.id} (${attachment.url})`, error: fetchErr });
          }
        } catch (err) {
          log.warn({ message: `Error processing attachment ${attachment?.id} for caching`, error: err });
        }
      });

      await Promise.allSettled(downloadPromises);
    }

    async getAttachmentFiles(attachments) {
      const files = [];
      let extraContent = '';
      let totalFileSize = 0;
      const MAX_PAYLOAD_SIZE = 24 * 1024 * 1024; // 24MB safe headroom for Discord 25MB limit

      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          let buffer = null;
          if (attachment?.id) {
            try {
              buffer = await this.getAttachment(attachment.id);
            } catch (err) {
              log.warn({ message: `Error retrieving cached attachment ${attachment.id}`, error: err });
            }
          }

          if (buffer) {
            if (totalFileSize + buffer.length <= MAX_PAYLOAD_SIZE && files.length < 10) {
              const filename = attachment.name || `attachment_${attachment.id}`;
              files.push(new AttachmentBuilder(buffer, { name: filename }));
              totalFileSize += buffer.length;
            } else {
              extraContent += `📁 ${attachment.name || 'Attachment'} (${attachment.id}): Exceeded upload size/count limit\n`;
            }
          } else {
            if (attachment?.url) {
              extraContent += `${attachment.url} *(File not cached or expired)*\n`;
            }
          }
        }
      }

      return { files, extraContent };
    }
    
    async addSwear(userID){
      await this.client.incr(userID);
    }

    async getSwear(userID){
      const count = await this.client.get(userID);
      return count;
    }
    
    static getInstance() {
      if(!instance) {
          instance = new RedisCache();
      }
      return instance;
    }
}

module.exports = RedisCache;