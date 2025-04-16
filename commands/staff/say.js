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
                        .setRequired(true))
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel to send in. Defaults to current if not specified')));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        var channel = interaction.options.getChannel('channel') ?? interaction.channel;
        var text = interaction.options.getString('text');

        await interaction.deferReply();
        await channel.send(text);

        await interaction.editReply(`Message sent in <#${channel.id}>`)
    }
};