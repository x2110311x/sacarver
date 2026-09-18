const { EmbedBuilder } = require('discord.js');

module.exports = {
    builder: function (subcommandGroup){
        subcommandGroup.addSubcommand(subcommand =>
            subcommand
                .setName('member')
                .setDescription('Get information about a user in the server')
                .addUserOption(option =>
                    option
                        .setName('member')
                        .setDescription('The member to look up')
                        .setRequired(false)));
        return subcommandGroup;
    },
    execute: async function(interaction){
        const targetUser = interaction.options.getUser('member') || interaction.user;
        let member;
        try {
            member = await interaction.guild.members.fetch(targetUser.id);
        } catch (e) {
            member = null;
        }

        if (!member) {
            return interaction.reply({ content: 'Member not found in this server.', ephemeral: true });
        }

        const joinDate = member.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`
            : 'Unknown';
        const createdDate = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F> (<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>)`;

        const roles = member.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .map(role => role.toString());
        const roleStr = roles.length > 0 ? roles.join(', ') : 'No roles';

        const embed = new EmbedBuilder()
            .setColor('#753543')
            .setAuthor({ name: member.user.tag || member.user.username, iconURL: member.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(member.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: 'User ID', value: `${member.id}`, inline: false },
                { name: 'Last Join Date', value: joinDate, inline: false },
                { name: 'Account Creation Date', value: createdDate, inline: false },
                { name: 'Roles', value: roleStr.length > 1024 ? roleStr.substring(0, 1021) + '...' : roleStr, inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    }
};