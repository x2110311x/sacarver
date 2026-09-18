const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require('discord.js');

const activeDmSessions = new Set();

/**
 * Handles incoming direct messages to the bot and prompts the user
 * to confirm forwarding the message to the staff channel.
 *
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').Message} message
 */
async function handleDm(client, message) {
  if (message.author.bot) return;

  const userId = message.author.id;
  if (activeDmSessions.has(userId)) return;

  activeDmSessions.add(userId);

  try {
    const confirmButton = new ButtonBuilder()
      .setCustomId('dm_forward_confirm')
      .setLabel('Yes, send to staff')
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId('dm_forward_cancel')
      .setLabel('No, cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    const promptMessage = await message.channel.send({
      content: 'Would you like to send this message to staff?\nClick a button below or reply with **"yes"** or **"no"**.',
      components: [row]
    });

    // Accept either button click or text message reply within 90 seconds
    const buttonPromise = promptMessage.awaitMessageComponent({
      filter: i => i.user.id === userId,
      time: 90000,
      componentType: ComponentType.Button
    }).then(interaction => ({ type: 'button', interaction }));

    const textPromise = message.channel.awaitMessages({
      filter: m => m.author.id === userId && ['yes', 'no'].includes(m.content.trim().toLowerCase()),
      max: 1,
      time: 90000,
      errors: ['time']
    }).then(collected => ({ type: 'text', message: collected.first() }));

    let confirmed = false;

    try {
      const result = await Promise.race([buttonPromise, textPromise]);

      if (result.type === 'button') {
        await result.interaction.deferUpdate().catch(() => {});
        confirmed = result.interaction.customId === 'dm_forward_confirm';
      } else if (result.type === 'text') {
        confirmed = result.message.content.trim().toLowerCase() === 'yes';
      }
    } catch (e) {
      // Timeout
      await promptMessage.edit({ components: [] }).catch(() => {});
      await message.channel.send('Timeout reached. Message not sent.');
      return;
    }

    await promptMessage.edit({ components: [] }).catch(() => {});

    if (!confirmed) {
      await message.channel.send('Message not sent.');
      return;
    }

    const staffChannelId = client.config?.channels?.staffDmLog || '785359408422060082';
    const staffChannel = await client.channels.fetch(staffChannelId).catch(err => {
      client.log.error({ message: `Could not fetch staff DM log channel (${staffChannelId})`, error: err });
      return null;
    });

    if (!staffChannel) {
      await message.channel.send('Unable to contact staff channel at this time. Please try again later.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x753543)
      .setAuthor({
        name: message.author.tag || message.author.username,
        iconURL: message.author.displayAvatarURL()
      })
      .setFooter({ text: `User ID: ${message.author.id}` })
      .setTimestamp(message.createdAt);

    if (!message.content || message.content.trim() === '') {
      embed.addFields({ name: 'New DM', value: '*No text sent*' });
    } else if (message.content.length > 1000) {
      embed.addFields(
        { name: 'New DM', value: message.content.substring(0, 1000) },
        { name: 'Message Cont.', value: message.content.substring(1000) }
      );
    } else {
      embed.addFields({ name: 'New DM', value: message.content });
    }

    const files = [];
    if (message.attachments && message.attachments.size > 0) {
      for (const [, attachment] of message.attachments) {
        files.push({
          attachment: attachment.url,
          name: attachment.name
        });
      }
    }

    if (files.length > 0) {
      await staffChannel.send({ embeds: [embed], files });
    } else {
      await staffChannel.send({ embeds: [embed] });
    }

    await message.channel.send('Your message has been sent to staff.\nWe will review it and staff will respond back to you if necessary.\nThanks!');
  } catch (err) {
    client.log.error({ message: 'Error in handleDm', error: err });
    await message.channel.send('An error occurred while processing your message. Please try again.').catch(() => {});
  } finally {
    activeDmSessions.delete(userId);
  }
}

module.exports = {
  handleDm,
  activeDmSessions
};
