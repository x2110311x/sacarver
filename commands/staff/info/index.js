const member = require('./member');
const user = require('./user');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
            subcommandGroup
                .setName('info')
                .setDescription('Get information about objects');
                
                subcommandGroup = member.builder(subcommandGroup);
                subcommandGroup = user.builder(subcommandGroup);
                return subcommandGroup;
            });

        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("Command");
    }
};