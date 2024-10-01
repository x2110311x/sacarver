const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('./config.json');
const fs = require('fs');

const log = require('./structures/logging').getInstance().logger;

const commands = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(config.token);

(async () => {
	try {
		log.info('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(config.clientID, config.guildID),
			{ body: commands },
		);

		log.info('Successfully reloaded application (/) commands.');
	}
	catch (err) {
		log.error({message: "Error deploying commands", error: err});
	}
})();