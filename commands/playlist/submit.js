const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const crypto = require("crypto");

async function sendModal(origInteration, interaction, playlist){
  const modalID = crypto.randomBytes(16).toString("hex");
  const playlistModal = new ModalBuilder()
    .setCustomId(modalID)
    .setTitle("Enter your submission");

  const songInput = new TextInputBuilder()
    .setCustomId('song')
    .setLabel("Song Name and Artist")
    .setRequired(true)
    .setMaxLength(1_000)
    .setStyle(TextInputStyle.Short);
  
    const linkInput = new TextInputBuilder()
      .setCustomId('link')
      .setLabel("Spotify Link")
      .setRequired(true)
      .setMaxLength(1_000)
      .setStyle(TextInputStyle.Short);

    const reasoningInput = new TextInputBuilder()
      .setCustomId('reasoning')
      .setLabel("Why do you think this song is a good fit?")
      .setRequired(false)
      .setMaxLength(2_500)
      .setStyle(TextInputStyle.Paragraph);

    const firstActionRow = new ActionRowBuilder().addComponents(songInput);
    const secondActionRow = new ActionRowBuilder().addComponents(linkInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(reasoningInput);

    playlistModal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
    await interaction.showModal(playlistModal);
    const collectorFilter = i => (i.user.id === interaction.user.id && i.customId === modalID);

    interaction.awaitModalSubmit({ time: 1_200_000, collectorFilter })
    .then(i => {
      catchModal(origInteration, i, playlist);
    }).catch(err => {
        interaction.client.log.warn({message: `Error with modal response for /staff note add`, error:err});
    });
}

async function catchModal(origInteration, interaction, playlist){
  await interaction.reply({ephemeral: true, content: "Processing..."});
  let client = interaction.client;
  var song = interaction.fields.getTextInputValue('song');
  var link = interaction.fields.getTextInputValue('link');
  var reasoning = interaction.fields.getTextInputValue('reasoning');

  reasoning = reasoning != "" ? reasoning : "N/A";

  const submissionEmbed = new EmbedBuilder()
    .setTitle(`Your submission for ${playlist.ThemeTitle}`)
    .setDescription(`${song}`)
    .setURL(link)
    .addFields({
      "name": "Why do you think this song fits?",
      "value": `${reasoning}`
    })
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });


    const submitButton = new ButtonBuilder()
    .setCustomId('submit')
    .setLabel("Submit")
    .setStyle(ButtonStyle.Success);

    const buttonRow1 = new ActionRowBuilder()
      .addComponents(submitButton);
    
    const submission = {
      'song': song,
      'link': link,
      'reasoning': reasoning
    };

    await interaction.deleteReply();
    const response = await origInteration.editReply({embeds:[submissionEmbed], components:[buttonRow1], fetchReply: true});

    const collectorFilter = i => 
      (i.user.id === interaction.user.id && (i.customId === "submit"));
    
    await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 })
      .then(i=> {
        submitSubmission(origInteration, i, playlist, submission);
      }).catch(err => {
      interaction.client.log.warn({message: `Error with button response for /playlist submit`, error:err});
    });
}

async function submitSubmission(origInteration, i, playlist, submission){
  let client = i.client;
  let DB = i.client.DB;
  await i.reply({ephemeral: true, content: "Processing..."});

  try {
    await DB.PlaylistData.create({
      User: i.member.id,
      Track: submission.song,
      Link: submission.link,
      Reasoning: submission.reasoning,
      Picked: false,
      Month: playlist.ID
    });

    let submitEmbed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle("Song Submitted")
      .setDescription("Your song has been submitted")
      .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

    await i.deleteReply();
    await origInteration.editReply({embeds: [submitEmbed], components: []});

  } catch (err){
    client.log.err({message: "Error handling /playlist submit final submission", error: err})
  }
}

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('submit')
              .setDescription('Submit a new song for Playlist of the Month'));
                  
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    await interaction.deferReply({ephemeral: true});
    let client =  interaction.client;
    let DB = client.DB;
    
    const playlist = await DB.PlaylistConfig.findOne({
      where: {
        Current: true
      }
    });

    const playlistEmbed = new EmbedBuilder()
      .setTitle(playlist.ThemeTitle)
      .setDescription(playlist.ThemeDescription)
      .addFields({
        "name": "Please have the Spotify link to the song ready before clicking begin",
        "value": `You can submit up to ${playlist.maxSubmissions} song${playlist.maxSubmissions>1 ? 's' : ''}`
      })
      .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

      const beginButton = new ButtonBuilder()
      .setCustomId('begin')
      .setLabel("Begin")
      .setStyle(ButtonStyle.Primary);

      const buttonRow1 = new ActionRowBuilder()
        .addComponents(beginButton);

      const response = await interaction.editReply({embeds:[playlistEmbed], components:[buttonRow1], fetchReply: true});

      const collectorFilter = i => 
        (i.user.id === interaction.user.id && (i.customId === "begin"));
      
      await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 })
        .then(i=> {
          interaction.editReply({components: []});
          sendModal(interaction, i, playlist);
        }).catch(err => {
        interaction.client.log.warn({message: `Error with button response for /playlist submit`, error:err});
      });
  }
};