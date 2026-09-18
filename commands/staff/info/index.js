const member = require('./member');
const user = require('./user');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
            subcommandGroup
                .setName('info')
                .setDescription('Get information about members or users');
                
            subcommandGroup = member.builder(subcommandGroup);
            subcommandGroup = user.builder(subcommandGroup);
            return subcommandGroup;
        });

        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'member') {
            await member.execute(interaction);
        } else if (subcommand === 'user') {
            await user.execute(interaction);
        }
    }
};
