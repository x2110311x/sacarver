const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'guildMemberAdd',
	once: false,
	async execute(member, client) {
		client.log.debug(`User join: ${member.id}`);

		try {
			const joinedTimestamp = Math.floor((member.joinedTimestamp || Date.now()) / 1000);
			const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
			let dateCreated = `<t:${createdTimestamp}:F>`;

			const ONE_WEEK_MS = 604800 * 1000;
			if (Date.now() - member.user.createdTimestamp < ONE_WEEK_MS) {
				dateCreated += '\n***ACCOUNT CREATED LESS THAN 1 WEEK AGO***';
			}

			const embedJoin = new EmbedBuilder()
				.setColor(0x753543)
				.setTitle('User Joined')
				.setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
				.addFields(
					{ name: 'User ID', value: `${member.id}`, inline: false },
					{ name: 'Joined At', value: `<t:${joinedTimestamp}:F>`, inline: false },
					{ name: 'User Account Created At', value: dateCreated, inline: false }
				)
				.setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: client.icon || undefined });

			const joinLeaveLogChannelId = client.config.channels.joinLeaveLog || client.config.channels.weatheredFlag;
			if (joinLeaveLogChannelId) {
				const joinLeaveLog = await client.channels.fetch(joinLeaveLogChannelId);
				if (joinLeaveLog) {
					await joinLeaveLog.send({ embeds: [embedJoin] });
				}
			}
		} catch (err) {
			client.log.error({ message: 'Error logging guildMemberAdd embed', error: err });
		}

		if (member.guild) {
			client.user.setActivity(`${member.guild.memberCount} members`, { type: 'WATCHING' });
		}
	},
};