module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('view')
              .setDescription('View submitted songs for Playlist of the Month')
              .addStringOption(option =>
                option.setName('month')
                  .setDescription('Month to view submissions for')
                  .setRequired(true)));        

      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    await interaction.reply(":)");
  }
};