const { ActivityType } = require('discord.js');

const ActivityTypeMap = {
    PLAYING: ActivityType.Playing,
    LISTENING: ActivityType.Listening,
    WATCHING: ActivityType.Watching,
    COMPETING: ActivityType.Competing
};

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
                        .addChoices(
                            { name: 'Playing', value: 'PLAYING' },
                            { name: 'Listening', value: 'LISTENING' },
                            { name: 'Watching', value: 'WATCHING' },
                            { name: 'Competing', value: 'COMPETING' }
                        ))
                .addStringOption(option =>
                    option
                        .setName('status')
                        .setDescription('The status to set')
                        .setRequired(true)));
                
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        let typeStr = interaction.options.getString('activity');
        let activity = interaction.options.getString('status');
        let type = ActivityTypeMap[typeStr] ?? ActivityType.Playing;
        await interaction.client.user.setActivity(activity, { type });
        await interaction.reply({ content: 'Status set', ephemeral: true });
    }
};