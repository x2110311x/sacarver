const config = require('../config.json');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		client.log.info('Logged in as ' + client.user.username);
		const rest = new REST({version: '9'}).setToken(config.token);
		try {
			await rest.put(
				Routes.applicationGuildCommands(config.clientID, config.guildID), {
					body: client.commandData,
				},
			);
			client.log.info('Successfully registered application commands globally');
		} catch (err) {
			client.log.error({message: "Error deploying commands", error: err});
		}
		client.startTime = new Date();
		client.icon = client.user.avatarURL();
		console.log(client.codes);
	},
};