module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('WIP - Get information about a user not in the server')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the user to ban')
                        .setRequired(true)));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("This command is still a work in progress");
    }
};