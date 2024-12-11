const { Collection } = require('discord.js');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('../../structures/logging').getInstance().logger;


const subcommands = new Collection();

let playlistCommand = new SlashCommandBuilder()
                    .setName('playlist')
                    .setDescription('PLaylist of the Month commands');

const subcommandFiles = fs.readdirSync('./commands/playlist').filter(file => file.endsWith('.js'));
for (const file of subcommandFiles) {
    if (file != 'index.js') {
        try {
            const subcommand = require(`./${file}`);
            subcommands.set(`${file}`, subcommand);
            playlistCommand = subcommand.builder(playlistCommand);
            log.debug(`Command /playlist ${file} loaded`);
        } catch (e) {
            log.warn({message: `Could not load /playlist ${file}`, error:e});
        }
    }
}


const subcommandFolders = fs.readdirSync('./commands/playlist',  { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name);
for (const file of subcommandFolders) {
    try {
        const subcommand = require(`./${file}`);
        subcommands.set(`${file}`, subcommand);
        playlistCommand = subcommand.builder(playlistCommand);
        log.debug(`Command /playlist ${file} loaded`);
    } catch (e) {
        log.warn({message: `Could not load /playlist ${file}`, error:e});
        console.error(e);
    }
}


module.exports = {
	data: playlistCommand,
    async execute(interaction) {
        let subcommandName = interaction.options.getSubcommandGroup();
        if (subcommandName == null) {
            subcommandName = interaction.options.getSubcommand() + '.js';
        }

        let command = subcommands.get(subcommandName);
        interaction.client.log.debug(`playlist subcommand ${subcommandName} ran`);
        await command.execute(interaction);
      }
};