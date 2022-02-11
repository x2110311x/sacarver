const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const teamCommands = require('./staff/team');
const statusCommands = require('./staff/status');


const ban = require('./staff/ban')

staffCommand = new SlashCommandBuilder()
                    .setName('staff')
                    .setDescription('Staff commands')
staffCommand = ban.builder(staffCommand)

module.exports = {
	data: staffCommand,
	
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'ban'){
            await ban.execute(interaction);
        }
        else if (interaction.options.getSubcommandGroup() === 'events'){
            await teamCommands(interaction)
        } else if (interaction.options.getSubcommandGroup() === 'status'){
            await statusCommands(interaction)
        }
	},
};