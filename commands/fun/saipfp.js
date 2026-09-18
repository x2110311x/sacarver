const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

let cachedSaiOverlay = null;

async function getSaiOverlay() {
  if (cachedSaiOverlay) return cachedSaiOverlay;

  const saiPath = path.resolve(__dirname, '../../assets/images/sai.png');
  const maskPath = path.resolve(__dirname, '../../assets/images/saimask.png');

  const [saiImg, maskImg] = await Promise.all([
    loadImage(saiPath),
    loadImage(maskPath)
  ]);

  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(saiImg, 0, 0, 512, 512);

  const maskCanvas = createCanvas(512, 512);
  const maskCtx = maskCanvas.getContext('2d');
  maskCtx.drawImage(maskImg, 0, 0, 512, 512);

  const saiData = ctx.getImageData(0, 0, 512, 512);
  const maskData = maskCtx.getImageData(0, 0, 512, 512);

  for (let i = 0; i < saiData.data.length; i += 4) {
    const maskVal = maskData.data[i];
    saiData.data[i + 3] = Math.min(saiData.data[i + 3], maskVal);
  }

  ctx.putImageData(saiData, 0, 0);
  cachedSaiOverlay = canvas;
  return cachedSaiOverlay;
}

module.exports = {
  builder: function (SlashCommandBuilder) {
    SlashCommandBuilder.addSubcommand(subcommand =>
      subcommand
        .setName('saipfp')
        .setDescription('Generate a Scaled And Icy themed profile picture')
        .addAttachmentOption(option =>
          option
            .setName('image')
            .setDescription('Image to use (defaults to your profile picture)')
            .setRequired(false)
        )
    );
    return SlashCommandBuilder;
  },

  execute: async function (interaction) {
    await interaction.deferReply();

    try {
      const attachment = interaction.options.getAttachment('image');
      let imageUrl = null;

      if (attachment) {
        const contentType = attachment.contentType || '';
        if (!contentType.startsWith('image/') && !/\.(png|jpe?g|webp|gif)$/i.test(attachment.name || '')) {
          await interaction.editReply('The provided file does not appear to be an image.');
          return;
        }
        imageUrl = attachment.url;
      } else {
        imageUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 512 });
      }

      const res = await fetch(imageUrl);
      if (!res.ok) {
        await interaction.editReply('Failed to download image.');
        return;
      }

      const imageBuffer = Buffer.from(await res.arrayBuffer());
      const userImg = await loadImage(imageBuffer);

      const saiOverlay = await getSaiOverlay();

      const canvas = createCanvas(512, 512);
      const ctx = canvas.getContext('2d');

      const imgRatio = userImg.width / userImg.height;
      let sx = 0;
      let sy = 0;
      let sWidth = userImg.width;
      let sHeight = userImg.height;

      if (imgRatio > 1) {
        sWidth = userImg.height;
        sx = (userImg.width - sWidth) / 2;
      } else {
        sHeight = userImg.width;
        sy = (userImg.height - sHeight) / 2;
      }

      ctx.drawImage(userImg, sx, sy, sWidth, sHeight, 0, 0, 512, 512);

      // Convert to grayscale and multiply with pink (170, 122, 240) at 0.95 opacity
      const imgData = ctx.getImageData(0, 0, 512, 512);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
        d[i]     = Math.min(255, Math.round(gray * 0.05 + ((gray * 170) / 255) * 0.95));
        d[i + 1] = Math.min(255, Math.round(gray * 0.05 + ((gray * 122) / 255) * 0.95));
        d[i + 2] = Math.min(255, Math.round(gray * 0.05 + ((gray * 240) / 255) * 0.95));
        d[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      // Draw the SAI Trash dragon overlay
      ctx.drawImage(saiOverlay, 0, 0, 512, 512);

      const outBuffer = canvas.toBuffer('image/png');
      const file = new AttachmentBuilder(outBuffer, { name: 'saipfp.png' });

      await interaction.editReply({ files: [file] });
    } catch (err) {
      interaction.client.log.error({ message: 'Error executing saipfp command', error: err });
      await interaction.editReply('I encountered an error generating the saipfp image.');
    }
  }
};
