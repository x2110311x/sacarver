const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits
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

    const replyButton = new ButtonBuilder()
      .setCustomId(`dm_reply_${message.author.id}`)
      .setLabel('Reply')
      .setStyle(ButtonStyle.Primary);

    const replyRow = new ActionRowBuilder().addComponents(replyButton);

    if (files.length > 0) {
      await staffChannel.send({ embeds: [embed], files, components: [replyRow] });
    } else {
      await staffChannel.send({ embeds: [embed], components: [replyRow] });
    }

    await message.channel.send('Your message has been sent to staff.\nWe will review it and staff will respond back to you if necessary.\nThanks!');
  } catch (err) {
    client.log.error({ message: 'Error in handleDm', error: err });
    await message.channel.send('An error occurred while processing your message. Please try again.').catch(() => {});
  } finally {
    activeDmSessions.delete(userId);
  }
}

/**
 * Handles the "Reply" button click from staff DM forward messages.
 * Displays a modal prompting the staff member for their reply message.
 *
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleReplyButton(interaction) {
  try {
    const staffRoleId = interaction.client.config?.roles?.staff || '323555864646647808';
    const isStaff = interaction.member?.permissions?.has(PermissionFlagsBits.ModerateMembers) ||
                    interaction.member?.roles?.cache?.has(staffRoleId);

    if (interaction.inGuild() && !isStaff) {
      await interaction.reply({ content: 'You do not have permission to reply to DMs.', flags: 64 });
      return;
    }

    const userId = interaction.customId.replace('dm_reply_', '');

    const modal = new ModalBuilder()
      .setCustomId(`dm_reply_modal_${userId}`)
      .setTitle('Reply to User');

    const textInput = new TextInputBuilder()
      .setCustomId('text')
      .setLabel('Message')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter message to DM the user...')
      .setRequired(true)
      .setMaxLength(2000);

    const firstActionRow = new ActionRowBuilder().addComponents(textInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  } catch (error) {
    interaction.client.log.error({ message: 'Error handling DM reply button', error });
  }
}

/**
 * Handles the modal submission for replying to a user via DM.
 * Sends the DM and notifies staff of success or failure.
 *
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleReplyModal(interaction) {
  try {
    const staffRoleId = interaction.client.config?.roles?.staff || '323555864646647808';
    const isStaff = interaction.member?.permissions?.has(PermissionFlagsBits.ModerateMembers) ||
                    interaction.member?.roles?.cache?.has(staffRoleId);

    if (interaction.inGuild() && !isStaff) {
      await interaction.reply({ content: 'You do not have permission to reply to DMs.', flags: 64 });
      return;
    }

    const userId = interaction.customId.replace('dm_reply_modal_', '');
    const text = interaction.fields.getTextInputValue('text');

    await interaction.deferReply();

    let user;
    try {
      user = await interaction.client.users.fetch(userId);
    } catch (fetchErr) {
      interaction.client.log.warn({ message: `Could not fetch user ${userId} to send DM`, error: fetchErr });
      await interaction.editReply(`Could not find user with ID ${userId}.`);
      return;
    }

    try {
      await user.send(text);
      const displayText = text.length > 1800 ? `${text.substring(0, 1800)}...` : text;
      const formatted = displayText.includes('\n') ? `>>> ${displayText}` : `\`${displayText}\``;
      await interaction.editReply(`Message sent to <@${user.id}>\n${formatted}`);
    } catch (error) {
      interaction.client.log.warn({ message: `Could not send DM to user ${userId}`, error: error });
      await interaction.editReply(`Could not send DM to <@${userId}>. They may have DMs disabled or have blocked the bot.`);
    }
  } catch (err) {
    interaction.client.log.error({ message: 'Error in handleReplyModal', error: err });
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('An error occurred while attempting to send the message.').catch(() => {});
    } else {
      await interaction.reply({ content: 'An error occurred while attempting to send the message.', flags: 64 }).catch(() => {});
    }
  }
}

module.exports = {
  handleDm,
  handleReplyButton,
  handleReplyModal,
  activeDmSessions
};
