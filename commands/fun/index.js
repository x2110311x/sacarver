const { Collection } = require('discord.js');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');

const subcommands = new Collection();

let funCommand = new SlashCommandBuilder()
                    .setName('fun')
                    .setDescription('Fun commands');

const subcommandFiles = fs.readdirSync('./commands/fun').filter(file => file.endsWith('.js'));
for (const file of subcommandFiles) {
    if (file != 'index.js') {
        try {
            const subcommand = require(`./${file}`);
            subcommands.set(`${file}`, subcommand);
            funCommand = subcommand.builder(funCommand);
        } catch (e) {
            console.log('Could not load fun subcommand %s', file);
            console.error(e);
        }
    }
}
module.exports = {
	data: funCommand,
    async execute(interaction) {
        let subcommandName = interaction.options.getSubcommand() + '.js';
        let command = subcommands.get(subcommandName);
        await command.execute(interaction);
	},
};