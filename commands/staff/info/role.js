const { AttachmentBuilder } = require('discord.js');

const MEMBER_CACHE_TTL_MS = 30 * 1000;
const guildMemberCache = new Map();

async function fetchAllGuildMembers(guild) {
    const cached = guildMemberCache.get(guild.id);
    if (cached && (Date.now() - cached.timestamp) < MEMBER_CACHE_TTL_MS) {
        return cached.members;
    }

    try {
        const members = await guild.members.fetch();
        guildMemberCache.set(guild.id, { members, timestamp: Date.now() });
        return members;
    } catch (err) {
        if (err && (err.name === 'GatewayRateLimitError' || err.data?.retry_after)) {
            const retryAfterMs = Math.ceil((err.data?.retry_after || 15) * 1000) + 250;
            await new Promise(resolve => setTimeout(resolve, retryAfterMs));
            const members = await guild.members.fetch();
            guildMemberCache.set(guild.id, { members, timestamp: Date.now() });
            return members;
        }
        throw err;
    }
}

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
        const allMembers = await fetchAllGuildMembers(interaction.guild);

        const usernames = allMembers
            .filter(member => member.roles.cache.has(role.id) || role.id === interaction.guild.id)
            .map(member => member.user.username);

        const content = usernames.join('\n');
        const buffer = Buffer.from(content, 'utf-8');
        const safeRoleName = role.name.replace(/[^a-zA-Z0-9_-]/g, '_') || role.id;
        const attachment = new AttachmentBuilder(buffer, { name: `${safeRoleName}.txt` });

        await interaction.editReply({ files: [attachment] });
    },
    _clearCache: function () {
        guildMemberCache.clear();
    }
};
