module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('preset')
                .setDescription('Send a DM using a preset message')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to send to')
                        .setRequired(true)));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("Command");
    }
};