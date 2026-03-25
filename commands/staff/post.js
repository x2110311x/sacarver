const { EmbedBuilder } = require('discord.js');

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('post')
              .setDescription('Make a forum post')
              .addChannelOption(option =>
                option
                    .setName('forum')
                    .setDescription('Forum to make the post in')
                    .addChannelTypes(15)
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


    if(text == '' && image == ''){
        await interaction.editReply("You must include at least text or image");
        return;
    }

    try{
        if(image != ''){
            embed = new EmbedBuilder()
            .setColor("#df5344")
            .setImage(image);
        
            await forum.threads.create({
                name: name,
                message: {
                    content: text, 
                    embeds: [embed]
                }
            });
        } else {
            await forum.threads.create({
                name: name,
                message: {content: text}
            });
        }

        await interaction.editReply("Post has been posted")
    } catch{
        await interaction.editReply("There was an error making the post");
    }
  }
};