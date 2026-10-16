const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const crypto = require("crypto");
const logNoteAction = require('../../../helpers/notes/logNoteAction');

function buildReviewEmbed(data, client) {
  return new EmbedBuilder()
    .setColor(0xffff88)
    .setTitle("New Staff Note")
    .setDescription("Please review, and then click **Submit**, **Edit**, or **Cancel**")
    .addFields(
      { name: 'User', value: `<@${data.user}> - ${data.user}` },
      { name: 'Note', value: `${data.note}` },
      { name: 'Severity', value: `${data.severity}` },
      { name: 'Message Link', value: `${data.msgLink}` },
      { name: 'Date Added', value: `<t:${data.dateAdded}:F>` }
    )
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
}

function buildReviewButtons(disabled = false) {
  const submitButton = new ButtonBuilder()
    .setCustomId('submit')
    .setLabel("Submit")
    .setStyle(ButtonStyle.Success)
    .setDisabled(disabled);

  const editButton = new ButtonBuilder()
    .setCustomId('edit')
    .setLabel("Edit")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled);

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel')
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  return new ActionRowBuilder().addComponents(submitButton, editButton, cancelButton);
}

async function sendModal(interaction){
  const modalID = crypto.randomBytes(16).toString("hex");
  const modal = new ModalBuilder()
    .setCustomId(modalID)
    .setTitle("Enter note details");

  const noteInput = new TextInputBuilder()
    .setCustomId('note')
    .setLabel("Note")
    .setRequired(true)
    .setMaxLength(1_000)
    .setStyle(TextInputStyle.Paragraph);
  
  const messageLinkInput = new TextInputBuilder()
    .setCustomId('link')
    .setLabel("Message Link")
    .setValue("N/A")
    .setRequired(false)
    .setMaxLength(200)
    .setStyle(TextInputStyle.Short);

  const firstActionRow = new ActionRowBuilder().addComponents(noteInput);
  const secondActionRow = new ActionRowBuilder().addComponents(messageLinkInput);

  modal.addComponents(firstActionRow, secondActionRow);
  await interaction.showModal(modal);

  const collectorFilter = i => (i.user.id === interaction.user.id && i.customId === modalID);

  interaction.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
    .then(i => {
      catchModal(interaction, i);
    }).catch(err => {
      interaction.client.log.warn({message: `Error with modal response for /staff note add`, error:err});
    });
}

async function catchModal(interaction, newInteraction){
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
  };

  const buttonRow = buildReviewButtons();
  const noteEmbed = buildReviewEmbed(data, interaction.client);

  let response = await newInteraction.reply({
    ephemeral: true,
    embeds: [noteEmbed],
    components: [buttonRow],
    fetchReply: true
  });

  let active = true;
  while (active) {
    let buttonInteraction;
    try {
      buttonInteraction = await response.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id && ['submit', 'edit', 'cancel'].includes(i.customId),
        time: 300_000
      });
    } catch (_err) {
      try {
        await response.edit({ components: [buildReviewButtons(true)] });
      } catch (_e) {}
      return;
    }

    if (buttonInteraction.customId === 'cancel') {
      active = false;
      const cancelEmbed = new EmbedBuilder()
        .setTitle("Note cancelled")
        .setDescription("Note addition has been cancelled.")
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${interaction.client.icon}` });

      await buttonInteraction.update({ embeds: [cancelEmbed], components: [] });
      return;
    }

    if (buttonInteraction.customId === 'submit') {
      active = false;
      await buttonInteraction.update({ components: [] });
      await submitNote(interaction, data);
      return;
    }

    if (buttonInteraction.customId === 'edit') {
      const editModalID = crypto.randomBytes(16).toString("hex");
      const editModal = new ModalBuilder()
        .setCustomId(editModalID)
        .setTitle("Edit Note Details");

      const editNoteInput = new TextInputBuilder()
        .setCustomId('note')
        .setLabel("Note")
        .setRequired(true)
        .setValue(data.note)
        .setMaxLength(1_000)
        .setStyle(TextInputStyle.Paragraph);

      const editLinkInput = new TextInputBuilder()
        .setCustomId('link')
        .setLabel("Message Link")
        .setValue(data.msgLink || "N/A")
        .setRequired(false)
        .setMaxLength(200)
        .setStyle(TextInputStyle.Short);

      editModal.addComponents(
        new ActionRowBuilder().addComponents(editNoteInput),
        new ActionRowBuilder().addComponents(editLinkInput)
      );

      await buttonInteraction.showModal(editModal);

      let modalSubmit;
      try {
        modalSubmit = await buttonInteraction.awaitModalSubmit({
          time: 300_000,
          filter: i => i.user.id === interaction.user.id && i.customId === editModalID
        });
      } catch (modalErr) {
        interaction.client.log.warn({ message: "Modal submit timed out in /staff note add edit", error: modalErr });
        return;
      }

      data.note = modalSubmit.fields.getTextInputValue('note');
      data.msgLink = modalSubmit.fields.getTextInputValue('link');

      await modalSubmit.update({
        embeds: [buildReviewEmbed(data, interaction.client)],
        components: [buildReviewButtons()]
      });
    }
  }
}

async function submitNote(interaction, data) {
  let client = interaction.client;
  let DB = client.DB;
  let createdNote = null;

  try {
    createdNote = await DB.Notes.create({
      "User": data.user,
      "Date": data.dateAdded,
      "Note": data.note,
      "Severity": data.severity,
      "Link": data.msgLink,
      "Noter": data.noter
    });

    client.log.info("Added note to database");
  } catch (err) {
    client.log.error({message: "Failed to insert note into database", error: err});
    let errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Command Error")
      .setDescription("Something went very wrong saving the note.")
      .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${interaction.client.icon}` });
    await interaction.editReply({embeds: [errorEmbed]});
    return;
  }

  // Log to staff audit log channel
  await logNoteAction(client, {
    action: 'add',
    targetUserId: data.user,
    staffMemberId: data.noter,
    noteId: createdNote?.ID,
    severity: data.severity,
    noteText: data.note,
    link: data.msgLink,
    timestamp: data.dateAdded
  });

  let submitEmbed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle("Note added")
    .setDescription("Your note has been stored!")
    .addFields(
      { name: 'User', value: `<@${data.user}> - ${data.user}` },
      { name: 'Note', value: `${data.note}`},
      { name: 'Severity', value: `${data.severity}`},
      { name: 'Message Link', value: `${data.msgLink}` },
      { name: 'Date Added', value: `<t:${data.dateAdded}:F>`},
      { name: 'Added by', value: `<@${data.noter}>`},
    )
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${interaction.client.icon}` });

  await interaction.deleteReply().catch(() => {});
  await interaction.followUp({ephemeral: true, embeds: [submitEmbed]});
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
    var user = interaction.options.getUser('user');
    if (user == null){
        user = interaction.options.getString('userid');
        if (user == null){
          let errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Command Error")
          .setDescription("Please specify a user or user ID")
          .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${interaction.client.icon}` });

          await interaction.reply({ephemeral: true, embeds: [errorEmbed]});
          return;
        }
    } 

    await sendModal(interaction);
  }
};