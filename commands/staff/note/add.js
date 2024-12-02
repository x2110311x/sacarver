const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const crypto = require("crypto");

async function sendModal(interaction){
  const modalID = crypto.randomBytes(16).toString("hex");
  const modal = new ModalBuilder()
    .setCustomId(modalID)
    .setTitle("Enter note details");

  const noteInput = new TextInputBuilder()
    .setCustomId('note')
    .setLabel("Note")
    .setRequired(true)
    .setStyle(TextInputStyle.Paragraph);
  
    const messageLinkInput = new TextInputBuilder()
      .setCustomId('link')
      .setLabel("Message Link")
      .setValue("N/A")
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);

    const firstActionRow = new ActionRowBuilder().addComponents(noteInput);
    const secondActionRow = new ActionRowBuilder().addComponents(messageLinkInput);

    modal.addComponents(firstActionRow, secondActionRow);
    await interaction.showModal(modal);

    const collectorFilter = i => (i.user.id === interaction.user.id && i.customId === modalID);

    interaction.awaitModalSubmit({ time: 600_000, collectorFilter })
    .then(i => {
      catchModal(interaction, i);
    }).catch(err => {
        interaction.client.log.warn({message: `Error with modal response for /staff note add`, error:err});
    });
}

async function catchModal(interaction, newInteraction){
  let client = interaction.client;

  var severity = interaction.options.getString('severity');
  var user = interaction.options.getUser('user');
  if (user == null){
      user = interaction.options.getString('userid');
  } else {
    user = user.id;
  }
  const note = newInteraction.fields.getTextInputValue('note');
  const msgLink = newInteraction.fields.getTextInputValue('link');

  var data = {
    "user": user,
    "severity": severity,
    "note": note,
    "msgLink": msgLink,
    "dateAdded": Math.floor(newInteraction.createdTimestamp/1000),
    "noter": interaction.member.id
  }
  
  const noteEmbed = new EmbedBuilder()
  .setColor(0xff0000)
  .setTitle("New Staff Note")
  .setDescription("Please review, and then click Submit or Cancel")
  .addFields(
    { name: 'User', value: `<@${user}> - ${user}` },
    { name: 'Note', value: `${note}`},
    { name: 'Severity', value: `${severity}`},
    { name: 'Message Link', value: `${msgLink}` },
    { name: 'Date Added', value: `<t:${Math.floor(newInteraction.createdTimestamp/1000)}:F>`},
  )
  .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

  const submitButton = new ButtonBuilder()
    .setCustomId('submit')
    .setLabel("Submit")
    .setStyle(ButtonStyle.Success);
  
  // eslint-disable-next-line no-unused-vars
  const editButton = new ButtonBuilder()
    .setCustomId('edit')
    .setLabel("Edit")
    .setStyle(ButtonStyle.Primary);

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel')
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder()
    .addComponents(submitButton, cancelButton); 

  let response = await newInteraction.reply({ephemeral:true, embeds: [noteEmbed], components: [buttonRow], fetchReply: true});  

  const collectorFilter = i => 
    (i.user.id === interaction.user.id && 
      (i.customId === "edit" || i.customId === "cancel" || i.customId === "submit" ));
  
    await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 })
      .then(i=> {
        catchButton(newInteraction, i, data);
      }).catch(err => {
      interaction.client.log.warn({message: `Error with button response for /staff note add`, error:err});
    });
}

async function catchButton(interaction, newInteraction, data) {
  let client = interaction.client;

  await newInteraction.update({components:[]});

  if (newInteraction.customId == 'submit'){
    await submitNote(interaction, data);
  } else if (newInteraction.customId == 'edit'){
    await newInteraction.reply({ephemeral: true, content: "This feature has not been implemented yet"});
  } else if (newInteraction.customId == 'cancel'){
    let cancelEmbed = new EmbedBuilder()
      .setTitle("Note cancelled")
      .setDescription("Note add has been cancelled")
      .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
    
      await newInteraction.reply({ephemeral: true, embeds:[cancelEmbed]})
  } else {
    let errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Command Error")
          .setDescription("Something went very wrong")
          .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
    
    
    interaction.client.error(`Received unknown button ID ${newInteraction.customId} in /staff note add`);
    
    
    await newInteraction.reply({ephemeral: true, embeds:[errorEmbed]})
  }
}

async function submitNote(interaction, data) {
  let client = interaction.client;
  let DB = client.DB;

  try{
    await DB.Notes.create({
      "User": data.user,
      "Date": data.dateAdded,
      "Note": data.note,
      "Severity": data.severity,
      "Link": data.msgLink,
      "Noter": data.noter
    });

      
  let submitEmbed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle("Note added")
    .setDescription("Your note has been stored")
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
  
  await interaction.editReply({embeds: [submitEmbed]});
  
  client.log.info("Added note to database");
  } catch (err){

    client.log.error({message: "Failed to insert note into database", error: err})
    let errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Command Error")
          .setDescription("Something went very wrong")
          .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
    await interaction.editReply({embeds: [errorEmbed]})
  }

}

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('add')
              .setDescription('Add a note to a user')
              .addStringOption(option => 
                option.setName('severity')
                       .setDescription('The severity of the note')
                       .setRequired(true)
                       .addChoices(
                        { name: 'High', value: 'High' },
                        { name: 'Medium', value: 'Medium' },
                        { name: 'Low', value: 'Low' },
                      )
              )
              .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to add a note to, if they are in the server')
                    .setRequired(false))
              .addStringOption(option =>
                  option.setName('userid')
                      .setDescription('The ID of the user to add a note to, if they are not in the server')
                      .setRequired(false))
      );
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    const client = interaction.client;

    var user = interaction.options.getUser('user');
    if (user == null){
        user = interaction.options.getString('userid');
        if (user == null){
          let errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Command Error")
          .setDescription("Please specify a user or user ID")
          .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

          await interaction.reply({ephemeral: true, embeds: [errorEmbed]});
          return;
        }
    } 

    await sendModal(interaction);
  }
};