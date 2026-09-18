const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'guildMemberUpdate',
	once: false,
	async execute(oldMember, newMember, client) {
		// 1. New Member Role Expiry Check (> 6 hours)
		const newMemberRoleId = client.config.roles.newMember || '430170511385952267';
		if (newMember.roles.cache.has(newMemberRoleId) && newMember.joinedTimestamp) {
			const memberAgeHours = (Date.now() - newMember.joinedTimestamp) / (1000 * 60 * 60);
			if (memberAgeHours > 6) {
				try {
					await newMember.roles.remove(newMemberRoleId, 'Member age is greater than 6 hours');
					client.log.info(`Removed newMember role from ${newMember.id} (Member age > 6 hours)`);
				} catch (err) {
					client.log.error({ message: `Error removing newMember role for ${newMember.id}`, error: err });
				}
			}
		}

		// 2. Nickname Change Logging
		if (oldMember.nickname !== newMember.nickname) {
			const embed = new EmbedBuilder()
				.setTitle('User Changed Nickname')
				.setColor(0x01b725)
				.addFields(
					{ name: 'Previous nickname', value: `${oldMember.displayName}`, inline: false },
					{ name: 'Current nickname', value: `${newMember.displayName}`, inline: false },
					{ name: 'User ID', value: `${newMember.id}`, inline: false }
				)
				.setAuthor({ name: newMember.displayName, iconURL: newMember.displayAvatarURL() })
				.setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: client.icon || undefined });

			try {
				const nickLogChannelId = client.config.channels.nickLog || '889889333606240276';
				const nickLogChannel = await client.channels.fetch(nickLogChannelId);
				if (nickLogChannel) {
					await nickLogChannel.send({ embeds: [embed] });
				}
			} catch (err) {
				client.log.error({ message: 'Error sending nickname log embed', error: err });
			}
		}
	},
};
