const { EmbedBuilder } = require('discord.js');

module.exports = {
    builder: function (subcommandGroup){
        subcommandGroup.addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Get information about a user by target or ID')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to look up')
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('The ID of the user to look up')
                        .setRequired(false)));
        return subcommandGroup;
    },
    execute: async function(interaction){
        const userOption = interaction.options.getUser('user');
        const idOption = interaction.options.getString('id');

        let targetUser = userOption;

        if (!targetUser && idOption) {
            const cleanId = idOption.trim();
            try {
                targetUser = await interaction.client.users.fetch(cleanId);
            } catch (e) {
                targetUser = null;
            }
        }

        if (!targetUser) {
            targetUser = interaction.user;
        }

        const createdDate = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F> (<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>)`;

        const embed = new EmbedBuilder()
            .setColor('#753543')
            .setAuthor({ name: targetUser.tag || targetUser.username, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: 'User ID', value: `${targetUser.id}`, inline: false },
                { name: 'Account Creation Date', value: createdDate, inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    }
};