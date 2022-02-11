const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');


const ban = require('./staff/ban')
const say = require('./staff/say')

const dm = require('./staff/dm')
const fix = require('./staff/fix')
const info = require('./staff/info')
const status = require('./staff/status')
const verified = require('./staff/verified')

staffCommand = new SlashCommandBuilder()
                    .setName('staff')
                    .setDescription('Staff commands')

staffCommand = ban.builder(staffCommand)
staffCommand = say.builder(staffCommand)
                    
staffCommand = dm.builder(staffCommand)
staffCommand = fix.builder(staffCommand)
staffCommand = info.builder(staffCommand)
staffCommand = status.builder(staffCommand)
staffCommand = verified.builder(staffCommand)


module.exports = {
	data: staffCommand,
	
    async execute(interaction) {
        await interaction.reply({ content: 'Slash commands are still a work in progress.', ephemeral: true })
        /*if (interaction.options.getSubcommand() === 'ban'){
            await ban.execute(interaction);
        } else if (interaction.options.getSubcommandGroup() === 'status'){
            await status.execute(interaction)
        }*/
	},
};