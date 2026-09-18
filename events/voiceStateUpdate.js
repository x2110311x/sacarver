const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async execute(oldState, newState, client) {
		const member = newState.member || oldState.member;
		if (!member) return;

		const oldChannel = oldState.channel;
		const newChannel = newState.channel;

		// Check if voice channel state actually changed
		if (oldChannel?.id === newChannel?.id) return;

		let embed;
		const vcRoleId = client.config.roles.vc || '465268535543988224';

		if (!oldChannel && newChannel) {
			// User Joined VC
			embed = new EmbedBuilder()
				.setTitle('User Joined VC')
				.setColor(0x01b725)
				.addFields(
					{ name: 'Channel ID', value: `${newChannel.id}`, inline: false },
					{ name: 'Channel Name', value: `${newChannel.name}`, inline: false }
				);

			setTimeout(async () => {
				try {
					if (!member.roles.cache.has(vcRoleId)) {
						await member.roles.add(vcRoleId);
					}
				} catch (err) {
					client.log.error({ message: 'Error adding VC role', error: err });
				}
			}, 2000);
		} else if (oldChannel && !newChannel) {
			// User Left VC
			embed = new EmbedBuilder()
				.setTitle('User Left VC')
				.setColor(0x01b725)
				.addFields(
					{ name: 'Channel ID', value: `${oldChannel.id}`, inline: false },
					{ name: 'Channel Name', value: `${oldChannel.name}`, inline: false }
				);

			setTimeout(async () => {
				try {
					if (member.roles.cache.has(vcRoleId)) {
						await member.roles.remove(vcRoleId);
					}
				} catch (err) {
					client.log.error({ message: 'Error removing VC role', error: err });
				}
			}, 2000);
		} else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
			// User Moved VC
			embed = new EmbedBuilder()
				.setTitle('User Moved VC')
				.setColor(0x01b725)
				.addFields(
					{ name: 'Old Channel ID', value: `${oldChannel.id}`, inline: false },
					{ name: 'Old Channel Name', value: `${oldChannel.name}`, inline: false },
					{ name: 'New Channel ID', value: `${newChannel.id}`, inline: false },
					{ name: 'New Channel Name', value: `${newChannel.name}`, inline: false }
				);
		}

		if (embed) {
			const timestamp = Math.floor(Date.now() / 1000);
			embed.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() })
				.addFields(
					{ name: 'User ID', value: `${member.id}`, inline: false },
					{ name: 'Time', value: `<t:${timestamp}:F>`, inline: false }
				)
				.setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: client.icon || undefined });

			try {
				const vcLogChannelId = client.config.channels.vcLog || '869661570307850260';
				const vcLogChannel = await client.channels.fetch(vcLogChannelId);
				if (vcLogChannel) {
					await vcLogChannel.send({ embeds: [embed] });
				}
			} catch (err) {
				client.log.error({ message: 'Error sending VC log embed', error: err });
			}
		}
	},
};
