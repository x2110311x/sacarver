const { Collection } = require('discord.js');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('../../structures/logging').getInstance().logger;


const subcommands = new Collection();

let staffCommand = new SlashCommandBuilder()
                    .setName('staff')
                    .setDescription('Staff commands');

const subcommandFiles = fs.readdirSync('./commands/staff').filter(file => file.endsWith('.js'));
for (const file of subcommandFiles) {
    if (file != 'index.js') {
        try {
            const subcommand = require(`./${file}`);
            subcommands.set(`${file}`, subcommand);
            staffCommand = subcommand.builder(staffCommand);
            log.debug(`Command /staff ${file} loaded`);
        } catch (e) {
            log.warn({message: `Could not load /staff ${file}`, error:e});
        }
    }
}


const subcommandFolders = fs.readdirSync('./commands/staff',  { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name);
for (const file of subcommandFolders) {
    try {
        const subcommand = require(`./${file}`);
        subcommands.set(`${file}`, subcommand);
        staffCommand = subcommand.builder(staffCommand);
        log.debug(`Command /staff ${file} loaded`);
    } catch (e) {
        log.warn({message: `Could not load /staff ${file}`, error:e});
        console.error(e);
    }
}

module.exports = {
	data: staffCommand,
    async execute(interaction) {
        let subcommandName = interaction.options.getSubcommand() + '.js';
        let command = subcommands.get(subcommandName);
        await command.execute(interaction);
	},
};