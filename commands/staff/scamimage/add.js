const { EmbedBuilder } = require('discord.js');
const imageGuard = require('../../../helpers/imageGuard');
const { computePHash, binaryToHex } = require('../../../helpers/imageGuard/phash');

module.exports = {
  builder: function(subcommandGroup) {
    subcommandGroup.addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a new scam image hash to the database')
        .addAttachmentOption(option =>
          option
            .setName('image')
            .setDescription('The scam image to hash and store')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('label')
            .setDescription('Optional description or label for the scam image')
            .setRequired(false)
        )
    );
    return subcommandGroup;
  },
  execute: async function(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const client = interaction.client;
    const attachment = interaction.options.getAttachment('image');
    const label = interaction.options.getString('label') || 'Scam Image';

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

      const { created } = await imageGuard.addScamHash(client, hexHash, label, interaction.user.id);

      const embed = new EmbedBuilder()
        .setColor(created ? 0x00ff00 : 0xf1c40f)
        .setTitle(created ? '✅ Scam Image Hash Added' : 'ℹ️ Hash Already Registered')
        .setThumbnail(attachment.url)
        .addFields(
          { name: 'Label', value: label, inline: true },
          { name: 'Perceptual Hash (hex)', value: `\`${hexHash}\``, inline: true },
          { name: 'Added By', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ text: `Image Guard • © ${new Date().getFullYear()} x2110311x`, iconURL: client.icon })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      client.log.error({ message: '[ImageGuard] Failed to add scam hash via slash command', error: err });
      await interaction.editReply({ content: '❌ An error occurred while computing the image hash.' });
    }
  }
};
