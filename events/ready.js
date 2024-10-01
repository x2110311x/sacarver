const config = require('../config.json');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		client.log.info('Logged in as ' + client.user.username);
		// eslint-disable-next-line no-unused-vars
		const rest = new REST({
			version: '9',
		}).setToken(config.token);
		(async () => {
			try {
				await rest.put(
					Routes.applicationGuildCommands(config.clientID, config.guildID), {
						body: client.commandData,
					},
				);
				client.log.info('Successfully registered application commands globally');
			// eslint-disable-next-line brace-style
			} catch (error) {
				if (error) console.error(error);
			}
		})();
		client.guilds.fetch(config.guildID).then(guild => {
			guild.members.fetch().then(() => {
				client.log.info('Fetched all guild members');
				client.user.setActivity(`${guild.memberCount} members`, { type: 'WATCHING' });
			});
			guild.roles.fetch().then(roles => {
				client.roles = roles;
			}).then(() => {	
				client.log.info('Role Collection Populated');
			});
			guild.channels.fetch().then(channels => {
				client.guildchannels = channels;
			}).then(() => {
				client.log.info('Channel Collection populated');
			});
		});
		client.startTime = new Date();
		client.icon = client.user.avatarURL();
	},
};