const custom = require('./custom');
const preset = require('./preset');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
            subcommandGroup
                .setName('dm')
                .setDescription('Commands to DM a user');
                
                subcommandGroup = custom.builder(subcommandGroup);
                subcommandGroup = preset.builder(subcommandGroup);
                return subcommandGroup;
            });

        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("Command");
    }
};