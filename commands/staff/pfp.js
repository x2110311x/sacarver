const { EmbedBuilder } = require('discord.js');

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('pfp')
              .setDescription('Set the bot pfp')
              .addStringOption(option =>
                  option
                      .setName('image')
                      .setDescription('Link to the image file for the bot to use')
                      .setRequired(true)));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    await interaction.deferReply();
    var image = interaction.options.getString('image');
    var client = interaction.client;
    await client.user.setAvatar(image);

    await interaction.editReply("New pfp set");
  }
};