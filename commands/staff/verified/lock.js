module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Temporarily lockdown verified-theories'))
        return SlashCommandBuilder
    },
    execute: async function(interaction){
        await interaction.reply("Command")
    }
}