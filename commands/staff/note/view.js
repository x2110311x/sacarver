const { EmbedBuilder } = require('discord.js');
const fetchNotes = require("../../../helpers/notes/fetchnotes");

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('view')
              .setDescription('View notes for a user')
              .addUserOption(option =>
                  option.setName('user')
                      .setDescription('The user to check notes for, if they are in the server')
                      .setRequired(false))
              .addStringOption(option =>
                  option.setName('userid')
                      .setDescription('The ID of the user to check notes for, if they are not in the server')
                      .setRequired(false)));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    await interaction.deferReply();
    const client = interaction.client;

    var user = interaction.options.getUser('user');
    if (user == null){
        user = interaction.options.getString('userid');
        if (user == null){
        let errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Command Error")
        .setDescription("Please specify a user or user ID")
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${interaction.client.icon}` });

        await interaction.editReply({ephemeral: true, embeds: [errorEmbed]});
        return;
        }
    } else {
        user = user.id;
    }
    
    try{ 
        await fetchNotes(client, user).then(async (noteEmbed) => {
        await interaction.editReply({embeds: [noteEmbed]});
        });
    } catch (err){
        client.log.error({message: "Error retrieving staff notes", error:err})
    }
  }
};