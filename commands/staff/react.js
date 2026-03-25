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
    await interaction.deferReply();
    var channel = interaction.options.getChannel('channel');
    var message = interaction.options.getString('message');
    var emoji = interaction.options.getString('emoji') ?? '';

    try {
        var message = await channel.messages.fetch(message);
    } catch {
        await interaction.editReply("Could not find message");
        return;
    }

    try{
        await message.react(emoji);

        await interaction.editReply("Message has been reacted to")
    } catch{
        await interaction.editReply("There was an error reacting to the message");
    }
  }
};