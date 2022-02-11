const custom = require('./custom');
const membercount = require('./membercount');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
            subcommandGroup
                .setName('status')
                .setDescription('Set the bot status')
                
                subcommandGroup = custom.builder(subcommandGroup)
                subcommandGroup = membercount.builder(subcommandGroup)
                return subcommandGroup
            })

        return SlashCommandBuilder
    },
    execute: async function(interaction){
        if (interaction.options.getSubcommand() === 'custom') {
            await custom.execute(interaction);
        } else if (interaction.options.getSubcommand() === 'membercount') {
            await membercount.execute(interaction);
        }
    }
}