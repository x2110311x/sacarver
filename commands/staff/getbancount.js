const { EmbedBuilder } = require('discord.js');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('getbancount')
                .setDescription('Get the server ban count'));
                    
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        const guild = interaction.guild;
        let client = interaction.client;
        const banManager = guild.bans;
        const bans = await banManager.fetch({cache: false, force: true});

        const banEmbed = new EmbedBuilder()
        .setColor(0xDC8203)
        .setTitle(`The server currently has ${bans.size} bans`)
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
        
        await interaction.reply({embeds: [banEmbed]});
    }

};