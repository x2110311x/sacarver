const { EmbedBuilder } = require("discord.js");

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('fromepoch')
              .setDescription('Get the human readable date from a Unix timestamp')
              .addIntegerOption(option => 
                option
                    .setName("timestamp")
                    .setDescription("The Unix timestamp you want to convert")
                    .setRequired(true)));

      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    const epoch = interaction.options.getInteger('timestamp');
    const epochDate = new Date(epoch);
    const epochEmbed = new EmbedBuilder()
      .setColor(0xd5b052)
      .setTitle(`${epoch} as a human date is `)
      .setDescription(`${epochDate.toTimeString()}`)
      .setFooter({ text: '© 2025 x2110311x', iconURL: interaction.client.user.avatarURL() });
    await interaction.reply({embeds: [epochEmbed]});
  }
};