const { where } = require("sequelize");
const { Where } = require("sequelize/lib/utils");

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
    let client = interaction.client;
    let DB = client.DB;

    const submissions = await DB.PlaylistData.findAll();

    var output = ""
    for (const submission of submissions) {
      output += `[${submission.Track}](${submission.Link}) \n`;
    }

    await interaction.reply(output);
  }
};