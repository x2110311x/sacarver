const { EmbedBuilder } = require('discord.js');
const honeypot = require('../../helpers/honeypot');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('sethoneybans')
                .setDescription('Set the honeypot scammers banned count')
                .addIntegerOption(option =>
                    option
                        .setName('count')
                        .setDescription('The new scammers banned count')
                        .setMinValue(0)
                        .setRequired(true)));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.deferReply({ ephemeral: true });
        const client = interaction.client;
        const count = interaction.options.getInteger('count');

        const newCount = await honeypot.setBannedCount(client, count);
        await honeypot.updateHoneypotChannel(client, newCount);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle("Honeypot Ban Count Updated")
            .setDescription(`Successfully set the honeypot banned count to **${newCount}** and updated the honeypot channel topic.`)
            .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

        await interaction.editReply({ embeds: [embed] });
    }
};
