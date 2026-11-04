/**
 * Helper to immediately react with configured emojis to an offender's recent messages
 * (within the last 60 seconds) when a positive moderation match occurs.
 */

/**
 * Reacts with configured emojis to all messages sent by userId within the specified time window.
 *
 * @param {object} client - The Discord client instance.
 * @param {string} userId - The Discord user ID of the offender.
 * @param {object|null} triggeringMessage - The Discord Message object that triggered the action (if available).
 * @param {number|null} windowMs - Time window in milliseconds (defaults to config or 60,000ms / 60 seconds).
 * @returns {Promise<{ reactedMessages: number, totalTargets: number }>}
 */
async function reactToRecentMessages(client, userId, triggeringMessage = null, windowMs = null) {
  if (!userId) return { reactedMessages: 0, totalTargets: 0 };

  const reactionWindow = windowMs ?? client.config?.autoModReactionWindowMs ?? 60000;
  const emojis = client.config?.autoModReactions ?? ['860015991031463947', '587034603861049604'];

  if (!Array.isArray(emojis) || emojis.length === 0) {
    if (client.log?.debug) {
      client.log.debug('[AutoModReact] No autoModReactions configured. Skipping reactions.');
    }
    return { reactedMessages: 0, totalTargets: 0 };
  }

  const now = Date.now();
  const cutoffTime = now - reactionWindow;

  // Map of unique target key "channelId_messageId" => { channelId, messageId, messageObj }
  const targets = new Map();

  // 1. Add triggering message if provided
  if (triggeringMessage) {
    const tChannelId = triggeringMessage.channelId || triggeringMessage.channel?.id;
    const tMessageId = triggeringMessage.id;
    if (tChannelId && tMessageId) {
      targets.set(`${tChannelId}_${tMessageId}`, {
        channelId: tChannelId,
        messageId: tMessageId,
        messageObj: triggeringMessage
      });
    }
  }

  // 2. Fetch tracked messages from cache for this user
  if (client.cache && typeof client.cache.getUserRecentMessages === 'function') {
    try {
      const recentMessages = await client.cache.getUserRecentMessages(userId);
      if (Array.isArray(recentMessages)) {
        for (const item of recentMessages) {
          if (!item.channelId || !item.messageId) continue;
          // Filter to messages within the time window
          const itemTime = item.timestamp ? Number(item.timestamp) : now;
          if (itemTime >= cutoffTime) {
            const key = `${item.channelId}_${item.messageId}`;
            if (!targets.has(key)) {
              targets.set(key, {
                channelId: item.channelId,
                messageId: item.messageId,
                messageObj: null
              });
            }
          }
        }
      }
    } catch (cacheErr) {
      if (client.log?.warn) {
        client.log.warn({ message: `[AutoModReact] Error retrieving recent messages from cache for user ${userId}`, error: cacheErr });
      }
    }
  }

  if (targets.size === 0) {
    if (client.log?.debug) {
      client.log.debug(`[AutoModReact] No messages found within ${reactionWindow / 1000}s for user ${userId}.`);
    }
    return { reactedMessages: 0, totalTargets: 0 };
  }

  if (client.log?.info) {
    client.log.info(`[AutoModReact] Reacting with [${emojis.join(', ')}] to ${targets.size} message(s) from user ${userId} within last ${reactionWindow / 1000}s`);
  }

  // 3. React concurrently across messages; sequentially per emoji on each message to maintain order
  const reactPromises = Array.from(targets.values()).map(async (target) => {
    try {
      let msg = target.messageObj;

      if (!msg) {
        const channel =
          (client.channels?.cache && client.channels.cache.get(target.channelId)) ||
          (client.channels?.fetch ? await client.channels.fetch(target.channelId).catch(() => null) : null);

        if (!channel || !channel.messages) return false;

        msg =
          (channel.messages.cache && channel.messages.cache.get(target.messageId)) ||
          (channel.messages.fetch ? await channel.messages.fetch(target.messageId).catch(() => null) : null);
      }

      if (!msg || typeof msg.react !== 'function') return false;

      let reactionsSucceeded = 0;
      for (const emoji of emojis) {
        try {
          await msg.react(emoji);
          reactionsSucceeded++;
        } catch (reactErr) {
          if (client.log?.warn) {
            client.log.warn({
              message: `[AutoModReact] Failed to react with ${emoji} on message ${msg.id} in channel ${msg.channelId}`,
              error: reactErr
            });
          }
        }
      }

      return reactionsSucceeded > 0;
    } catch (err) {
      if (client.log?.warn) {
        client.log.warn({
          message: `[AutoModReact] Error processing reaction on message ${target.messageId}`,
          error: err
        });
      }
      return false;
    }
  });

  const results = await Promise.allSettled(reactPromises);
  const reactedCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

  if (client.log?.debug) {
    client.log.debug(`[AutoModReact] Completed reactions: successfully reacted to ${reactedCount}/${targets.size} message(s).`);
  }

  return { reactedMessages: reactedCount, totalTargets: targets.size };
}

module.exports = {
  reactToRecentMessages
};
