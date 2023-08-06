module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('fitcheck')
                .setDescription('Fit check!'));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply({content: "This command is still a work in progress", ephemeral: true});
    }
};