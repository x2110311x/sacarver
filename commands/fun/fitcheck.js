const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

let cachedBackdrop = null;

async function getBackdrop() {
  if (cachedBackdrop) return cachedBackdrop;

  const backdropPath = path.resolve(__dirname, '../../assets/images/tylerframe.png');
  const maskPath = path.resolve(__dirname, '../../assets/images/mask.png');

  const [backdropImg, maskImg] = await Promise.all([
    loadImage(backdropPath),
    loadImage(maskPath)
  ]);

  const canvas = createCanvas(1154, 2048);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(backdropImg, 0, 0, 1154, 2048);

  const maskCanvas = createCanvas(1154, 2048);
  const maskCtx = maskCanvas.getContext('2d');
  maskCtx.drawImage(maskImg, 0, 0, 1154, 2048);

  const frameData = ctx.getImageData(0, 0, 1154, 2048);
  const maskData = maskCtx.getImageData(0, 0, 1154, 2048);

  for (let i = 0; i < frameData.data.length; i += 4) {
    const maskVal = maskData.data[i];
    frameData.data[i + 3] = Math.min(frameData.data[i + 3], maskVal);
  }

  ctx.putImageData(frameData, 0, 0);
  cachedBackdrop = canvas;
  return cachedBackdrop;
}

module.exports = {
  builder: function (SlashCommandBuilder) {
    SlashCommandBuilder.addSubcommand(subcommand =>
      subcommand
        .setName('fitcheck')
        .setDescription("Put an image into Tyler's frame")
        .addAttachmentOption(option =>
          option
            .setName('image')
            .setDescription('Image to put in the frame')
            .setRequired(true)
        )
    );
    return SlashCommandBuilder;
  },

  execute: async function (interaction) {
    await interaction.deferReply();

    try {
      const attachment = interaction.options.getAttachment('image');
      if (!attachment) {
        await interaction.editReply('Please provide an image attachment.');
        return;
      }

      const contentType = attachment.contentType || '';
      if (!contentType.startsWith('image/') && !/\.(png|jpe?g|webp|gif)$/i.test(attachment.name || '')) {
        await interaction.editReply('The provided file does not appear to be an image.');
        return;
      }

      const res = await fetch(attachment.url);
      if (!res.ok) {
        await interaction.editReply('Failed to download the attachment image.');
        return;
      }

      const imageBuffer = Buffer.from(await res.arrayBuffer());
      const userImg = await loadImage(imageBuffer);

      const backdrop = await getBackdrop();

      const canvas = createCanvas(1154, 2048);
      const ctx = canvas.getContext('2d');

      const targetX = 735;
      const targetY = 1000;
      const targetW = 430;
      const targetH = 630;

      const targetRatio = targetW / targetH;
      const imgRatio = userImg.width / userImg.height;

      let sx = 0;
      let sy = 0;
      let sWidth = userImg.width;
      let sHeight = userImg.height;

      if (imgRatio > targetRatio) {
        sWidth = userImg.height * targetRatio;
        sx = (userImg.width - sWidth) / 2;
      } else {
        sHeight = userImg.width / targetRatio;
        sy = (userImg.height - sHeight) / 2;
      }

      ctx.drawImage(userImg, sx, sy, sWidth, sHeight, targetX, targetY, targetW, targetH);
      ctx.drawImage(backdrop, 0, 0);

      const outBuffer = canvas.toBuffer('image/png');
      const file = new AttachmentBuilder(outBuffer, { name: 'fitcheck.png' });

      await interaction.editReply({ files: [file] });
    } catch (err) {
      interaction.client.log.error({ message: 'Error executing fitcheck command', error: err });
      await interaction.editReply('I encountered an error generating the fitcheck image.');
    }
  }
};
