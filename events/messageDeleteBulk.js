const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'messageDeleteBulk',
	once: false,
	async execute(messages, channel, client) {
		client.log.debug(`Received messageDeleteBulk event with ${messages.size} messages in channel ${channel.id}`);

		try {
			const deleteLogChannelId = client.config.channels.deleteLog || '470417935865741312';
			const deleteLogChannel = await client.channels.fetch(deleteLogChannelId);
			if (!deleteLogChannel) return;

			for (const message of messages.values()) {
				let cachedMessage = null;
				try {
					cachedMessage = await client.cache.getMessage(message.id);
				} catch (err) {
					client.log.error({ message: `Error fetching cached message ${message.id} in bulk delete`, error: err });
				}

				const embed = new EmbedBuilder()
					.setTitle('Message Deleted')
					.setColor(0x01b725)
					.addFields(
						{ name: 'Channel', value: `<#${channel.id}> - ${channel.id}`, inline: false },
						{ name: 'Message ID', value: `${message.id}`, inline: false }
					)
					.setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: client.icon || undefined });

				if (cachedMessage && cachedMessage.author) {
					embed.setAuthor({
						name: cachedMessage.author.displayName || cachedMessage.author.name || 'Unknown User',
						iconURL: cachedMessage.author.avatarURL || undefined
					});
					embed.addFields(
						{ name: 'User ID', value: `${cachedMessage.author.id}`, inline: false },
						{ name: 'Message Text', value: cachedMessage.content || '*Message had no text content*', inline: false }
					);
				} else if (message.author) {
					embed.setAuthor({
						name: message.author.displayName || message.author.username,
						iconURL: message.author.displayAvatarURL()
					});
					embed.addFields(
						{ name: 'User ID', value: `${message.author.id}`, inline: false },
						{ name: 'Message Text', value: message.content || '*Message was not cached*', inline: false }
					);
				} else {
					const timestamp = Math.floor(Date.now() / 1000);
					embed.addFields(
						{ name: 'Message Text', value: '*Message was not cached*', inline: false },
						{ name: 'Time Deleted', value: `<t:${timestamp}:F>`, inline: false }
					);
				}

				await deleteLogChannel.send({ embeds: [embed] });
			}
		} catch (err) {
			client.log.error({ message: 'Error processing messageDeleteBulk event', error: err });
		}
	},
};
