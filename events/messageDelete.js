const { EmbedBuilder, AuditLogEvent } = require('discord.js');

const Sacarver = require("../structures/bot");
const client = Sacarver.getInstance().client;

module.exports = {
	name: 'messageDelete',
	once: false,
	async execute(message) {
    client.log.debug("Received messageDelete event");

    try {
      if (message.author?.bot) {
        client.log.debug("Ignoring message delete for bot user");
        return;
      }

      let cachedMessage = null;
      try {
        cachedMessage = await client.cache.getMessage(message.id);
      } catch (err) {
        client.log.warn({ message: `Error fetching cached message ${message.id}`, error: err });
      }

      let authorId = message.author?.id || cachedMessage?.author || null;
      let authorDisplay = authorId ? `<@${authorId}> - ${authorId}` : 'Unknown User';

      if (authorId) {
        const cachedUser = client.users.cache.get(authorId);
        if (cachedUser?.bot) {
          client.log.debug("Ignoring message delete for bot user (from cache)");
          return;
        }
      }

      let channelId = message.channel?.id || message.channelId || cachedMessage?.channel || null;
      let channelDisplay = channelId ? `<#${channelId}> - ${channelId}` : 'Unknown Channel';

      let deletedByDisplay = authorDisplay;

      if (message.guild) {
        try {
          const audit = await message.guild.fetchAuditLogs({
            type: AuditLogEvent.MessageDelete,
            limit: 1
          });
          const entry = audit?.entries?.first();

          if (entry && entry.extra?.channel?.id === (message.channel?.id || channelId)
            && (!authorId || entry.target?.id === authorId)
            && (Date.now() - entry.createdTimestamp < 5000)
            && entry.extra?.count >= 1) {
              deletedByDisplay = `<@${entry.executor.id}> - ${entry.executor.id}`;
          }
        } catch (auditError) {
          client.log.warn({ message: "Error fetching audit logs for message delete", error: auditError });
        }
      }

      let content = "`Message not cached`";
      let hadAttachments = "Unknown";
      let attachments = [];

      if (cachedMessage) {
        attachments = cachedMessage.attachments || [];
        hadAttachments = attachments.length > 0 ? 'Yes' : 'No';
        if (cachedMessage.content && cachedMessage.content !== "") {
          content = cachedMessage.content;
          if (content.length > 1024) {
            content = content.substring(0, 1021) + "...";
          }
        } else {
          content = "`Blank`";
        }
      } else if (message.content) {
        content = message.content;
        if (content.length > 1024) {
          content = content.substring(0, 1021) + "...";
        }
        attachments = message.attachments ? Array.from(message.attachments.values()) : [];
        hadAttachments = attachments.length > 0 ? 'Yes' : 'No';
      }

      const timestamp = Math.floor(Date.now() / 1000);

      const deleteLogEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('Message Deleted')
        .addFields(
          { name: 'Channel', value: `${channelDisplay}` },
          { name: 'Message ID', value: `${message.id}` },
          { name: 'User', value: `${authorDisplay}` },
          { name: 'Message Text', value: `${content}` },
          { name: 'Date Deleted', value: `<t:${timestamp}:F>` },
          { name: 'Had Attachments', value: `${hadAttachments}` },
          { name: 'Deleted By', value: `${deletedByDisplay}` }
        )
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: client.icon ? `${client.icon}` : undefined });

      let extraContent = "";
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment?.url) {
            extraContent += `${attachment.url}\n`;
          }
        }
      }

      const deleteLogChannelId = client.config.channels?.deleteLog;
      if (deleteLogChannelId) {
        const deleteLogChannel = await client.channels.fetch(deleteLogChannelId);
        if (deleteLogChannel) {
          const payload = { embeds: [deleteLogEmbed] };
          if (extraContent.trim().length > 0) {
            payload.content = extraContent.trim();
          }
          await deleteLogChannel.send(payload);
        }
      }
    } catch (error) {
      client.log.error({ message: "Error processing messageDelete event", error: error });
    }
  }
};