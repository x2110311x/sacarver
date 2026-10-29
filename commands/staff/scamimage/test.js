const { EmbedBuilder } = require('discord.js');
const { computePHash, hammingDistance, binaryToHex, hexToBinary } = require('../../../helpers/imageGuard/phash');
const { analyzeText } = require('../../../helpers/imageGuard/heuristics');

module.exports = {
  builder: function(subcommandGroup) {
    subcommandGroup.addSubcommand(subcommand =>
      subcommand
        .setName('test')
        .setDescription('Test an image against Image Guard diagnostics (pHash, nearest match, OCR)')
        .addAttachmentOption(option =>
          option
            .setName('image')
            .setDescription('The image to diagnose')
            .setRequired(true)
        )
    );
    return subcommandGroup;
  },
  execute: async function(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const client = interaction.client;
    const attachment = interaction.options.getAttachment('image');

    if (!attachment.contentType?.startsWith('image/')) {
      return interaction.editReply({ content: '❌ The provided attachment must be an image file (.png, .jpg, .webp).' });
    }

    try {
      const response = await fetch(attachment.url);
      if (!response.ok) {
        return interaction.editReply({ content: '❌ Failed to download attachment.' });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const binaryHash = await computePHash(buffer);
      const hexHash = binaryToHex(binaryHash);

      // Compare against all stored hashes to find the nearest neighbor
      const records = await client.DB.ScamImageHashes.findAll();
      let nearestMatch = null;
      let lowestDistance = 64;

      for (const record of records) {
        const recordBinary = hexToBinary(record.Hash);
        const distance = hammingDistance(binaryHash, recordBinary);
        if (distance < lowestDistance) {
          lowestDistance = distance;
          nearestMatch = record;
        }
      }

      const threshold = client.config.imageGuard?.hammingThreshold ?? 6;
      const isPHashMatch = nearestMatch && lowestDistance <= threshold;

      // Run OCR diagnostics if configured
      let ocrExtracted = 'OCR service not configured';
      let ocrAnalysis = { isScam: false, matchedPatterns: [] };

      if (client.config.imageGuard?.ocrUrl) {
        try {
          const ocrFormData = new FormData();
          ocrFormData.append('file', new Blob([buffer]), attachment.name || 'test.png');

          const ocrResponse = await fetch(client.config.imageGuard.ocrUrl, {
            method: 'POST',
            body: ocrFormData
          });

          if (ocrResponse.ok) {
            const raw = await ocrResponse.text();
            try {
              const parsed = JSON.parse(raw);
              ocrExtracted = parsed.text || raw;
            } catch {
              ocrExtracted = raw;
            }
            const minConfidence = client.config.imageGuard?.ocrMinConfidence ?? 0.7;
            ocrAnalysis = analyzeText(ocrExtracted, minConfidence);
          } else {
            ocrExtracted = `Error: HTTP ${ocrResponse.status}`;
          }
        } catch (ocrErr) {
          ocrExtracted = `OCR Request Failed: ${ocrErr.message}`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(isPHashMatch || ocrAnalysis.isScam ? 0xe74c3c : 0x2ecc71)
        .setTitle('🔬 Image Guard Diagnostic Test')
        .setThumbnail(attachment.url)
        .addFields(
          { name: 'Calculated pHash', value: `\`${hexHash}\``, inline: false },
          {
            name: 'Nearest Known Scam Hash',
            value: nearestMatch
              ? `• Hash: \`${nearestMatch.Hash}\`\n• Distance: **${lowestDistance} / 64** ${isPHashMatch ? '🚨 **MATCH!**' : '✅ (Safe)'}\n• Label: *${nearestMatch.Label}*`
              : 'No hashes in database',
            inline: false
          },
          {
            name: 'OCR & Heuristics Analysis',
            value: `• Scam Flagged: ${ocrAnalysis.isScam ? '🚨 **YES**' : '✅ **NO**'}\n• Confidence: **${Math.round((ocrAnalysis.confidence || 0) * 100)}%** (Gate: ${Math.round((client.config.imageGuard?.ocrMinConfidence ?? 0.7) * 100)}%)\n• Triggers: ${ocrAnalysis.matchedPatterns.length > 0 ? ocrAnalysis.matchedPatterns.join(', ') : 'None'}\n• Extracted Text:\n\`\`\`${(ocrExtracted || 'None').trim().substring(0, 300)}\`\`\``,
            inline: false
          }
        )
        .setFooter({ text: `Image Guard • Diagnostic Only • No action taken`, iconURL: client.icon })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      client.log.error({ message: '[ImageGuard] Diagnostic test failed', error: err });
      await interaction.editReply({ content: '❌ Diagnostic test encountered an error.' });
    }
  }
};
