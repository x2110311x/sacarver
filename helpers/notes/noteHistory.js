const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const SEVERITY_EMOJIS = {
  'High': '🔴',
  'Medium': '🟡',
  'Low': '🟢'
};

const SEVERITY_COLORS = {
  'High': 0xED4245,
  'Medium': 0xFEE75C,
  'Low': 0x57F287,
  'Default': 0x5865F2
};

function cleanLegacyNoteText(text) {
  if (!text) return '';
  const legacyRegex = /(?:\r?\n)+Edited by <@!?(\d+)> on <t:(\d+)(?::[A-Za-z])?>/g;
  return text.replace(legacyRegex, '').trim();
}

async function safeFetchUser(client, id) {
  if (!id) {
    return {
      displayName: 'Unknown',
      id: 'N/A',
      displayAvatarURL: () => client.icon || null
    };
  }
  try {
    return await client.users.fetch(String(id));
  } catch (_err) {
    return {
      displayName: `User (${id})`,
      id: String(id),
      displayAvatarURL: () => client.icon || null
    };
  }
}

/**
 * Records a new version for a note in the NoteVersions table.
 * If no versions exist yet, auto-creates Version 1 from the original note data.
 */
async function recordVersion(client, { noteId, noteText, severity, link, editorId, timestamp, isInitial = false }) {
  const DB = client.DB;
  const now = timestamp || Math.floor(Date.now() / 1000);
  const cleanText = cleanLegacyNoteText(noteText);

  if (!DB.NoteVersions) {
    client.log.warn("DB.NoteVersions model is not initialized, skipping version recording.");
    return;
  }

  try {
    const existingVersions = await DB.NoteVersions.findAll({
      where: { NoteID: noteId },
      order: [['Version', 'ASC']]
    });

    if (existingVersions.length === 0) {
      if (isInitial) {
        // First creation of a note
        await DB.NoteVersions.create({
          NoteID: noteId,
          Version: 1,
          Note: cleanText,
          Severity: severity,
          Link: link || 'N/A',
          Editor: editorId,
          Date: now
        });
        client.log.debug(`Recorded initial Version 1 for Note #${noteId}`);
      } else {
        // Existing note being edited that didn't have v1 recorded yet:
        // Query original note to construct Version 1 first
        const originalNote = await DB.Notes.findOne({ where: { ID: noteId } });
        if (originalNote) {
          await DB.NoteVersions.create({
            NoteID: noteId,
            Version: 1,
            Note: cleanLegacyNoteText(originalNote.Note),
            Severity: originalNote.Severity,
            Link: originalNote.Link || 'N/A',
            Editor: originalNote.Noter,
            Date: originalNote.Date
          });
          client.log.debug(`Auto-created missing Version 1 for Note #${noteId}`);
        }

        // Now record Version 2 for this edit
        await DB.NoteVersions.create({
          NoteID: noteId,
          Version: 2,
          Note: cleanText,
          Severity: severity,
          Link: link || 'N/A',
          Editor: editorId,
          Date: now
        });
        client.log.debug(`Recorded Version 2 for Note #${noteId}`);
      }
    } else {
      // Append next version
      const nextVersion = existingVersions[existingVersions.length - 1].Version + 1;
      await DB.NoteVersions.create({
        NoteID: noteId,
        Version: nextVersion,
        Note: cleanText,
        Severity: severity,
        Link: link || 'N/A',
        Editor: editorId,
        Date: now
      });
      client.log.debug(`Recorded Version ${nextVersion} for Note #${noteId}`);
    }
  } catch (err) {
    client.log.error({ message: `Failed to record version for Note #${noteId}`, error: err });
  }
}

/**
 * Fetches all versions for a note in chronological order.
 * Falls back to synthetic records from the Notes table if none exist yet.
 */
async function fetchNoteHistory(client, noteId) {
  const DB = client.DB;
  let versions = [];

  if (DB.NoteVersions) {
    try {
      versions = await DB.NoteVersions.findAll({
        where: { NoteID: noteId },
        order: [['Version', 'ASC']]
      });
    } catch (err) {
      client.log.warn({ message: `Error fetching from NoteVersions for #${noteId}`, error: err });
    }
  }

  // Fallback: If no versions recorded, build synthetic history from Notes row
  if (versions.length === 0) {
    const note = await DB.Notes.findOne({ where: { ID: noteId } });
    if (note) {
      let v1Text = cleanLegacyNoteText(note.Note);
      let legacyEditor = note.EditedBy ? String(note.EditedBy) : null;
      let legacyDate = note.EditedDate ? parseInt(note.EditedDate, 10) : null;

      const legacyRegex = /(?:\r?\n)+Edited by <@!?(\d+)> on <t:(\d+)(?::[A-Za-z])?>/g;
      const legacyMatches = [...(note.Note || '').matchAll(legacyRegex)];
      if (legacyMatches.length > 0 && !legacyEditor) {
        const lastMatch = legacyMatches[legacyMatches.length - 1];
        legacyEditor = lastMatch[1];
        legacyDate = parseInt(lastMatch[2], 10);
      }

      versions.push({
        ID: null,
        NoteID: note.ID,
        Version: 1,
        Note: v1Text,
        Severity: note.Severity,
        Link: note.Link,
        Editor: note.Noter,
        Date: note.Date
      });

      if (legacyEditor && legacyDate) {
        versions.push({
          ID: null,
          NoteID: note.ID,
          Version: 2,
          Note: v1Text,
          Severity: note.Severity,
          Link: note.Link,
          Editor: legacyEditor,
          Date: legacyDate
        });
      }
    }
  }

  return versions;
}

function buildHistoryButtons(currentIdx, totalVersions, disabled = false) {
  const prevButton = new ButtonBuilder()
    .setCustomId('history_prev')
    .setLabel("Older")
    .setEmoji("◀️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || currentIdx <= 0);

  const nextButton = new ButtonBuilder()
    .setCustomId('history_next')
    .setLabel("Newer")
    .setEmoji("▶️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled || currentIdx >= totalVersions - 1);

  const closeButton = new ButtonBuilder()
    .setCustomId('history_close')
    .setLabel("Close History")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(disabled);

  return new ActionRowBuilder().addComponents(prevButton, nextButton, closeButton);
}

async function buildVersionEmbed(client, note, versionRecord, totalVersions, targetUser) {
  const embedColor = SEVERITY_COLORS[versionRecord.Severity] || SEVERITY_COLORS.Default;
  const severityEmoji = SEVERITY_EMOJIS[versionRecord.Severity] || '';
  const member = await safeFetchUser(client, targetUser);

  const versionTag = versionRecord.Version === 1
    ? ' (Original Note)'
    : (versionRecord.Version === totalVersions ? ' (Latest Revision)' : '');

  const quotedNote = cleanLegacyNoteText(versionRecord.Note)
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n');

  const actionText = versionRecord.Version === 1 ? 'Added by:' : 'Edited by:';
  const metadataLines = [
    `**${actionText}** <@${versionRecord.Editor}> • <t:${versionRecord.Date}:F> (<t:${versionRecord.Date}:R>)`
  ];
  if (versionRecord.Link && versionRecord.Link !== 'N/A') {
    metadataLines.push(`**Message Link:** [Jump to Message](${versionRecord.Link})`);
  }

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setAuthor({
      name: `${member.displayName} (${member.id})`,
      iconURL: member.displayAvatarURL()
    })
    .setTitle(`Note #${note.ID} Version History`)
    .setDescription(`Viewing Version **${versionRecord.Version}** of **${totalVersions}**${versionTag}`)
    .addFields(
      {
        name: `Severity: ${severityEmoji} ${versionRecord.Severity || 'Unknown'}`,
        value: quotedNote || '> *No text content*'
      },
      {
        name: 'Revision Details',
        value: metadataLines.join('\n')
      }
    )
    .setFooter({
      text: `Version ${versionRecord.Version}/${totalVersions} • Note ID: #${note.ID}`,
      iconURL: client.icon || undefined
    })
    .setTimestamp();

  return embed;
}

/**
 * Launches an interactive viewer allowing staff to navigate through revisions of a note.
 */
async function startHistoryViewer(interaction, noteId, isComponentInteraction = false) {
  const client = interaction.client;
  const note = await client.DB.Notes.findOne({ where: { ID: noteId } });

  if (!note) {
    const errorMsg = `No note was found with ID **#${noteId}**.`;
    if (isComponentInteraction) {
      await interaction.reply({ ephemeral: true, content: errorMsg });
    } else {
      await interaction.editReply({ content: errorMsg });
    }
    return;
  }

  const versions = await fetchNoteHistory(client, noteId);
  const totalVersions = versions.length;

  // Start by viewing the latest version
  let currentIdx = totalVersions - 1;
  const initialEmbed = await buildVersionEmbed(client, note, versions[currentIdx], totalVersions, note.User);
  const hasMultiple = totalVersions > 1;
  const initialComponents = hasMultiple ? [buildHistoryButtons(currentIdx, totalVersions)] : [];

  let response;
  if (isComponentInteraction) {
    response = await interaction.reply({
      ephemeral: true,
      embeds: [initialEmbed],
      components: initialComponents,
      fetchReply: true
    });
  } else {
    response = await interaction.editReply({
      embeds: [initialEmbed],
      components: initialComponents
    });
  }

  if (!hasMultiple) {
    return;
  }

  const collector = response.createMessageComponentCollector({
    time: 300_000 // 5 minutes
  });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({ ephemeral: true, content: "Only the staff member who opened this history view can use the buttons." });
      return;
    }

    if (i.customId === 'history_close') {
      collector.stop('closed');
      await i.update({ components: [] });
      return;
    }

    if (i.customId === 'history_prev') {
      currentIdx = Math.max(0, currentIdx - 1);
    } else if (i.customId === 'history_next') {
      currentIdx = Math.min(totalVersions - 1, currentIdx + 1);
    }

    const updatedEmbed = await buildVersionEmbed(client, note, versions[currentIdx], totalVersions, note.User);
    await i.update({
      embeds: [updatedEmbed],
      components: [buildHistoryButtons(currentIdx, totalVersions)]
    });
  });

  collector.on('end', async (_collected, reason) => {
    if (reason !== 'closed') {
      try {
        await response.edit({
          components: [buildHistoryButtons(currentIdx, totalVersions, true)]
        });
      } catch (_e) {}
    }
  });
}

module.exports = {
  recordVersion,
  fetchNoteHistory,
  buildVersionEmbed,
  buildHistoryButtons,
  startHistoryViewer,
  cleanLegacyNoteText
};
