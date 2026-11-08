const { AttachmentBuilder } = require('discord.js');

module.exports = {
    builder: function (subcommandGroup) {
        subcommandGroup.addSubcommand(subcommand =>
            subcommand
                .setName('role')
                .setDescription('Get a plain text file listing all usernames with a specific role')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to list members for')
                        .setRequired(true)));
        return subcommandGroup;
    },
    execute: async function (interaction) {
        await interaction.deferReply();

        const role = interaction.options.getRole('role');
        const allMembers = await interaction.guild.members.fetch();

        const usernames = allMembers
            .filter(member => member.roles.cache.has(role.id) || role.id === interaction.guild.id)
            .map(member => member.user.username);

        const content = usernames.join('\n');
        const buffer = Buffer.from(content, 'utf-8');
        const safeRoleName = role.name.replace(/[^a-zA-Z0-9_-]/g, '_') || role.id;
        const attachment = new AttachmentBuilder(buffer, { name: `${safeRoleName}.txt` });

        await interaction.editReply({ files: [attachment] });
    }
};

