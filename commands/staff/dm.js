module.exports = {
    builder: function (SlashCommandBuilder) {
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('dm')
                .setDescription('Send a direct message to a user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to send to')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('text')
                        .setDescription('The text to send')
                        .setRequired(false))
                .addAttachmentOption(option =>
                    option
                        .setName('file')
                        .setDescription('A file to send')
                        .setRequired(false)));
        return SlashCommandBuilder;
    },
    execute: async function (interaction) {
        await interaction.deferReply({ ephemeral: false });

        const user = interaction.options.getUser('user');
        const text = interaction.options.getString('text');
        const file = interaction.options.getAttachment('file');

        const hasText = Boolean(text && text.trim().length > 0);

        if (!hasText && !file) {
            await interaction.editReply('You must specify at least text or a file to send.');
            return;
        }

        const payload = {};
        if (hasText) {
            payload.content = text;
        }
        if (file) {
            payload.files = [file];
        }

        try {
            await user.send(payload);

            let confirmation = `Message sent to <@${user.id}>`;
            if (hasText) {
                confirmation += `\n\`${text}\``;
            }
            if (file) {
                confirmation += `\n**File:** ${file.name}`;
            }
            await interaction.editReply(confirmation);
        } catch (error) {
            interaction.client.log.warn({ message: `Could not send DM to user ${user.id}`, error: error });
            await interaction.editReply(`Could not send DM to <@${user.id}>. They may have DMs disabled or have blocked the bot.`);
        }
    }
};
