const add = require('./add');
const view = require('./view');
const edit = require('./edit');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
            subcommandGroup
                .setName('note')
                .setDescription('Add or view a staff note');
                
                subcommandGroup = add.builder(subcommandGroup);
                subcommandGroup = view.builder(subcommandGroup);
                subcommandGroup = edit.builder(subcommandGroup);
                return subcommandGroup;
            });

        return SlashCommandBuilder;
    },
    execute: async function(interaction){
      let subcommandName = interaction.options.getSubcommand();
      if (subcommandName == 'add'){
        await add.execute(interaction);
      } else if (subcommandName == 'view'){
        await view.execute(interaction);
      } else if (subcommandName == 'edit'){
        await edit.execute(interaction);
      } else {
        await interaction.reply({ephemeral:true, content: "Unknown command"});
      }
    }
};