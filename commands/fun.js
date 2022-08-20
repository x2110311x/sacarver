const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');


const magic8ball = require('./fun/8ball');

staffCommand = new SlashCommandBuilder()
                    .setName('fun')
                    .setDescription('Fun commands')

staffCommand = magic8ball.builder(staffCommand)



module.exports = {
	data: staffCommand,
	
    async execute(interaction) {
        //await interaction.reply({ content: 'Slash commands are still a work in progress.', ephemeral: true })
        if (interaction.options.getSubcommand() === '8ball'){
            await magic8ball.execute(interaction);
        }/* else if (interaction.options.getSubcommandGroup() === 'status'){
            await status.execute(interaction)
        }*/
	},
};