const { ActivityType } = require('discord.js');

/**
 * Updates the bot's status to the current guild member count.
 * Fetches the guild to ensure an accurate member count.
 *
 * @param {import('discord.js').Client} client
 * @param {string} [guildId]
 */
async function updateMemberCountStatus(client, guildId) {
  try {
    const targetGuildId = guildId || client.config?.guildID;
    if (!targetGuildId) return;

    const guild = await client.guilds.fetch(targetGuildId);
    if (!guild) return;

    client.user.setActivity(`${guild.memberCount} members`, { type: ActivityType.Watching });
    client.log?.debug(`Updated bot status to "${guild.memberCount} members"`);
  } catch (err) {
    client.log?.error({ message: 'Failed to update member count status', error: err });
  }
}

module.exports = {
  updateMemberCountStatus
};
