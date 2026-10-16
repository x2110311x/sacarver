const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const crypto = require("crypto");
const logNoteAction = require('../../../helpers/notes/logNoteAction');

function cleanLegacyNoteText(text) {
  if (!text) return '';
  const legacyRegex = /(?:\r?\n)+Edited by <@!?(\d+)> on <t:(\d+)(?::[A-Za-z])?>/g;
  return text.replace(legacyRegex, '').trim();
}

function buildReviewEmbed(data, originalNote, client) {
  return new EmbedBuilder()
    .setColor(0xffff88)
    .setTitle("Edited Staff Note")
    .setDescription("Please review, and then click **Submit**, **Edit**, or **Cancel**")
    .addFields(
      { name: 'Target User', value: `<@${data.user}> - ${data.user}` },
      { name: 'Updated Note', value: `${data.note}` },
      { name: 'Severity', value: `${data.severity}` },
      { name: 'Message Link', value: `${data.msgLink}` },
      { name: 'Date Originally Added', value: `<t:${originalNote.Date}:F>` },
      { name: 'Editor', value: `<@${data.editor}>` }
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

/**
 * Initiates the interactive edit flow for a staff note.
 * Can be called from /staff note edit or from the dropdown in /staff note view.
 *
 * @param {import('discord.js').Interaction} interaction - Interaction to show modal on
 * @param {object} note - Database note instance/object
 * @param {object} [options] - Optional settings
 * @param {Function} [options.onSuccess] - Callback executed on successful DB commit
 */
async function startEditFlow(interaction, note, options = {}) {
  const modalID = crypto.randomBytes(16).toString("hex");
  const modal = new ModalBuilder()
    .setCustomId(modalID)
    .setTitle(`Edit Note #${note.ID}`);

  const initialNoteText = cleanLegacyNoteText(note.Note);
  const noteInput = new TextInputBuilder()
    .setCustomId('note')
    .setLabel("Note")
    .setRequired(true)
    .setValue(initialNoteText)
    .setMaxLength(1_000)
    .setStyle(TextInputStyle.Paragraph);

  const messageLinkInput = new TextInputBuilder()
    .setCustomId('link')
    .setLabel("Message Link")
    .setValue(note.Link || "N/A")
    .setRequired(false)
    .setMaxLength(200)
    .setStyle(TextInputStyle.Short);

  modal.addComponents(
    new ActionRowBuilder().addComponents(noteInput),
    new ActionRowBuilder().addComponents(messageLinkInput)
  );

  await interaction.showModal(modal);

  const filter = i => (i.user.id === interaction.user.id && i.customId === modalID);

  let initialModalSubmit;
  try {
    initialModalSubmit = await interaction.awaitModalSubmit({ time: 600_000, filter });
  } catch (err) {
    interaction.client.log.warn({ message: `Modal submit timed out for note edit #${note.ID}`, error: err });
    return;
  }

  const editor = interaction.user.id;
  const data = {
    user: note.User,
    severity: note.Severity,
    note: initialModalSubmit.fields.getTextInputValue('note'),
    msgLink: initialModalSubmit.fields.getTextInputValue('link'),
    editor: editor,
    ID: note.ID
  };

  const reviewEmbed = buildReviewEmbed(data, note, interaction.client);
  const buttonRow = buildReviewButtons();

  let response = await initialModalSubmit.reply({
    ephemeral: true,
    embeds: [reviewEmbed],
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
        .setTitle("Note edit cancelled")
        .setDescription(`Changes to Note #${note.ID} have been discarded.`)
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${interaction.client.icon}` });

      await buttonInteraction.update({ embeds: [cancelEmbed], components: [] });
      return;
    }

    if (buttonInteraction.customId === 'submit') {
      active = false;
      await buttonInteraction.update({ components: [] });
      await submitEdit(interaction, initialModalSubmit, note, data, options);
      return;
    }

    if (buttonInteraction.customId === 'edit') {
      const editModalID = crypto.randomBytes(16).toString("hex");
      const editModal = new ModalBuilder()
        .setCustomId(editModalID)
        .setTitle(`Edit Note #${note.ID}`);

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
        interaction.client.log.warn({ message: `Modal submit timed out in /staff note edit cycle #${note.ID}`, error: modalErr });
        return;
      }

      data.note = modalSubmit.fields.getTextInputValue('note');
      data.msgLink = modalSubmit.fields.getTextInputValue('link');

      await modalSubmit.update({
        embeds: [buildReviewEmbed(data, note, interaction.client)],
        components: [buildReviewButtons()]
      });
    }
  }
}

async function submitEdit(interaction, originalReplyInteraction, originalNote, data, options = {}) {
  const client = interaction.client;
  const DB = client.DB;
  const nowTimestamp = Math.floor(Date.now() / 1000);

  try {
    const updatePayload = {
      Note: `${data.note}\nEdited by <@${data.editor}> on <t:${nowTimestamp}:F>`,
      Link: data.msgLink
    };
    if (DB.Notes.rawAttributes && DB.Notes.rawAttributes.EditedBy) {
      updatePayload.EditedBy = data.editor;
    }
    if (DB.Notes.rawAttributes && DB.Notes.rawAttributes.EditedDate) {
      updatePayload.EditedDate = nowTimestamp;
    }

    await DB.Notes.update(updatePayload, { where: { ID: data.ID } });

    client.log.info(`Updated note #${data.ID} in database`);
  } catch (err) {
    client.log.error({ message: `Failed to update note #${data.ID} in database`, error: err });
    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Command Error")
      .setDescription("Failed to update the note in the database.")
      .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

    await originalReplyInteraction.followUp({ ephemeral: true, embeds: [errorEmbed] });
    return;
  }

  // Send audit embed to staff log channel
  await logNoteAction(client, {
    action: 'edit',
    targetUserId: data.user,
    staffMemberId: data.editor,
    noteId: data.ID,
    severity: data.severity,
    oldNoteText: cleanLegacyNoteText(originalNote.Note),
    newNoteText: data.note,
    oldLink: originalNote.Link,
    newLink: data.msgLink,
    timestamp: nowTimestamp
  });

  const successEmbed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle("Note updated")
    .setDescription(`Note **#${data.ID}** has been successfully updated!`)
    .addFields(
      { name: 'Target User', value: `<@${data.user}> - ${data.user}` },
      { name: 'Note', value: `${data.note}` },
      { name: 'Severity', value: `${data.severity}` },
      { name: 'Message Link', value: `${data.msgLink}` },
      { name: 'Edited by', value: `<@${data.editor}>` },
      { name: 'Date Edited', value: `<t:${nowTimestamp}:F>` }
    )
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

  await originalReplyInteraction.deleteReply().catch(() => {});
  await originalReplyInteraction.followUp({ ephemeral: true, embeds: [successEmbed] });

  // If a post-update callback was registered (e.g. to refresh the view embed), call it
  if (typeof options.onSuccess === 'function') {
    try {
      await options.onSuccess(data);
    } catch (cbErr) {
      client.log.warn({ message: "Error in note edit onSuccess callback", error: cbErr });
    }
  }
}

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('edit')
              .setDescription('Edit a staff note')
              .addIntegerOption(option =>
                  option.setName('noteid')
                      .setDescription('The ID of the note you wish to edit')
                      .setMinValue(0)
                      .setRequired(true)));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    const client = interaction.client;
    const noteID = interaction.options.getInteger('noteid');

    let note;
    try {
      note = await client.DB.Notes.findOne({
        where: { ID: noteID }
      });
    } catch (err) {
      interaction.client.log.error({message: `Error fetching note for /staff note edit`, error:err});
      await interaction.reply({ephemeral: true, content: "There was an error fetching the note from the database."});
      return;
    }

    if (!note) {
      const notFoundEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Note Not Found")
        .setDescription(`No staff note was found with ID **#${noteID}**.`)
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

      await interaction.reply({ ephemeral: true, embeds: [notFoundEmbed] });
      return;
    }

    await startEditFlow(interaction, note);
  },
  startEditFlow
};
