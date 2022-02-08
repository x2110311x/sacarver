const config = require('../config.json');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		console.log('Logged in as ' + client.user.username);
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
				console.log('Successfully registered application commands globally');
			// eslint-disable-next-line brace-style
			} catch (error) {
				if (error) console.error(error);
			}
		})();
		client.guilds.fetch(config.guildID).then(guild => {
			guild.members.fetch().then(() => {
				console.log('Fetched all guild members');
				client.user.setActivity(`${guild.memberCount} members`, { type: 'WATCHING' });
			});
			guild.roles.fetch().then(roles => {
				client.roles = roles;
			}).then(() => {
				console.log('Role Collection Populated');
			});
			guild.channels.fetch().then(channels => {
				client.guildchannels = channels;
			}).then(() => {
				console.log('Channel Collection populated');
			});
		});
	},
};