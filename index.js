const fs = require('fs');
const { Collection } = require('discord.js');

const Sacarver = require("./structures/bot");
const config = require('./config.json');
const logging = require('./structures/logging');
const db = require('./helpers/db')();

const client = Sacarver.getInstance().client;
client.config = config;
client.log = logging.getInstance().logger;
client.db = db;

const commandFiles = fs.readdirSync('./commands',  { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name);
for (const file of commandFiles) {
	try{
		const command = require(`./commands/${file}`);
		client.commands.set(command.data.name, command);
		client.commandData.push(command.data.toJSON());
	} catch (e) {
		client.log.warn({message: `Could not load /${file}`, error:e});
	}
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	try {
		const event = require(`./events/${file}`);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args, client));
			client.log.debug(`Loaded run once event handler: ${file}`);
		}
		else {
			client.on(event.name, (...args) => event.execute(...args, client));
			client.log.debug(`Loaded event handler: ${file}`);

		}
	} catch(e){
		client.log.warn({message: `Could not load event ${file}`, error:e});
	}
}

client.codes = [];
client.db.each(`SELECT * FROM Codes`, (error, row) => {
	if (error) {
		throw new Error(error.message);
	}
	client.codes.push(row.code);
});

client.login(config.token);