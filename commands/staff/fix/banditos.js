module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('banditos')
                .setDescription('Fix bandito role membership'));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.reply("Command");
    }
};