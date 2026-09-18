const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'guildMemberRemove',
	once: false,
	async execute(member, client) {
		client.log.debug(`User leave: ${member.id}`);

		try {
			const leftTimestamp = Math.floor(Date.now() / 1000);
			const embedLeave = new EmbedBuilder()
				.setColor(0x753543)
				.setTitle('User Left')
				.setAuthor({ name: member.user ? member.user.username : member.displayName, iconURL: member.user ? member.user.displayAvatarURL() : member.displayAvatarURL() })
				.addFields(
					{ name: 'User ID', value: `${member.id}`, inline: false },
					{ name: 'Left At', value: `<t:${leftTimestamp}:F>`, inline: false }
				)
				.setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: client.icon || undefined });

			const joinLeaveLogChannelId = client.config.channels.joinLeaveLog || client.config.channels.weatheredFlag;
			if (joinLeaveLogChannelId) {
				const joinLeaveLog = await client.channels.fetch(joinLeaveLogChannelId);
				if (joinLeaveLog) {
					await joinLeaveLog.send({ embeds: [embedLeave] });
				}
			}
		} catch (err) {
			client.log.error({ message: 'Error logging guildMemberRemove embed', error: err });
		}

		if (member.guild) {
			client.user.setActivity(`${member.guild.memberCount} members`, { type: 'WATCHING' });
		}
	},
};