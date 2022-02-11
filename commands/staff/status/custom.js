module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('custom')
                .setDescription('Set a custom status')
                .addStringOption( option =>
                    option
                        .setName('activity')
                        .setDescription('Set the type of activity')
                        .setRequired(true)
                        .addChoice('Playing', 'PLAYING')
                        .addChoice('Listening', 'LISTENING')
                        .addChoice('Watching', 'WATCHING')
                        .addChoice('Competing', 'COMPETING'))
                .addStringOption(option =>
                    option
                        .setName('status')
                        .setDescription('The status to set')
                        .setRequired(true)))
                
        return SlashCommandBuilder
    },
    execute: async function(interaction){
        let type = interaction.options.getString('activity');
        let activity = interaction.options.getString('status');
        await interaction.client.user.setActivity(activity, { type: type });
        await interaction.reply({ content: 'Status set', ephemeral: true });
    }
}