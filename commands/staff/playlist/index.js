const configure = require('./configure');
const view = require('./view');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
            subcommandGroup
                .setName('playlist')
                .setDescription('Manage Playlist of the month');
                subcommandGroup = configure.builder(subcommandGroup);
                subcommandGroup = view.builder(subcommandGroup);
                return subcommandGroup;
            });

        return SlashCommandBuilder;
    },
    execute: async function(interaction){
      let subcommandName = interaction.options.getSubcommand();
      if (subcommandName == 'configure'){
        await configure.execute(interaction);
      } else if (subcommandName == 'view'){
        await view.execute(interaction);
      } else {
        await interaction.reply({ephemeral:true, content: "Unknown command"});
      }
    }
};