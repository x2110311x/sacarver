module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('member')
                .setDescription('Get information about a user in the server')
                .addUserOption(option =>
                    option
                        .setName('member')
                        .setDescription('The user to look up')));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("Command");
    }
};