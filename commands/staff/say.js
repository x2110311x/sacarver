module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('say')
                .setDescription('Say a message with the bot')
                .addStringOption(option =>
                    option
                        .setName('text')
                        .setDescription('The text to say')
                        .setRequired(false))
                .addAttachmentOption(option =>
                    option
                        .setName('file')
                        .setDescription('A file to send')
                        .setRequired(false))
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel to send in. Defaults to current if not specified')));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.deferReply({ephemeral: true});

        var channel = interaction.options.getChannel('channel') ?? interaction.channel;
        var text = interaction.options.getString('text');
        var file = interaction.options.getAttachment('file');

        var hasText = Boolean(text && text.trim().length > 0);

        if (!hasText && !file) {
            await interaction.editReply('You must specify at least text or a file to send.');
            return;
        }

        var payload = {};
        if (hasText) {
            payload.content = text;
        }
        if (file) {
            payload.files = [file];
        }

        try {
            await channel.send(payload);
            await interaction.editReply(`Message sent in <#${channel.id}>`);
        } catch (error) {
            interaction.client.log.error({ message: `Could not send message in channel ${channel.id}`, error: error });
            await interaction.editReply('There was an error sending the message.');
        }
    }
};