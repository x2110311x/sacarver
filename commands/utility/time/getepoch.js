const { EmbedBuilder } = require("discord.js");

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('getepoch')
              .setDescription('Get the current Unix Epoch timestamp'));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
      const now = Math.floor(new Date().getTime() / 1000);
      const epoch = new EmbedBuilder()
        .setColor(0xd5b052)
        .setTitle("The current Unix Epoch is")
        .setDescription(`${now}`)
        .setFooter({ text: '© 2022 x2110311x', iconURL: 'https://cdn.discordapp.com/avatars/470691679712706570/42e790b8113e7f21422796db72d652f2.webp?size=1024' });
      await interaction.reply({embeds: [epoch]});
    }
};