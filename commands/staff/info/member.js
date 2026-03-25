module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('member')
                .setDescription('WIP - Get information about a user in the server')
                .addUserOption(option =>
                    option
                        .setName('member')
                        .setDescription('The user to look up')));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("This command is still a work in progress");
    }
};