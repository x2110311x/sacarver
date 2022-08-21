const { EmbedBuilder } = require('discord.js');

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('8ball')
              .setDescription('Ask the all-knowing 8 ball a question')
              .addStringOption(option =>
                  option
                      .setName('question')
                      .setDescription('What would you like to ask Sacarver?')
                      .setRequired(true)))
      return SlashCommandBuilder
  },
  execute: async function(interaction){
    const preRoll = new EmbedBuilder()
      .setColor(0xd5b052)
      .setTitle('Please wait while the 8-ball shakes')
      .setDescription('...')
      .setFooter({ text: '© 2022 x2110311x', iconURL: 'https://cdn.discordapp.com/avatars/470691679712706570/42e790b8113e7f21422796db72d652f2.webp?size=1024' });

    await interaction.reply({ embeds: [preRoll] });

    let question = interaction.options.getString('question');
    let answer = answerList[Math.floor(Math.random() * answerList.length)];

    const postRoll = new EmbedBuilder()
    .setColor(0xd5b052)
    .setTitle('My answer is')
    .setDescription(answer)
    .addFields(
      { name: 'Your Question', value: question }
    )
    .setFooter({ text: '© 2022 x2110311x', iconURL: 'https://cdn.discordapp.com/avatars/470691679712706570/42e790b8113e7f21422796db72d652f2.webp?size=1024' });

    await new Promise(resolve => setTimeout(resolve, 1000));
    await interaction.editReply({ embeds: [postRoll] });
  }
}

answerList = [
  "It is certain",
  "Outlook good",
  "You may rely on it",
  "Without a doubt",
  "Signs point to yes",
  "Reply hazy, try again",
  "Better not tell you now",
  "Don't count on it",
  "Hell no",
  "Concentrate and ask again",
  "My sources say no",
  "My answer is no",
  "Outlook not good"
]