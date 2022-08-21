module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('mock')
                .setDescription('mock'))
        return SlashCommandBuilder
    },
    execute: async function(interaction){
        await interaction.reply({content: "This command is still a work in progress", ephemeral: true});
    }
}