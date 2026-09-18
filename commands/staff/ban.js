const { EmbedBuilder } = require('discord.js');

module.exports = {
    builder: function (SlashCommandBuilder) {
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user from the server')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to ban (if they are in the server)')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('userid')
                        .setDescription('The ID of the user to ban (if they are not in the server)')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for the ban (optional)')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option
                        .setName('delete_messages')
                        .setDescription('Timeframe of message history to delete')
                        .setRequired(false)
                        .addChoices(
                            { name: "Don't delete any", value: 0 },
                            { name: 'Past hour', value: 3600 },
                            { name: 'Past 24 hours', value: 86400 },
                            { name: 'Past 7 days', value: 604800 }
                        )));

        return SlashCommandBuilder;
    },
    execute: async function (interaction) {
        await interaction.deferReply();

        const userObj = interaction.options.getUser('user');
        const userIdStr = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteOpt = interaction.options.getInteger('delete_messages');
        const deleteMessageSeconds = (deleteOpt !== null && deleteOpt !== undefined) ? deleteOpt : 0;

        if (!userObj && !userIdStr) {
            await interaction.editReply({
                content: 'Please provide either a **user** (mention/select) or a **userid** (ID string) to ban.'
            });
            return;
        }

        const targetUserResolvable = userObj ? userObj.id : userIdStr.trim();
        const displayName = userObj ? `${userObj.tag} (${userObj.id})` : `User ID: ${targetUserResolvable}`;

        try {
            const banInfo = await interaction.guild.bans.create(targetUserResolvable, {
                reason: `${reason} (Banned by ${interaction.user.tag})`,
                deleteMessageSeconds: deleteMessageSeconds
            });

            const bannedUser = (banInfo && banInfo.user) ? banInfo.user : ((banInfo && typeof banInfo === 'object' && banInfo.id) ? banInfo : null);
            const userTag = bannedUser ? (bannedUser.tag || bannedUser.username || targetUserResolvable) : displayName;
            const successTag = bannedUser ? `${userTag} (${bannedUser.id || targetUserResolvable})` : displayName;

            let deleteLabel = "None";
            if (deleteMessageSeconds === 3600) deleteLabel = "Past hour";
            else if (deleteMessageSeconds === 86400) deleteLabel = "Past 24 hours";
            else if (deleteMessageSeconds === 604800) deleteLabel = "Past 7 days";

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('User Banned')
                .addFields(
                    { name: 'Target', value: successTag, inline: false },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Message Deletion', value: deleteLabel, inline: true },
                    { name: 'Banned By', value: `<@${interaction.user.id}>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: interaction.client.icon });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            interaction.client.log.error({ message: `Failed to ban user ${targetUserResolvable}`, error: error });
            await interaction.editReply({
                content: `Could not ban target (\`${targetUserResolvable}\`). Error: ${error.message || error}`
            });
        }
    }
};
