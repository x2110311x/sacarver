const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'guildBanAdd',
  once: false,
  async execute(ban, client) {
    client.log.debug(`Received guildBanAdd event for user: ${ban.user ? ban.user.id : ban.id}`);

    try {
      if (ban.partial) {
        try {
          await ban.fetch();
        } catch (fetchBanErr) {
          client.log.warn({ message: `Failed to fetch partial ban for ${ban.user ? ban.user.id : 'unknown'}`, error: fetchBanErr });
        }
      }

      if (ban.user && ban.user.partial) {
        try {
          await ban.user.fetch();
        } catch (fetchUserErr) {
          client.log.warn({ message: `Failed to fetch partial ban user for ${ban.user.id}`, error: fetchUserErr });
        }
      }

      const targetUser = ban.user;
      const targetUserId = targetUser ? targetUser.id : ban.id;
      const targetUserTag = targetUser ? (targetUser.tag || targetUser.username) : targetUserId;

      let entry = null;
      if (ban.guild) {
        try {
          const fetchAuditEntry = async () => {
            const auditLogs = await ban.guild.fetchAuditLogs({
              type: AuditLogEvent.MemberBanAdd,
              limit: 6
            });
            return auditLogs.entries.find(e => 
              (e.target && e.target.id === targetUserId) || (e.targetId === targetUserId)
            );
          };

          entry = await fetchAuditEntry();
          // If not found immediately, or if the entry is older than 30s, wait 1s and retry once
          if (!entry || (Date.now() - entry.createdTimestamp > 30000)) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const retryEntry = await fetchAuditEntry();
            if (retryEntry) entry = retryEntry;
          }
        } catch (auditError) {
          client.log.warn({ message: `Error fetching audit logs for guildBanAdd on user ${targetUserId}`, error: auditError });
        }
      }

      const executor = entry ? entry.executor : null;
      const isBot = executor ? Boolean(executor.bot) : false;
      const banReason = (entry && entry.reason) ? entry.reason : (ban.reason || 'No reason provided');

      // Safeguard: Honeypot module handles its own note and ban-log message
      if (executor && client.user && executor.id === client.user.id && banReason.toLowerCase().includes('honeypot channel')) {
        client.log.debug(`Ignoring honeypot ban for ${targetUserId} in guildBanAdd as it is already handled`);
        return;
      }

      const noterId = executor ? executor.id : (client.user ? client.user.id : (client.config && client.config.clientID));
      const noteText = !isBot ? `User was manually banned. Reason: ${banReason}` : `User was banned. Reason: ${banReason}`;
      const timestamp = Math.floor(Date.now() / 1000);

      // 1. Add note to that user saying they were banned and log the reason
      try {
        await client.DB.Notes.create({
          User: targetUserId,
          Date: timestamp,
          Note: noteText,
          Severity: 'High',
          Link: 'N/A',
          Noter: noterId
        });
        client.log.info(`Added ban note to database for user ${targetUserId}`);
      } catch (noteErr) {
        client.log.error({ message: `Failed to insert ban note into database for user ${targetUserId}`, error: noteErr });
      }

      // 2. If the ban was not done by a bot user, log it in the ban-log channel and note that it was a manual ban
      if (!isBot) {
        try {
          const banLogChannelId = (client.config && client.config.channels && client.config.channels.banLog) || '689685441485733952';
          const banLogChannel = await client.channels.fetch(banLogChannelId);
          if (banLogChannel) {
            const executorTag = executor ? (executor.tag || executor.username) : 'Unknown';
            const executorDisplay = executor ? `<@${executor.id}> - ${executorTag} (${executor.id})` : 'Unknown';
            const userDisplay = `<@${targetUserId}> - ${targetUserTag} (${targetUserId})`;

            const banLogEmbed = new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('User Banned (Manual Ban)')
              .setDescription('A user was manually banned.')
              .addFields(
                { name: 'User', value: userDisplay, inline: false },
                { name: 'Banned By', value: executorDisplay, inline: false },
                { name: 'Reason', value: banReason, inline: false },
                { name: 'Ban Type', value: 'Manual Ban', inline: true },
                { name: 'Date Banned', value: `<t:${timestamp}:F>`, inline: true }
              )
              .setTimestamp()
              .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: client.icon ? `${client.icon}` : undefined });

            if (targetUser && typeof targetUser.displayAvatarURL === 'function') {
              banLogEmbed.setThumbnail(targetUser.displayAvatarURL());
            }

            await banLogChannel.send({ embeds: [banLogEmbed] });
            client.log.info(`Logged manual ban for user ${targetUserId} to ban-log channel`);
          } else {
            client.log.warn({ message: `Ban log channel ${banLogChannelId} could not be fetched` });
          }
        } catch (logErr) {
          client.log.error({ message: `Error logging manual ban to ban-log channel for user ${targetUserId}`, error: logErr });
        }
      }
    } catch (err) {
      client.log.error({ message: 'Unexpected error in guildBanAdd event handler', error: err });
    }
  }
};
