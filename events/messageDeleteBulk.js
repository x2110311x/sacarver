const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
	name: 'messageDeleteBulk',
	once: false,
	async execute(messages, channel, client) {
		client.log.debug(`Received messageDeleteBulk event with ${messages.size} messages in channel ${channel.id}`);

		try {
			const deleteLogChannelId = client.config.channels?.deleteLog ?? '470417935865741312';
			const deleteLogChannel = await client.channels.fetch(deleteLogChannelId);
			if (!deleteLogChannel) return;

			let bulkDeletedByDisplay = null;
			if (channel.guild) {
				try {
					const audit = await channel.guild.fetchAuditLogs({
						type: AuditLogEvent.MessageBulkDelete,
						limit: 1
					});
					const entry = audit?.entries?.first();
					if (entry && entry.target?.id === channel.id
						&& (Date.now() - entry.createdTimestamp < 5000)) {
						bulkDeletedByDisplay = `<@${entry.executor.id}> - ${entry.executor.id}`;
					}
				} catch (auditError) {
					client.log.warn({ message: "Error fetching audit logs for message bulk delete", error: auditError });
				}
			}

			const channelId = channel?.id ?? null;
			const channelDisplay = channelId ? `<#${channelId}>` : 'Unknown Channel';

			for (const message of messages.values()) {
				if (message.author?.bot) {
					client.log.debug("Ignoring message delete for bot user");
					continue;
				}

				let cachedMessage = null;
				try {
					cachedMessage = await client.cache.getMessage(message.id);
				} catch (err) {
					client.log.warn({ message: `Error fetching cached message ${message.id} in bulk delete`, error: err });
				}

				let authorId = message.author?.id ?? cachedMessage?.author?.id ?? cachedMessage?.author ?? null;
				let authorDisplay = authorId ? `<@${authorId}>` : 'Unknown User';

				if (authorId) {
					const cachedUser = client.users.cache.get(authorId);
					if (cachedUser?.bot) {
						client.log.debug("Ignoring message delete for bot user (from cache)");
						continue;
					}
				}

				let deletedByDisplay = bulkDeletedByDisplay ?? authorDisplay;

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
					.setColor(0xffa000)
					.setTitle('Message Deleted in Bulk')
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

				const payload = { embeds: [deleteLogEmbed] };
				if (extraContent.trim().length > 0) {
					payload.content = extraContent.trim();
				}
				await deleteLogChannel.send(payload);
			}
		} catch (err) {
			client.log.error({ message: 'Error processing messageDeleteBulk event', error: err });
		}
	},
};
