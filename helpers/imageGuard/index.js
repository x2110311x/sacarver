const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { computePHash, hammingDistance, binaryToHex, hexToBinary } = require('./phash');
const { analyzeText } = require('./heuristics');

/**
 * Inverts an image buffer and calculates average luminance.
 * Useful for dark-mode screenshots where Tesseract performs poorly without inversion.
 * @param {Buffer} buffer
 * @returns {Promise<{ invertedBuffer: Buffer, avgLuminance: number }>}
 */
async function invertImageBuffer(buffer) {
  const img = await loadImage(buffer);
  const w = img.width;
  const h = img.height;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  let totalLuminance = 0;
  for (let i = 0; i < d.length; i += 4) {
    totalLuminance += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }
  const avgLuminance = totalLuminance / (w * h);
  ctx.putImageData(imgData, 0, 0);
  const invertedBuffer = canvas.toBuffer('image/png');
  return { invertedBuffer, avgLuminance };
}

/**
 * Sends an image buffer to the OCR microservice and extracts the text.
 * @param {string} ocrUrl
 * @param {Buffer} buf
 * @param {string} filename
 * @returns {Promise<string>}
 */
async function requestOcr(ocrUrl, buf, filename) {
  const ocrFormData = new FormData();
  ocrFormData.append('file', new Blob([buf]), filename || 'image.png');
  const ocrResponse = await fetch(ocrUrl, {
    method: 'POST',
    body: ocrFormData
  });
  if (!ocrResponse.ok) return '';
  const ocrResult = await ocrResponse.text();
  try {
    const parsed = JSON.parse(ocrResult);
    return parsed.result || parsed.text || parsed.data || ocrResult;
  } catch {
    return ocrResult;
  }
}

// In-memory cache of known scam hashes: Map<hexHash, { id, binaryHash, label, matchCount }>
let cachedHashes = new Map();
let isInitialized = false;

/**
 * Initializes and caches scam hashes from the database.
 * @param {import('discord.js').Client} client
 */
async function loadHashes(client) {
  try {
    client.log.debug('[ImageGuard] Querying ScamImageHashes table from database...');
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
      client.log.debug(`[ImageGuard] Cached hash [ID ${record.ID}]: hex="${hex}", label="${record.Label}"`);
    }
    isInitialized = true;
    client.log.info(`[ImageGuard] Loaded ${cachedHashes.size} scam image hash(es) from database.`);
    if (cachedHashes.size === 0) {
      client.log.debug('[ImageGuard] Note: Database currently contains 0 scam hashes. pHash comparison will only match once hashes are registered via /staff scamimage add or OCR catches.');
    }
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
 * @param {boolean} [isStaff=false]
 * @returns {Promise<{ buffer: Buffer, hash: string, flagDetails: object } | null>}
 */
async function checkMessage(client, message, isStaff = false) {
  const staffRoleId = client.config.roles?.staff || '323555864646647808';
  const hasStaffRole = isStaff || (message.member && message.member.roles.cache.has(staffRoleId));
  if (hasStaffRole) {
    client.log.debug(`[ImageGuard] Author ${message.author?.id} has staff role. Skipping Image Guard processing.`);
    return null;
  }

  if (!client.config.imageGuard?.enabled) {
    client.log.debug('[ImageGuard] imageGuard is disabled in config. Skipping.');
    return null;
  }
  if (!isInitialized) {
    client.log.debug('[ImageGuard] Hashes not initialized yet. Calling loadHashes()...');
    await loadHashes(client);
  }

  const scamLogChannelId = client.config.channels?.scamLog;
  client.log.debug(`[ImageGuard] Active config: mode="${client.config.imageGuard.mode}", ocrUrl="${client.config.imageGuard.ocrUrl}", threshold=${client.config.imageGuard.hammingThreshold || 8}, scamLogChannel="${scamLogChannelId}"`);

  const imageAttachments = message.attachments.filter(att => {
    const name = (att.name || '').toLowerCase();
    const contentType = (att.contentType || '').toLowerCase();
    const isImg = (
      contentType.startsWith('image/') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.webp') ||
      name.endsWith('.bmp')
    );
    client.log.debug(`[ImageGuard] Attachment check: name="${att.name}", type="${att.contentType}", isImage=${isImg}`);
    return isImg;
  });

  if (imageAttachments.size === 0) {
    client.log.debug(`[ImageGuard] Message ${message.id} has no image attachments. Skipping.`);
    return null;
  }

  client.log.debug(`[ImageGuard] Found ${imageAttachments.size} image attachment(s) to scan in message ${message.id}.`);

  for (const [, attachment] of imageAttachments) {
    try {
      client.log.debug(`[ImageGuard] Downloading attachment from ${attachment.url}...`);
      const response = await fetch(attachment.url);
      if (!response.ok) {
        client.log.warn(`[ImageGuard] Failed to fetch attachment (HTTP ${response.status}) from ${attachment.url}`);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      client.log.debug(`[ImageGuard] Downloaded buffer for ${attachment.name}: ${buffer.length} bytes.`);

      client.log.debug(`[ImageGuard] Computing 2D DCT pHash for ${attachment.name}...`);
      const binaryHash = await computePHash(buffer);
      const hexHash = binaryToHex(binaryHash);
      const threshold = client.config.imageGuard.hammingThreshold || 8;
      client.log.debug(`[ImageGuard] Computed pHash for ${attachment.name}: hex="${hexHash}" (binary length: ${binaryHash.length})`);

      let flagDetails = null;

      // 1. Layer 1: pHash comparison against cached database
      client.log.debug(`[ImageGuard] Comparing against ${cachedHashes.size} known scam hash(es) (threshold: ${threshold})...`);
      let lowestDistance = 64;
      for (const [, known] of cachedHashes) {
        const distance = hammingDistance(binaryHash, known.binary);
        if (distance < lowestDistance) lowestDistance = distance;
        client.log.debug(`[ImageGuard] Hash compare: distance=${distance} to [ID ${known.id}] ${known.hex} ("${known.label}")`);
        if (distance <= threshold) {
          client.log.info(`[ImageGuard] pHash MATCH FOUND! Distance ${distance} <= threshold ${threshold} for [ID ${known.id}] "${known.label}"`);
          known.matchCount++;
          client.DB.ScamImageHashes.increment('MatchCount', { where: { ID: known.id } }).catch(() => {});
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

      if (!flagDetails) {
        client.log.debug(`[ImageGuard] No pHash match for ${attachment.name}. Lowest distance seen was ${lowestDistance} (threshold: ${threshold}).`);
      }

      // 2. Layer 2: OCR Fallback if no pHash match
      if (!flagDetails && client.config.imageGuard.ocrUrl) {
        client.log.debug(`[ImageGuard] Querying OCR microservice at ${client.config.imageGuard.ocrUrl}...`);
        try {
          // Pass 1: Original image
          let extractedText = await requestOcr(client.config.imageGuard.ocrUrl, buffer, attachment.name);
          let analysis = analyzeText(extractedText);

          client.log.debug(`[ImageGuard] Pass 1 OCR extracted text (${(extractedText || '').length} chars): "${(extractedText || '').trim().replace(/\n+/g, ' ')}"`);
          client.log.debug(`[ImageGuard] Pass 1 Heuristics: isScam=${analysis.isScam}, patterns=${JSON.stringify(analysis.matchedPatterns)}, confidence=${analysis.confidence}`);

          // Pass 2: Inverted image (critical for dark mode / dark screen photos where Tesseract fails)
          if (!analysis.isScam) {
            try {
              const { invertedBuffer, avgLuminance } = await invertImageBuffer(buffer);
              client.log.debug(`[ImageGuard] Image average luminance: ${avgLuminance.toFixed(1)} (dark mode: ${avgLuminance < 128}). Running inverted OCR pass...`);
              const invertedText = await requestOcr(client.config.imageGuard.ocrUrl, invertedBuffer, 'inverted.png');
              const invertedAnalysis = analyzeText(invertedText);
              client.log.debug(`[ImageGuard] Pass 2 (Inverted) OCR extracted text (${(invertedText || '').length} chars): "${(invertedText || '').trim().replace(/\n+/g, ' ')}"`);
              client.log.debug(`[ImageGuard] Pass 2 Heuristics: isScam=${invertedAnalysis.isScam}, patterns=${JSON.stringify(invertedAnalysis.matchedPatterns)}, confidence=${invertedAnalysis.confidence}`);

              if (invertedAnalysis.isScam) {
                extractedText = invertedText;
                analysis = invertedAnalysis;
              }
            } catch (invErr) {
              client.log.warn({ message: '[ImageGuard] Error during inverted OCR pass', error: invErr });
            }
          }

          if (analysis.isScam) {
            client.log.info(`[ImageGuard] OCR Heuristic MATCH FOUND! Patterns: ${analysis.matchedPatterns.join(', ')}`);
            flagDetails = {
              matchType: 'OCR',
              hexHash: hexHash,
              extractedText: extractedText.trim().substring(0, 300),
              matchedPatterns: analysis.matchedPatterns,
              confidence: analysis.confidence,
              attachmentName: attachment.name || 'image.png'
            };
          }
        } catch (ocrErr) {
          client.log.warn({ message: `[ImageGuard] OCR microservice call failed to ${client.config.imageGuard.ocrUrl}`, error: ocrErr });
        }
      } else if (!flagDetails) {
        client.log.debug('[ImageGuard] OCR url not configured. Skipping Layer 2 OCR check.');
      }

      // If matched, take action or send review card
      if (flagDetails) {
        client.log.info(`[ImageGuard] Flagged image in message ${message.id} from user ${message.author.id} (${flagDetails.matchType})`);

        // If in Honeypot channel, let honeypot do its ban, but return preloaded buffer
        if (message.channelId === client.config.channels.honeypot) {
          client.log.debug(`[ImageGuard] Message is in honeypot channel (${message.channelId}). Returning buffer for honeypot ban.`);
          return { buffer, hash: hexHash, flagDetails };
        }

        const mode = client.config.imageGuard.mode || 'review';
        const autoBanExact = client.config.imageGuard.autoBanExactMatch !== false;
        const isPerfectPHashMatch = flagDetails.matchType === 'pHash' && flagDetails.distance === 0;

        client.log.debug(`[ImageGuard] Moderation decision: mode="${mode}", isPerfectPHashMatch=${isPerfectPHashMatch}, autoBanExact=${autoBanExact}, isStaff=${isStaff}`);

        // Perfect pHash matches (distance 0) automatically ban non-staff users immediately
        if (isPerfectPHashMatch && autoBanExact && !isStaff) {
          client.log.info(`[ImageGuard] Perfect pHash match (distance 0) for message ${message.id} from user ${message.author.id}. Automatically executing ban, purge, manual delete, and dual logging to ban-log and scam-log.`);
          await executeBanAndPurge(client, message, buffer, flagDetails);
        } else if (mode === 'review' || (isPerfectPHashMatch && isStaff)) {
          client.log.debug(`[ImageGuard] Calling sendReviewCard for message ${message.id}...`);
          await sendReviewCard(client, message, buffer, flagDetails, isStaff);
        } else if (mode === 'enforce') {
          if (isStaff) {
            client.log.info(`[ImageGuard] User ${message.author.id} is staff. Skipping automatic ban/delete in enforce mode.`);
          } else {
            client.log.debug(`[ImageGuard] Calling executeBanAndPurge for message ${message.id}...`);
            await executeBanAndPurge(client, message, buffer, flagDetails);
          }
        }

        return { buffer, hash: hexHash, flagDetails };
      } else {
        client.log.debug(`[ImageGuard] Image ${attachment.name} in message ${message.id} was evaluated as SAFE (no pHash or OCR flag).`);
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
async function sendReviewCard(client, message, buffer, flagDetails, isStaff = false) {
  const scamLogChannelId = client.config.channels.scamLog;
  client.log.debug(`[ImageGuard] sendReviewCard called for message ${message.id}. scamLogChannelId="${scamLogChannelId}"`);

  if (!scamLogChannelId) {
    client.log.warn('[ImageGuard] No scamLog channel ID configured in config.channels.scamLog! Review card cannot be sent.');
    return;
  }

  try {
    const scamLogChannel = await client.channels.fetch(scamLogChannelId);
    if (!scamLogChannel) {
      client.log.error(`[ImageGuard] Failed to fetch scamLog channel with ID "${scamLogChannelId}". Does the bot have permission to view it?`);
      return;
    }

    client.log.debug(`[ImageGuard] Fetched scamLog channel #${scamLogChannel.name || scamLogChannelId}. Creating embed and AttachmentBuilder...`);

    const filename = `flagged_${message.id}.png`;
    const imageAttachment = new AttachmentBuilder(buffer, { name: filename });

    let reasonText = '';
    if (flagDetails.matchType === 'pHash') {
      reasonText = `**Perceptual Hash Match**\n• Distance: \`${flagDetails.distance} / 64\`\n• Known Hash: \`${flagDetails.matchedHash}\`\n• Label: *${flagDetails.label}*`;
    } else {
      reasonText = `**OCR Heuristic Match**\n• Triggers: ${flagDetails.matchedPatterns.map(p => `\`${p}\``).join(', ')}\n• Text Snippet: "${flagDetails.extractedText}"`;
    }

    if (isStaff) {
      reasonText += '\n\n⚠️ *Notice: Author has the Staff role (Test/Preview mode).*';
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
      .setCustomId(`imageguard_ban_${message.channelId}_${message.id}_${message.author.id}_${flagDetails.hexHash}`)
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

  // 6. Post to #scam-log with Re-uploaded Image (for automatic bans)
  if (!staffUser) {
    try {
      const scamLogChannelId = client.config.channels?.scamLog;
      if (scamLogChannelId) {
        const scamLogChannel = await client.channels.fetch(scamLogChannelId);
        if (scamLogChannel) {
          const filename = `autoban_scam_${messageId}.png`;
          const isExact = flagDetails?.distance === 0;
          const scamEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(isExact ? '⚡ Automatic Ban: Exact Scam Image Match' : '🔨 User Automatically Banned for Scam Image')
            .setDescription(
              `A confirmed scam image was detected in <#${channelId}> posted by <@${userId}>.\n\n` +
              `• **Action Taken:** User automatically banned, purge (300s) executed, message deleted.\n` +
              `• **Appeal DM:** ${dmd ? "Sent to user" : "Unable to DM user"}\n` +
              `• **Trigger:** ${isExact ? '**Exact pHash Match (Distance 0)**' : (flagDetails?.matchType || 'Automatic Enforce')}\n` +
              (flagDetails?.label ? `• **Database Label:** *${flagDetails.label}*\n` : '') +
              (flagDetails?.hexHash ? `• **pHash:** \`${flagDetails.hexHash}\`\n` : '')
            )
            .addFields(
              { name: 'User', value: `<@${userId}> (${userId})`, inline: true },
              { name: 'Channel', value: `<#${channelId}>`, inline: true },
              { name: 'Moderator', value: 'Image Guard (Auto Ban)', inline: true }
            )
            .setFooter({ text: `Image Guard • Auto Ban • Message ID: ${messageId}` })
            .setTimestamp();

          const payload = { embeds: [scamEmbed] };
          if (buffer) {
            const file = new AttachmentBuilder(buffer, { name: filename });
            payload.files = [file];
            scamEmbed.setImage(`attachment://${filename}`);
          }

          await scamLogChannel.send(payload);
        }
      }
    } catch (scamErr) {
      client.log.error({ message: '[ImageGuard] Error logging auto-ban to scamLog', error: scamErr });
    }
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
    const hexHash = parts[5] || interaction.message.embeds[0]?.fields?.find(f => f.name === 'Calculated pHash')?.value?.replace(/`/g, '') || null;

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

    // Also save hash on ban and delete as requested
    let hashSaved = false;
    if (hexHash) {
      try {
        await addScamHash(interaction.client, hexHash, 'Banned Scam Image', interaction.user.id);
        hashSaved = true;
      } catch (saveErr) {
        interaction.client.log.warn({ message: '[ImageGuard] Error saving scam hash during ban', error: saveErr });
      }
    }

    // Update review card embed and remove buttons completely
    const updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setColor(0x880000)
      .setFooter({ text: `🔨 Action Taken: Banned by ${interaction.user.tag}${hashSaved ? ' • Hash Saved' : ''}` });

    await interaction.message.edit({
      embeds: [updatedEmbed],
      components: []
    });

    // Public follow-up message so everyone in the channel sees the action
    await interaction.followUp({
      content: `🔨 <@${interaction.user.id}> banned <@${userId}> and purged the scam message.${hashSaved ? ` Perceptual hash \`${hexHash}\` was saved to the database.` : ''}`,
      ephemeral: false
    });
    return;
  }

  // 2. SAVE SCAM HASH
  if (customId.startsWith('imageguard_save_')) {
    const hexHash = customId.replace('imageguard_save_', '');
    await interaction.deferUpdate();

    try {
      const { created } = await addScamHash(interaction.client, hexHash, 'Verified Scam Image', interaction.user.id);

      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setColor(0x2ecc71)
        .setFooter({ text: `💾 Scam hash saved by ${interaction.user.tag}` });

      // Remove buttons completely
      await interaction.message.edit({
        embeds: [updatedEmbed],
        components: []
      });

      // Public follow-up message so everyone in the channel sees the action
      await interaction.followUp({
        content: created
          ? `💾 <@${interaction.user.id}> saved perceptual hash \`${hexHash}\` to the scam database.`
          : `ℹ️ <@${interaction.user.id}> attempted to save hash \`${hexHash}\`, but it was already registered in the database.`,
        ephemeral: false
      });
    } catch (err) {
      interaction.client.log.error({ message: '[ImageGuard] Error saving scam hash', error: err });
      await interaction.followUp({ content: '❌ Failed to save scam hash to database.', ephemeral: false });
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

    // Remove buttons completely
    await interaction.message.edit({
      embeds: [updatedEmbed],
      components: []
    });

    // Public follow-up message so everyone in the channel sees the action
    await interaction.followUp({
      content: `❌ <@${interaction.user.id}> dismissed this review alert (false positive).`,
      ephemeral: false
    });
  }
}

module.exports = {
  loadHashes,
  addScamHash,
  checkMessage,
  handleReviewInteraction,
  executeBanAndPurge
};
