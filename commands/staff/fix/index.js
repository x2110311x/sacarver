const banditos = require('./banditos');
const vc = require('./vc');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
            subcommandGroup
                .setName('fix')
                .setDescription('Fix role membership')
                
                subcommandGroup = banditos.builder(subcommandGroup)
                subcommandGroup = vc.builder(subcommandGroup)
                return subcommandGroup
            })

        return SlashCommandBuilder
    },
    execute: async function(interaction){
        await interaction.reply("Command")
    }
}