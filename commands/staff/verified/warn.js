module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('WIP - Send an off-topic warning to verified-theories'));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("This command is still a work in progress");
    }
};