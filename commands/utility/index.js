const { Collection } = require('discord.js');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');

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
        } catch (e) {
            console.log('Could not load utility subcommand %s', file);
            console.error(e);
        }
    }
}


const subcommandFolders = fs.readdirSync('./commands/utility',  { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name);
for (const file of subcommandFolders) {
    try {
        const subcommand = require(`./${file}`);
        subcommands.set(`${file}`, subcommand);
        console.log(file);
        utilityCommand = subcommand.builder(utilityCommand);
    } catch (e) {
        console.log('Could not load fun subcommand %s', file);
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