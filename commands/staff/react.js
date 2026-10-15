module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('react')
              .setDescription('React to a message')
              .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription('Channel the message is in')
                    .setRequired(true))
              .addStringOption(option =>
                option
                    .setName('message')
                    .setDescription('ID of the message to react to')
                    .setRequired(true))
              .addStringOption(option =>
                option
                    .setName('emoji')
                    .setDescription('Emoji to react with')
                    .setRequired(true)));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    await interaction.deferReply({ephemeral: true});
    var channel = interaction.options.getChannel('channel');
    var messageId = interaction.options.getString('message');
    var emoji = interaction.options.getString('emoji') ?? '';

    var targetMessage;
    try {
        targetMessage = await channel.messages.fetch(messageId);
    } catch {
        await interaction.editReply("Could not find message");
        return;
    }

    try{
        await targetMessage.react(emoji);

        await interaction.editReply("Message has been reacted to")
    } catch{
        await interaction.editReply("There was an error reacting to the message");
    }
  }
};