const lock = require('./lock');
const warn = require('./warn');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
            subcommandGroup
                .setName('verified')
                .setDescription('WIP - Commands for verified theories');
                
                subcommandGroup = lock.builder(subcommandGroup);
                subcommandGroup = warn.builder(subcommandGroup);
                return subcommandGroup;
            });

        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("This command is still a work in progress");
    }
};