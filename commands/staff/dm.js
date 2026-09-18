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
                        .setRequired(true)));
        return SlashCommandBuilder;
    },
    execute: async function (interaction) {
        const user = interaction.options.getUser('user');
        const text = interaction.options.getString('text');

        await interaction.deferReply({ ephemeral: false });

        try {
            await user.send(text);
            await interaction.editReply(`Message sent to <@${user.id}>\n\`${text}\``);
        } catch (error) {
            interaction.client.log.warn({ message: `Could not send DM to user ${user.id}`, error: error });
            await interaction.editReply(`Could not send DM to <@${user.id}>. They may have DMs disabled or have blocked the bot.`);
        }
    }
};
