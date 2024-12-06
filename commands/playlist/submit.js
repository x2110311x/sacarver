module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('submit')
              .setDescription('Submit a new song for Playlist of the Month'));
                  
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    await interaction.reply(":)");
  }
};