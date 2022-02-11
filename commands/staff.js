const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const statusCommands = require('./staff/status');


const ban = require('./staff/ban')
const say = require('./staff/say')
const dm = require('./staff/dm')
const fix = require('./staff/fix')

staffCommand = new SlashCommandBuilder()
                    .setName('staff')
                    .setDescription('Staff commands')

staffCommand = ban.builder(staffCommand)
staffCommand = say.builder(staffCommand)
staffCommand = dm.builder(staffCommand)
staffCommand = fix.builder(staffCommand)

module.exports = {
	data: staffCommand,
	
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'ban'){
            await ban.execute(interaction);
        } else if (interaction.options.getSubcommandGroup() === 'status'){
            await statusCommands(interaction)
        }
	},
};