const { startHistoryViewer } = require('../../../helpers/notes/noteHistory');

module.exports = {
  builder: function (SlashCommandBuilder){
    SlashCommandBuilder.addSubcommand(subcommand =>
      subcommand
        .setName('history')
        .setDescription('View the edit and version history of a staff note')
        .addIntegerOption(option =>
          option.setName('noteid')
            .setDescription('The ID of the note you wish to inspect')
            .setMinValue(0)
            .setRequired(true))
    );
    return SlashCommandBuilder;
  },
  execute: async function(interaction){
    await interaction.deferReply();
    const noteID = interaction.options.getInteger('noteid');
    await startHistoryViewer(interaction, noteID, false);
  }
};
