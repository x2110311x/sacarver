const { EmbedBuilder } = require('discord.js');

var answerList = [
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
];

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
                      .setRequired(true)));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    const preShake = new EmbedBuilder()
      .setColor(0xd5b052)
      .setTitle('Please wait while the 8-ball shakes')
      .setImage('https://media4.giphy.com/media/3o6ozoD1ByqYv7ARIk/giphy.gif?cid=ecf05e47m06f3sb5stpb0adngxwkxf0c2n96lqx1mj5xldy6&rid=giphy.gif')
      .setFooter({ text: '© 2024 x2110311x', iconURL: interaction.client.user.avatarURL() });

    await interaction.reply({ embeds: [preShake] });

    let question = interaction.options.getString('question');
    let answer = answerList[Math.floor(Math.random() * answerList.length)];

    const postShake = new EmbedBuilder()
      .setColor(0xd5b052)
      .setTitle('My answer is')
      .setDescription(answer)
      .addFields(
        { name: 'Your Question', value: question }
      )
      .setFooter({ text: '© 2024 x2110311x', iconURL: interaction.client.avatarURL() });

    await new Promise(resolve => setTimeout(resolve, 4000));
    await interaction.editReply({ embeds: [postShake] });
  }
};