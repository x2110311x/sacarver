const config = require('../config.json');
const { EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const honeypot = require('../helpers/honeypot');
const { updateMemberCountStatus } = require('../helpers/status');

module.exports = {
	name: 'clientReady',
	once: true,
	async execute(client) {
		await client.cache.client.connect();
		client.log.info('Logged in as ' + client.user.username);
		client.startTime = new Date();
		client.icon = client.user.avatarURL();

		const weatheredFlag = await client.channels.fetch(client.config.channels.weatheredFlag);
		const embed = new EmbedBuilder()
			.setTitle("Bot has started")
			.setColor("#fce300")
			.setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` })
			.setTimestamp(client.startTime);
		try {
			await weatheredFlag.send({ embeds: [embed] });
		} catch (err) {
			client.log.error({ message: "Error sending startup message to weathered flag channel", error: err });
		}

		const rest = new REST({ version: '9' }).setToken(config.token);
		try {
			await rest.put(
				Routes.applicationGuildCommands(config.clientID, config.guildID), {
				body: client.commandData,
			},
			);
			client.log.info('Successfully registered application commands globally');
			await weatheredFlag.send("Successfully registered application commands");
		} catch (err) {
			client.log.error({ message: "Error deploying commands", error: err });
		}

		let guild = await client.guilds.fetch(config.guildID);
		await guild.members.fetch();
		client.log.info('Fetched all guild members');
		await weatheredFlag.send("Fetched all guild members");
		await updateMemberCountStatus(client, config.guildID);

		let roles = await guild.roles.fetch();
		client.roles = roles;
		client.log.info('Role Collection Populated');
		await weatheredFlag.send("Fetched all guild roles");

		let channels = await guild.channels.fetch();
		client.guildchannels = channels;
		client.log.info('Channel Collection populated');
		await weatheredFlag.send("Fetched all guild channels");

		try {
			const initialCount = await honeypot.getBannedCount(client);
			await honeypot.updateHoneypotChannel(client, initialCount);
			client.log.info(`Honeypot channel topic synced with DB count (${initialCount})`);
			await weatheredFlag.send(`Honeypot channel topic synced with DB count (${initialCount})`);
		} catch (err) {
			client.log.error({ message: "Error syncing honeypot topic on clientReady", error: err });
		}
	},
};