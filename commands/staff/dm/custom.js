module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('custom')
                .setDescription('WIP - end a custom DM')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to send to')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('text')
                        .setDescription('The text to say')
                        .setRequired(true)));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("This command is still a work in progress");
    }
};