const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const teamCommands = require('./staff/team');
const statusCommands = require('./staff/status');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('staff')
		.setDescription('Staff commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user that\'s not in the server')
                .addIntegerOption(option =>
                    option.setName('user')
                        .setDescription('The ID of the user to ban')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('fixvc')
                .setDescription('Fix the VC role members'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('fixbandito')
                .setDescription('Check for users without Banditos role')
                .addBooleanOption(option =>
                    option.setName('fix')
                        .setDescription('Should I fix it immediately')))
		.addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('team')
                .setDescription('Team Planning Commands')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('Add planning item')))
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('status')
                .setDescription('Set the bot status')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('membercount')
                        .setDescription('Set the status to the member count'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('custom')
                        .setDescription('Set a custom status')
                    
                        .addStringOption( option =>
                            option
                                .setName('activity')
                                .setDescription('Set the type of activity')
                                .setRequired(true)
                                .addChoice('Playing', 'PLAYING')
                                .addChoice('Listening', 'LISTENING')
                                .addChoice('Watching', 'WATCHING')
                                .addChoice('Competing', 'COMPETING'))
                        .addStringOption(option =>
                            option
                                .setName('status')
                                .setDescription('The status to set')
                                .setRequired(true)))),
	
	
    async execute(interaction) {
        if (interaction.options.getSubcommandGroup() === 'events'){
            await teamCommands(interaction)
        } else if (interaction.options.getSubcommandGroup() === 'status'){
            await statusCommands(interaction)
        }
	},
};