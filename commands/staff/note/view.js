module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('view')
              .setDescription('View notes for a user')
              .addUserOption(option =>
                  option.setName('user')
                      .setDescription('The user to check notes for, if they are in the server')
                      .setRequired(false))
              .addStringOption(option =>
                  option.setName('userid')
                      .setDescription('The ID of the user to check notes for, if they are not in the server')
                      .setRequired(false)));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
      await interaction.reply("Command Response");
  }
};