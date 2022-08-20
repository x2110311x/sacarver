const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, IntentsBitField, Collection } = require('discord.js');
const config = require('./config.json');
const fs = require('fs');

const myIntents = new IntentsBitField();
myIntents.add( IntentsBitField.Flags.GuildPresences, IntentsBitField.Flags.GuildMembers, 
	IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages );

const client = new Client({ intents: myIntents });
client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}
const rest = new REST({ version: '9' }).setToken(config.token);

// eslint-disable-next-line no-unused-vars
const commands = client.commands.map(({ execute, ...data }) => data);

(async () => {
	try {
		console.log('Started removing guild (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(config.clientID, config.guildID),
			{ body: [] },
		);

		console.log('Successfully removed guild (/) commands.');

		console.log('Started removing application (/) commands.');

		await rest.put(
			Routes.applicationCommands(config.clientID),
			{ body: [] },
		);

		console.log('Successfully removed application (/) commands.');
	}
	catch (error) {
		console.error(error);
	}
})();