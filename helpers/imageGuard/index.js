const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} = require('discord.js');
const { computePHash, hammingDistance, binaryToHex, hexToBinary } = require('./phash');
const { analyzeText } = require('./heuristics');

// In-memory cache of known scam hashes: Map<hexHash, { id, binaryHash, label, matchCount }>
let cachedHashes = new Map();
let isInitialized = false;

/**
 * Initializes and caches scam hashes from the database.
 * @param {import('discord.js').Client} client
 */
async function loadHashes(client) {
  try {
    const records = await client.DB.ScamImageHashes.findAll();
    cachedHashes.clear();
    for (const record of records) {
      const hex = record.Hash;
      cachedHashes.set(hex, {
        id: record.ID,
        hex: hex,
        binary: hexToBinary(hex),
        label: record.Label || 'Scam Image',
        matchCount: record.MatchCount || 0
      });
    }
    isInitialized = true;
    client.log.info(`[ImageGuard] Loaded ${cachedHashes.size} scam image hashes from database.`);
  } catch (err) {
    client.log.error({ message: '[ImageGuard] Failed to load scam hashes from database', error: err });
  }
}

/**
 * Adds a new scam hash to the database and in-memory cache.
 * @param {import('discord.js').Client} client
 * @param {string} hexHash
 * @param {string} label
 * @param {string} addedById
 */
async function addScamHash(client, hexHash, label, addedById) {
  const binary = hexToBinary(hexHash);
  const now = Math.floor(Date.now() / 1000);

  const [record, created] = await client.DB.ScamImageHashes.findOrCreate({
    where: { Hash: hexHash },
    defaults: {
      Hash: hexHash,
      Label: label || 'Scam Image',
      AddedBy: addedById,
      DateAdded: now,
      MatchCount: 0
    }
  });

  cachedHashes.set(hexHash, {
    id: record.ID,
    hex: hexHash,
    binary: binary,
    label: record.Label,
    matchCount: record.MatchCount
  });

  return { record, created };
}

/**
 * Checks an incoming message for scam images.
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').Message} message
 * @returns {Promise<{ buffer: Buffer, hash: string, flagDetails: object } | null>}
 */
async function checkMessage(client, message) {
  if (!client.config.imageGuard?.enabled) return null;
  if (!isInitialized) await loadHashes(client);

  const imageAttachments = message.attachments.filter(att => {
    const name = (att.name || '').toLowerCase();
    const contentType = (att.contentType || '').toLowerCase();
    return (
      contentType.startsWith('image/') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.webp') ||
      name.endsWith('.bmp')
    );
  });

  if (imageAttachments.size === 0) return null;

  for (const [, attachment] of imageAttachments) {
    try {
      const response = await fetch(attachment.url);
      if (!response.ok) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      const binaryHash = await computePHash(buffer);
      const hexHash = binaryToHex(binaryHash);
      const threshold = client.config.imageGuard.hammingThreshold || 8;

      let flagDetails = null;

      // 1. Layer 1: pHash comparison against cached database
      for (const [, known] of cachedHashes) {
        const distance = hammingDistance(binaryHash, known.binary);
        if (distance <= threshold) {
          flagDetails = {
            matchType: 'pHash',
            distance: distance,
            hexHash: hexHash,
            matchedHash: known.hex,
            label: known.label,
            attachmentName: attachment.name || 'image.png'
          };
          break;
        }
      }

      // 2. Layer 2: OCR Fallback if no pHash match
      if (!flagDetails && client.config.imageGuard.ocrUrl) {
        try {
          const ocrFormData = new FormData();
          ocrFormData.append('file', new Blob([buffer]), attachment.name || 'image.png');

          const ocrResponse = await fetch(client.config.imageGuard.ocrUrl, {
            method: 'POST',
            body: ocrFormData
          });

          if (ocrResponse.ok) {
            const ocrResult = await ocrResponse.text();
            let extractedText = ocrResult;
            try {
              const parsed = JSON.parse(ocrResult);
              extractedText = parsed.text || parsed.data || ocrResult;
            } catch {
              // Plain text response from ocrserver
            }

            const analysis = analyzeText(extractedText);
            if (analysis.isScam) {
              flagDetails = {
                matchType: 'OCR',
                hexHash: hexHash,
                extractedText: extractedText.trim().substring(0, 300),
                matchedPatterns: analysis.matchedPatterns,
                confidence: analysis.confidence,
                attachmentName: attachment.name || 'image.png'
              };
            }
          }
        } catch (ocrErr) {
          client.log.warn({ message: '[ImageGuard] OCR microservice call failed', error: ocrErr });
        }
      }

      // If matched, take action or send review card
      if (flagDetails) {
        client.log.info(`[ImageGuard] Flagged image in message ${message.id} from user ${message.author.id} (${flagDetails.matchType})`);

        // If in Honeypot channel, let honeypot do its ban, but return preloaded buffer
        if (message.channelId === client.config.channels.honeypot) {
          return { buffer, hash: hexHash, flagDetails };
        }

        const mode = client.config.imageGuard.mode || 'review';
        if (mode === 'review') {
          await sendReviewCard(client, message, buffer, flagDetails);
        } else if (mode === 'enforce') {
          await executeBanAndPurge(client, message, buffer, flagDetails);
        }

        return { buffer, hash: hexHash, flagDetails };
      }
    } catch (err) {
      client.log.error({ message: `[ImageGuard] Error processing attachment for message ${message.id}`, error: err });
    }
  }

  return null;
}

/**
 * Sends a review card to #scam-log with the re-uploaded image buffer and interactive buttons.
 */
async function sendReviewCard(client, message, buffer, flagDetails) {
  const scamLogChannelId = client.config.channels.scamLog;
  if (!scamLogChannelId) return;

  try {
    const scamLogChannel = await client.channels.fetch(scamLogChannelId);
    if (!scamLogChannel) return;

    const filename = `flagged_${message.id}.png`;
    const imageAttachment = new AttachmentBuilder(buffer, { name: filename });

    let reasonText = '';
    if (flagDetails.matchType === 'pHash') {
      reasonText = `**Perceptual Hash Match**\n• Distance: \`${flagDetails.distance} / 64\`\n• Known Hash: \`${flagDetails.matchedHash}\`\n• Label: *${flagDetails.label}*`;
    } else {
      reasonText = `**OCR Heuristic Match**\n• Triggers: ${flagDetails.matchedPatterns.map(p => `\`${p}\``).join(', ')}\n• Text Snippet: "${flagDetails.extractedText}"`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle('🚨 Suspected Scam Image Flagged for Review')
      .setDescription(
        `A suspect image was uploaded by <@${message.author.id}> in <#${message.channelId}>.\n` +
        `**[Jump to Message](${message.url})**\n\n${reasonText}`
      )
      .addFields(
        { name: 'Author', value: `<@${message.author.id}> (${message.author.id})`, inline: true },
        { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
        { name: 'Calculated pHash', value: `\`${flagDetails.hexHash}\``, inline: true }
      )
      .setImage(`attachment://${filename}`)
      .setFooter({ text: `Image Guard • Review Mode • Message ID: ${message.id}` })
      .setTimestamp();

    // Unique IDs for button routing:
    // imageguard_ban_<channelId>_<messageId>_<userId>
    // imageguard_save_<hexHash>
    // imageguard_dismiss_<messageId>
    const banButton = new ButtonBuilder()
      .setCustomId(`imageguard_ban_${message.channelId}_${message.id}_${message.author.id}`)
      .setLabel('🔨 Ban & Delete')
      .setStyle(ButtonStyle.Danger);

    const saveButton = new ButtonBuilder()
      .setCustomId(`imageguard_save_${flagDetails.hexHash}`)
      .setLabel('💾 Save Scam Hash')
      .setStyle(ButtonStyle.Primary);

    const dismissButton = new ButtonBuilder()
      .setCustomId(`imageguard_dismiss_${message.id}`)
      .setLabel('❌ Dismiss')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(banButton, saveButton, dismissButton);

    await scamLogChannel.send({
      embeds: [embed],
      files: [imageAttachment],
      components: [row]
    });
  } catch (err) {
    client.log.error({ message: '[ImageGuard] Error sending review card to #scam-log', error: err });
  }
}

/**
 * Executes automatic ban, purge, and logging in enforce mode or upon button click.
 */
async function executeBanAndPurge(client, messageOrIds, buffer, flagDetails, staffUser = null) {
  let message = null;
  let channelId, messageId, userId;

  if (messageOrIds.author) {
    message = messageOrIds;
    channelId = message.channelId;
    messageId = message.id;
    userId = message.author.id;
  } else {
    channelId = messageOrIds.channelId;
    messageId = messageOrIds.messageId;
    userId = messageOrIds.userId;
  }

  const appealUrl = client.config.imageGuard.banAppealUrl || 'https://bans.discordclique.com';
  let dmd = false;
  let banned = false;

  // 1. DM User
  try {
    const user = await client.users.fetch(userId);
    if (user) {
      const dmChannel = await user.createDM();
      await dmChannel.send(
        `You have been banned from \`twenty one pilots\` for posting a scam image.\n` +
        `If you believe this was a mistake, please submit a ban appeal at ${appealUrl}`
      );
      dmd = true;
    }
  } catch (dmErr) {
    client.log.warn({ message: `[ImageGuard] Failed to DM user ${userId} about ban`, error: dmErr });
  }

  // 2. Ban Member
  try {
    const guild = await client.guilds.fetch(client.config.guildID);
    await guild.members.ban(userId, {
      deleteMessageSeconds: 300,
      reason: `Scam image detected by Image Guard (${flagDetails?.matchType || 'manual review'})${staffUser ? ` by ${staffUser.tag}` : ''}`
    });
    banned = true;
  } catch (banErr) {
    client.log.error({ message: `[ImageGuard] Failed to ban user ${userId}`, error: banErr });
  }

  // 3. Delete Message
  try {
    if (message) {
      await message.delete().catch(() => {});
    } else {
      const channel = await client.channels.fetch(channelId);
      if (channel) {
        const msg = await channel.messages.fetch(messageId).catch(() => {});
        if (msg) await msg.delete().catch(() => {});
      }
    }
  } catch (delErr) {
    client.log.warn({ message: `[ImageGuard] Failed to delete scam message ${messageId}`, error: delErr });
  }

  // 4. Record Note in DB.Notes
  try {
    const noteText = `User was banned for posting a scam image (${flagDetails?.matchType || 'review'}).${staffUser ? ` Action confirmed by ${staffUser.tag}.` : ' Automatically enforced.'}`;
    await client.DB.Notes.create({
      User: userId,
      Date: Math.floor(Date.now() / 1000),
      Note: noteText,
      Severity: 'high',
      Noter: staffUser ? staffUser.id : client.config.clientID
    });
    client.log.info(`[ImageGuard] Added high severity note for banned user ${userId}`);
  } catch (noteErr) {
    client.log.error({ message: '[ImageGuard] Failed to create note in DB', error: noteErr });
  }

  // 5. Post to #ban-log with Re-uploaded Image
  try {
    const banLogChannel = await client.channels.fetch(client.config.channels.banLog);
    if (banLogChannel) {
      const filename = `banned_scam_${messageId}.png`;
      const banEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('User Banned for Scam Image')
        .setDescription(
          `${dmd ? "User was DM'd ban appeal" : "User was unable to be DM'd."}\n` +
          `User was ${banned ? 'successfully' : 'unable to be'} banned for scam image detection.`
        )
        .addFields(
          { name: 'User', value: `<@${userId}> - ${userId}`, inline: true },
          { name: 'Trigger', value: flagDetails?.matchType || 'Manual Review', inline: true },
          { name: 'Moderator', value: staffUser ? `<@${staffUser.id}>` : 'Image Guard Auto', inline: true }
        )
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: client.icon })
        .setTimestamp();

      const payload = { embeds: [banEmbed] };
      if (buffer) {
        const file = new AttachmentBuilder(buffer, { name: filename });
        payload.files = [file];
        banEmbed.setImage(`attachment://${filename}`);
      }

      await banLogChannel.send(payload);
    }
  } catch (logErr) {
    client.log.error({ message: '[ImageGuard] Error logging to banLog', error: logErr });
  }
}

/**
 * Handles button interactions originating from #scam-log review cards.
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleReviewInteraction(interaction) {
  const staffRoleId = interaction.client.config.roles.staff;
  const isStaff = interaction.member.roles.cache.has(staffRoleId);

  if (!isStaff) {
    return interaction.reply({ content: '❌ You must be a staff member to take moderation actions.', ephemeral: true });
  }

  const customId = interaction.customId;

  // 1. BAN & DELETE
  if (customId.startsWith('imageguard_ban_')) {
    const parts = customId.split('_');
    const channelId = parts[2];
    const messageId = parts[3];
    const userId = parts[4];

    await interaction.deferUpdate();

    // Fetch existing attachment buffer from original embed if available
    let buffer = null;
    const originalEmbed = interaction.message.embeds[0];
    if (interaction.message.attachments.size > 0) {
      const att = interaction.message.attachments.first();
      try {
        const res = await fetch(att.url);
        if (res.ok) buffer = Buffer.from(await res.arrayBuffer());
      } catch (e) {
        interaction.client.log.warn({ message: '[ImageGuard] Could not re-fetch review card buffer', error: e });
      }
    }

    await executeBanAndPurge(
      interaction.client,
      { channelId, messageId, userId },
      buffer,
      { matchType: 'Staff Verified Review' },
      interaction.user
    );

    // Update review card embed and disable buttons
    const updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setColor(0x880000)
      .setFooter({ text: `🔨 Action Taken: Banned by ${interaction.user.tag}` });

    await interaction.message.edit({
      embeds: [updatedEmbed],
      components: []
    });

    await interaction.followUp({ content: `✅ User <@${userId}> was banned, message purged, note created, and audit logged to banLog.`, ephemeral: true });
    return;
  }

  // 2. SAVE SCAM HASH
  if (customId.startsWith('imageguard_save_')) {
    const hexHash = customId.replace('imageguard_save_', '');
    await interaction.deferUpdate();

    try {
      const { created } = await addScamHash(interaction.client, hexHash, 'Verified Scam Image', interaction.user.id);

      // Disable or update the Save button
      const oldRows = interaction.message.components;
      const updatedRow = new ActionRowBuilder();

      for (const comp of oldRows[0].components) {
        if (comp.customId.startsWith('imageguard_save_')) {
          updatedRow.addComponents(
            new ButtonBuilder()
              .setCustomId('saved_disabled')
              .setLabel('💾 Hash Saved')
              .setStyle(ButtonStyle.Success)
              .setDisabled(true)
          );
        } else {
          updatedRow.addComponents(ButtonBuilder.from(comp));
        }
      }

      await interaction.message.edit({ components: [updatedRow] });
      await interaction.followUp({
        content: created
          ? `✅ Perceptual hash \`${hexHash}\` has been permanently saved to the scam database.`
          : `ℹ️ Hash \`${hexHash}\` was already registered in the database.`,
        ephemeral: true
      });
    } catch (err) {
      interaction.client.log.error({ message: '[ImageGuard] Error saving scam hash', error: err });
      await interaction.followUp({ content: '❌ Failed to save scam hash to database.', ephemeral: true });
    }
    return;
  }

  // 3. DISMISS
  if (customId.startsWith('imageguard_dismiss_')) {
    await interaction.deferUpdate();

    const originalEmbed = interaction.message.embeds[0];
    const updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setColor(0x555555)
      .setFooter({ text: `❌ Dismissed by ${interaction.user.tag} (False Positive)` });

    await interaction.message.edit({
      embeds: [updatedEmbed],
      components: []
    });

    await interaction.followUp({ content: 'Dismissed review alert.', ephemeral: true });
  }
}

module.exports = {
  loadHashes,
  addScamHash,
  checkMessage,
  handleReviewInteraction,
  executeBanAndPurge
};
