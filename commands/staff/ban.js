module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user that\'s not in the server')
                .addIntegerOption(option =>
                    option.setName('user')
                        .setDescription('The ID of the user to ban')
                        .setRequired(true)));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("Ban test");
    }
};