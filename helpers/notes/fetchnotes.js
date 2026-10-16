const { EmbedBuilder } = require('discord.js');

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
 * Fetches staff notes for a user with pagination support, rich card formatting,
 * and "last edited by" attribution.
 *
 * @param {object} client - Discord client
 * @param {string} user - User ID
 * @param {object} [options] - Pagination options
 * @param {number} [options.page=1] - 1-indexed page number
 * @param {number} [options.pageSize=5] - Notes per page
 * @returns {Promise<EmbedBuilder>} Note embed with pagination metadata attached
 */
module.exports = async function fetchNotes(client, user, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const pageSize = Math.max(1, parseInt(options.pageSize, 10) || 5);
  const offset = (page - 1) * pageSize;

  const { count, rows: notes } = await client.DB.Notes.findAndCountAll({
    where: {
      User: user
    },
    order: [['Date', 'DESC']],
    limit: pageSize,
    offset: offset
  });

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  client.log.debug(`Notes retrieved for user ${user}: ${notes.length} on page ${page}/${totalPages} (${count} total)`);

  const member = await safeFetchUser(client, user);

  // Determine embed accent color based on highest severity on this page
  let embedColor = SEVERITY_COLORS.Default;
  if (notes.some(n => n.Severity === 'High')) {
    embedColor = SEVERITY_COLORS.High;
  } else if (notes.some(n => n.Severity === 'Medium')) {
    embedColor = SEVERITY_COLORS.Medium;
  } else if (notes.some(n => n.Severity === 'Low')) {
    embedColor = SEVERITY_COLORS.Low;
  }

  const noteEmbed = new EmbedBuilder()
    .setColor(embedColor)
    .setAuthor({
      name: `${member.displayName} (${member.id})`,
      iconURL: member.displayAvatarURL()
    })
    .setFooter({
      text: `Page ${page} of ${totalPages} • ${count} total note${count === 1 ? '' : 's'}`,
      iconURL: client.icon || undefined
    })
    .setTimestamp();

  if (count === 0) {
    noteEmbed.setDescription(`No staff notes recorded for <@${user}>.`);
  } else {
    for (const note of notes) {
      let rawNoteText = note.Note || '';
      let editorId = note.EditedBy ? String(note.EditedBy) : null;
      let editTimestamp = note.EditedDate ? parseInt(note.EditedDate, 10) : null;

      // Backward-compatibility: extract legacy audit string if columns are not yet populated
      const legacyRegex = /(?:\r?\n)+Edited by <@!?(\d+)> on <t:(\d+)(?::[A-Za-z])?>/g;
      const legacyMatches = [...rawNoteText.matchAll(legacyRegex)];
      if (legacyMatches.length > 0) {
        if (!editorId) {
          const lastMatch = legacyMatches[legacyMatches.length - 1];
          editorId = lastMatch[1];
          editTimestamp = parseInt(lastMatch[2], 10);
        }
        rawNoteText = rawNoteText.replace(legacyRegex, '').trim();
      }

      // Format message link
      let messageLinkText = '';
      if (note.Link && note.Link !== 'N/A') {
        messageLinkText = `**Message Link:** [Jump to Message](${note.Link})`;
      }

      // Format edit attribution line
      let editLine = '';
      if (editorId && editTimestamp) {
        editLine = `**Last edited by:** <@${editorId}> • <t:${editTimestamp}:R> (<t:${editTimestamp}:d>)`;
      }

      // Format added by line
      const addedByLine = `**Added by:** <@${note.Noter}> • <t:${note.Date}:R> (<t:${note.Date}:d>)`;

      // Quote note text lines
      const quotedNote = rawNoteText
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n');

      // Compose metadata block
      const metadataParts = [addedByLine];
      if (editLine) metadataParts.push(editLine);
      if (messageLinkText) metadataParts.push(messageLinkText);
      const metadataBlock = metadataParts.join('\n');

      // Ensure total field value length stays well within Discord's 1024 char limit
      const maxNoteLen = 1000 - metadataBlock.length - 10;
      let safeQuotedNote = quotedNote;
      if (quotedNote.length > maxNoteLen) {
        safeQuotedNote = quotedNote.substring(0, Math.max(50, maxNoteLen - 3)) + '...';
      }

      const fieldValue = `${safeQuotedNote}\n\n${metadataBlock}`;
      const severityEmoji = SEVERITY_EMOJIS[note.Severity] || '';
      const fieldTitle = severityEmoji
        ? `📝 Note #${note.ID} • ${severityEmoji} ${note.Severity || 'Unknown'} Severity`
        : `📝 Note #${note.ID} • ${note.Severity || 'Unknown'} Severity`;

      noteEmbed.addFields({
        name: fieldTitle,
        value: fieldValue
      });
    }
  }

  // Attach pagination metadata for callers (while preserving EmbedBuilder instance for threadCreate)
  noteEmbed.totalNotes = count;
  noteEmbed.totalPages = totalPages;
  noteEmbed.notes = notes;
  noteEmbed.page = page;
  noteEmbed.pageSize = pageSize;
  noteEmbed.embed = noteEmbed;

  return noteEmbed;
};