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
                    .setRequired(true)))

      return SlashCommandBuilder
  },
  execute: async function(interaction){
    const epoch = interaction.options.getInteger('timestamp');
    const epochDate = new Date(epoch)
    const epochEmbed = new EmbedBuilder()
      .setColor(0xd5b052)
      .setTitle(`${epoch} as a human date is `)
      .setDescription(`${epochDate.toTimeString()}`)
      .setFooter({ text: '© 2022 x2110311x', iconURL: 'https://cdn.discordapp.com/avatars/470691679712706570/42e790b8113e7f21422796db72d652f2.webp?size=1024' });
    await interaction.reply({embeds: [epochEmbed]});
  }
}