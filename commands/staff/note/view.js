const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fetchNotes = require("../../../helpers/notes/fetchnotes");
const { startEditFlow } = require("./edit");
const { startHistoryViewer } = require("../../../helpers/notes/noteHistory");

function buildNavigationRow(currentPage, totalPages, totalNotes, disabled = false) {
  const prevButton = new ButtonBuilder()
    .setCustomId('note_page_prev')
    .setLabel("Previous")
    .setEmoji("◀️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || currentPage <= 1);

  const nextButton = new ButtonBuilder()
    .setCustomId('note_page_next')
    .setLabel("Next")
    .setEmoji("▶️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || currentPage >= totalPages);

  const editButton = new ButtonBuilder()
    .setCustomId('note_view_edit')
    .setLabel("Edit Note")
    .setEmoji("✏️")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled || totalNotes === 0);

  const historyButton = new ButtonBuilder()
    .setCustomId('note_view_history')
    .setLabel("History")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || totalNotes === 0);

  return new ActionRowBuilder().addComponents(prevButton, nextButton, editButton, historyButton);
}

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

          await interaction.editReply({embeds: [errorEmbed]});
          return;
        }
    } else {
        user = user.id;
    }

    const PAGE_SIZE = 5;
    let currentPage = 1;
    let noteEmbed;

    try { 
      noteEmbed = await fetchNotes(client, user, { page: currentPage, pageSize: PAGE_SIZE });
    } catch (err) {
      client.log.error({message: "Error retrieving staff notes in /staff note view", error:err});
      await interaction.editReply({ content: "An error occurred while fetching staff notes." });
      return;
    }

    const hasNotes = (noteEmbed.totalNotes || 0) > 0;
    const initialComponents = hasNotes ? [buildNavigationRow(currentPage, noteEmbed.totalPages, noteEmbed.totalNotes)] : [];

    const response = await interaction.editReply({
      embeds: [noteEmbed],
      components: initialComponents
    });

    if (!hasNotes) {
      return;
    }

    const collector = response.createMessageComponentCollector({
      time: 600_000 // 10 minutes
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          ephemeral: true,
          content: "Only the staff member who used `/staff note view` can use these controls."
        });
        return;
      }

      try {
        if (i.customId === 'note_page_prev') {
          currentPage = Math.max(1, currentPage - 1);
          noteEmbed = await fetchNotes(client, user, { page: currentPage, pageSize: PAGE_SIZE });
          await i.update({
            embeds: [noteEmbed],
            components: [buildNavigationRow(currentPage, noteEmbed.totalPages, noteEmbed.totalNotes)]
          });
        } else if (i.customId === 'note_page_next') {
          currentPage = Math.min(noteEmbed.totalPages, currentPage + 1);
          noteEmbed = await fetchNotes(client, user, { page: currentPage, pageSize: PAGE_SIZE });
          await i.update({
            embeds: [noteEmbed],
            components: [buildNavigationRow(currentPage, noteEmbed.totalPages, noteEmbed.totalNotes)]
          });
        } else if (i.customId === 'note_view_edit') {
          // Present dropdown of notes on the current page
          const notesOnPage = noteEmbed.notes || [];
          if (notesOnPage.length === 0) {
            await i.reply({ ephemeral: true, content: "No notes on this page to edit." });
            return;
          }

          const selectOptions = notesOnPage.map(n => {
            const cleanText = n.Note.replace(/(?:\r?\n)+Edited by <@!?\d+> on <t:\d+(?::[A-Za-z])?>/g, '').replace(/\s+/g, ' ').trim();
            const snippet = cleanText.length > 70 ? `${cleanText.substring(0, 67)}...` : cleanText;
            return {
              label: `Note #${n.ID} (${n.Severity || 'Note'})`,
              description: snippet || 'No note text',
              value: String(n.ID)
            };
          });

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('note_select_to_edit')
            .setPlaceholder("Select a note from this page to edit...")
            .addOptions(selectOptions);

          const backButton = new ButtonBuilder()
            .setCustomId('note_edit_cancel_back')
            .setLabel("Back to Navigation")
            .setEmoji("↩️")
            .setStyle(ButtonStyle.Secondary);

          const selectRow = new ActionRowBuilder().addComponents(selectMenu);
          const backRow = new ActionRowBuilder().addComponents(backButton);

          await i.update({
            components: [selectRow, backRow]
          });
        } else if (i.customId === 'note_edit_cancel_back') {
          // Restore navigation buttons
          await i.update({
            components: [buildNavigationRow(currentPage, noteEmbed.totalPages, noteEmbed.totalNotes)]
          });
        } else if (i.customId === 'note_select_to_edit') {
          const selectedNoteId = parseInt(i.values[0], 10);
          const noteToEdit = await client.DB.Notes.findOne({ where: { ID: selectedNoteId } });

          if (!noteToEdit) {
            await i.reply({ ephemeral: true, content: `Note #${selectedNoteId} could not be found.` });
            return;
          }

          // Launch modal edit flow directly from the select menu interaction
          await startEditFlow(i, noteToEdit, {
            onSuccess: async () => {
              // Refresh view message with updated notes
              try {
                noteEmbed = await fetchNotes(client, user, { page: currentPage, pageSize: PAGE_SIZE });
                await response.edit({
                  embeds: [noteEmbed],
                  components: [buildNavigationRow(currentPage, noteEmbed.totalPages, noteEmbed.totalNotes)]
                });
              } catch (refreshErr) {
                client.log.warn({ message: "Failed to refresh note view after edit", error: refreshErr });
              }
            }
          });

          // Reset the view message components back to navigation buttons
          await response.edit({
            components: [buildNavigationRow(currentPage, noteEmbed.totalPages, noteEmbed.totalNotes)]
          }).catch(() => {});
        } else if (i.customId === 'note_view_history') {
          // Present dropdown of notes on the current page to view history
          const notesOnPage = noteEmbed.notes || [];
          if (notesOnPage.length === 0) {
            await i.reply({ ephemeral: true, content: "No notes on this page to view history for." });
            return;
          }

          const selectOptions = notesOnPage.map(n => {
            const cleanText = n.Note.replace(/(?:\r?\n)+Edited by <@!?\d+> on <t:\d+(?::[A-Za-z])?>/g, '').replace(/\s+/g, ' ').trim();
            const snippet = cleanText.length > 70 ? `${cleanText.substring(0, 67)}...` : cleanText;
            return {
              label: `Note #${n.ID} (${n.Severity || 'Note'})`,
              description: snippet || 'No note text',
              value: String(n.ID)
            };
          });

          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('note_select_to_history')
            .setPlaceholder("Select a note from this page to view history...")
            .addOptions(selectOptions);

          const backButton = new ButtonBuilder()
            .setCustomId('note_history_cancel_back')
            .setLabel("Back to Navigation")
            .setEmoji("↩️")
            .setStyle(ButtonStyle.Secondary);

          const selectRow = new ActionRowBuilder().addComponents(selectMenu);
          const backRow = new ActionRowBuilder().addComponents(backButton);

          await i.update({
            components: [selectRow, backRow]
          });
        } else if (i.customId === 'note_history_cancel_back') {
          // Restore navigation buttons
          await i.update({
            components: [buildNavigationRow(currentPage, noteEmbed.totalPages, noteEmbed.totalNotes)]
          });
        } else if (i.customId === 'note_select_to_history') {
          const selectedNoteId = parseInt(i.values[0], 10);
          // Launch history viewer ephemerally
          await startHistoryViewer(i, selectedNoteId, true);

          // Restore the main view message components back to navigation buttons
          await response.edit({
            components: [buildNavigationRow(currentPage, noteEmbed.totalPages, noteEmbed.totalNotes)]
          }).catch(() => {});
        }
      } catch (err) {
        client.log.error({ message: "Error handling /staff note view component interaction", error: err });
      }
    });

    collector.on('end', async () => {
      try {
        await response.edit({
          components: [buildNavigationRow(currentPage, noteEmbed?.totalPages || 1, noteEmbed?.totalNotes || 0, true)]
        });
      } catch (_e) {
        // Message may have been deleted or dismissed
      }
    });
  }
};