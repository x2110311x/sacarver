const { Collection } = require('discord.js');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');

const log = require('../../structures/logging').getInstance().logger;


const subcommands = new Collection();

let utilityCommand = new SlashCommandBuilder()
                    .setName('utility')
                    .setDescription('Utility commands');

const subcommandFiles = fs.readdirSync('./commands/utility').filter(file => file.endsWith('.js'));
for (const file of subcommandFiles) {
    if (file != 'index.js') {
        try {
            const subcommand = require(`./${file}`);
            subcommands.set(`${file}`, subcommand);
            utilityCommand = subcommand.builder(utilityCommand);
            log.debug(`Command /utility ${file} loaded`);

        } catch (e) {
            log.warn({message: `Could not load /utility ${file}`, error:e});
            console.error(e);
        }
    }
}


const subcommandFolders = fs.readdirSync('./commands/utility',  { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name);
for (const file of subcommandFolders) {
    try {
        const subcommand = require(`./${file}`);
        subcommands.set(`${file}`, subcommand);
        utilityCommand = subcommand.builder(utilityCommand);
        log.debug(`Command /utility ${file} loaded`);
    } catch (e) {
        log.warn({message: `Could not load /utility ${file}`, error:e});
        console.error(e);
    }
}

module.exports = {
	data: utilityCommand,
    async execute(interaction) {
        let subcommandName = interaction.options.getSubcommandGroup() ?? interaction.options.getSubcommand() + '.js';
        let command = subcommands.get(subcommandName);
        await command.execute(interaction);
	},
};