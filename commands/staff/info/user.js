module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Get information about a user not in the server')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the user to ban')
                        .setRequired(true)));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("Command");
    }
};