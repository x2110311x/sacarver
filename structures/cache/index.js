let instance = null;
const { createClient } = require('redis');

const log = require('../logging').getInstance().logger;

class RedisCache {

    constructor() {
      const client = createClient({
        host: '10.10.100.95',
        port: 6379
      });
      
      client.on('error', (err) => log.error('Redis Client Error', err));

      this.client = client;
    }

    async cacheMessage(message){
      const msg = {
        author: message.author.id,
        channel: message.channelId,
        content: message.content,
        createdTimestamp: message.createdTimestamp,
      };
      const msgJson = JSON.stringify(msg);
      await this.client.set(message.id, msgJson, {EX:3600, NX: true});
    }

    async getMessage(id){
      const msgJson = await this.client.get(id);
      const msg = JSON.parse(msgJson);
      return msg;
    }
    
    static getInstance() {
      if(!instance) {
          instance = new RedisCache();
      }
      return instance;
    }
}

module.exports = RedisCache;