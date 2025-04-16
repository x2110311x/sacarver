const { EmbedBuilder } = require('discord.js');

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('post')
              .setDescription('Make a blurryface post')
              .addChannelOption(option =>
                option
                    .setName('forum')
                    .setDescription('Forum to make the post in')
                    .setRequired(true))
              .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('Name of the post')
                    .setRequired(true))
              .addStringOption(option =>
                option
                    .setName('text')
                    .setDescription('Text to put with the post')
                    .setRequired(false))
              .addStringOption(option =>
                  option
                      .setName('image')
                      .setDescription('Link to an image to post')
                      .setRequired(false)));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    await interaction.deferReply();
    var image = interaction.options.getString('image') ?? '';
    var forum = interaction.options.getChannel('forum');
    var name = interaction.options.getString('name');
    var text = interaction.options.getString('text') ?? '';
    var client = interaction.client;
    var embed;

    if(image == ''){
        if(text == ''){
            await interaction.editReply("You must include at least text or image");
            return;
        } else {
            embed = new EmbedBuilder()
            .setColor("#df5344")
            .setDescription(text)
            .setFooter({ text: 'Blurryface', iconURL: interaction.client.user.avatarURL() })
            .setTimestamp();
        }
    } else {
        if(text == ''){
            embed = new EmbedBuilder()
            .setColor("#df5344")
            .setImage(image)
            .setFooter({ text: 'Blurryface', iconURL: interaction.client.user.avatarURL() })
            .setTimestamp();
        } else{
            embed = new EmbedBuilder()
            .setColor("#df5344")
            .setDescription(text)
            .setImage(image)
            .setFooter({ text: 'Blurryface', iconURL: interaction.client.user.avatarURL() })
            .setTimestamp();
        }
    }
    try{
        await forum.threads.create({
            name: name,
            message: { 
                embeds: [embed]
            }
        })

        await interaction.editReply("Post has been posted")
    } catch{
        await interaction.editReply("There was an error making the post");
    }
  }
};