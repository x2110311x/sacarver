const add = require('./add');
const view = require('./view');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
            subcommandGroup
                .setName('note')
                .setDescription('Add or view a staff note');
                
                subcommandGroup = add.builder(subcommandGroup);
                subcommandGroup = view.builder(subcommandGroup);
                return subcommandGroup;
            });

        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("Command");
    }
};