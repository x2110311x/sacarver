const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('configure')
              .setDescription('Configure settings for Playlist of the Month')
              .addStringOption(option =>
                option.setName('month')
                  .setDescription('Month to configure')
                  .setRequired(true))
              .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers));
                  
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    await interaction.reply(":)");
  }
};