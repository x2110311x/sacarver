const { EmbedBuilder } = require('discord.js');

/**
 * Logs a note creation or modification event to the configured staffCommandLog channel.
 *
 * @param {object} client - Discord client instance
 * @param {object} params - Logging parameters
 * @param {'add'|'edit'} params.action - Action type
 * @param {string} params.targetUserId - ID of the user the note is for
 * @param {string} params.staffMemberId - ID of the staff member performing the action
 * @param {number|string} [params.noteId] - ID of the note
 * @param {string} params.severity - Note severity
 * @param {string} [params.noteText] - Note text (for 'add')
 * @param {string} [params.link] - Message link (for 'add')
 * @param {string} [params.oldNoteText] - Previous note text (for 'edit')
 * @param {string} [params.newNoteText] - Updated note text (for 'edit')
 * @param {string} [params.oldLink] - Previous message link (for 'edit')
 * @param {string} [params.newLink] - Updated message link (for 'edit')
 * @param {number} [params.timestamp] - Unix timestamp in seconds
 */
async function logNoteAction(client, params) {
  try {
    const channelId = client?.config?.channels?.staffCommandLog;
    if (!channelId) {
      client.log.debug("No staffCommandLog channel configured, skipping note audit embed.");
      return;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      client.log.warn({ message: `Could not fetch staff command log channel (${channelId}) for note audit log.` });
      return;
    }

    const timestamp = params.timestamp || Math.floor(Date.now() / 1000);
    const embed = new EmbedBuilder()
      .setTimestamp(new Date(timestamp * 1000))
      .setFooter({ text: `Staff Note Audit • Sacarver`, iconURL: client.icon || undefined });

    if (params.action === 'add') {
      embed
        .setColor(0x57F287) // Green
        .setTitle('Staff Note Added')
        .addFields(
          { name: 'Target User', value: `<@${params.targetUserId}> (${params.targetUserId})`, inline: true },
          { name: 'Added By', value: `<@${params.staffMemberId}> (${params.staffMemberId})`, inline: true },
          { name: 'Severity', value: `${params.severity || 'Unspecified'}`, inline: true },
          { name: 'Note Content', value: `${params.noteText || 'N/A'}` },
          { name: 'Message Link', value: `${params.link || 'N/A'}` },
          { name: 'Date Added', value: `<t:${timestamp}:F> (<t:${timestamp}:R>)` }
        );

      if (params.noteId) {
        embed.setDescription(`Note ID: **#${params.noteId}**`);
      }
    } else if (params.action === 'edit') {
      embed
        .setColor(0x3498DB) // Blue
        .setTitle(`Staff Note Edited (Note #${params.noteId || 'Unknown'})`)
        .addFields(
          { name: 'Target User', value: `<@${params.targetUserId}> (${params.targetUserId})`, inline: true },
          { name: 'Edited By', value: `<@${params.staffMemberId}> (${params.staffMemberId})`, inline: true },
          { name: 'Severity', value: `${params.severity || 'Unspecified'}`, inline: true },
          { name: 'Previous Note', value: `${params.oldNoteText || 'N/A'}` },
          { name: 'Updated Note', value: `${params.newNoteText || 'N/A'}` }
        );

      if (params.oldLink !== params.newLink) {
        embed.addFields(
          { name: 'Previous Link', value: `${params.oldLink || 'N/A'}`, inline: true },
          { name: 'Updated Link', value: `${params.newLink || 'N/A'}`, inline: true }
        );
      } else {
        embed.addFields({ name: 'Message Link', value: `${params.newLink || 'N/A'}` });
      }

      embed.addFields({ name: 'Date Edited', value: `<t:${timestamp}:F> (<t:${timestamp}:R>)` });
    }

    await channel.send({ embeds: [embed] });
  } catch (err) {
    client.log.error({ message: "Failed to send note action audit embed to staff log channel", error: err });
  }
}

module.exports = logNoteAction;
