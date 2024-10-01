const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config.json');

const log = require('./structures/logging').getInstance().logger;

const rest = new REST({ version: '9' }).setToken(config.token);

(async () => {
	try {
		log.info('Started removing guild (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(config.clientID, config.guildID),
			{ body: [] },
		);

		log.info('Successfully removed guild (/) commands.');

		log.info('Started removing application (/) commands.');

		await rest.put(
			Routes.applicationCommands(config.clientID),
			{ body: [] },
		);

		log.info('Successfully removed application (/) commands.');
	}
	catch (err) {
		log.error({message: "Error removing  commands", error: err});
	}
})();