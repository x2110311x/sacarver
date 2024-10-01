const config = require('../config.json');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		await client.cache.client.connect();
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