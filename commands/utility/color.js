const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas } = require('canvas');
const { GetColorName } = require('hex-color-to-color-name');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('Get the color name and visual from a Hex color code')
                .addStringOption(option => 
                  option
                      .setName("code")
                      .setDescription("The hex code of the color")
                      .setRequired(true)));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
      const rawColor = interaction.options.getString('code');
      const colorCode = rawColor.replace('#', '').trim();
      var re = /^[0-9a-fA-F]{6}$/;

      if(!(re.test(colorCode))){
        await interaction.reply({content: "That doesn't look like a proper color code!", ephemeral: true});
        return;
      }

      const num = parseInt(colorCode, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;

      const canvas = createCanvas(200, 200);
      const context = canvas.getContext('2d');
      const imgData = context.createImageData(200, 200);
      for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i] = r;
        imgData.data[i + 1] = g;
        imgData.data[i + 2] = b;
        imgData.data[i + 3] = 255;
      }
      context.putImageData(imgData, 0, 0);

      const buf = canvas.toBuffer('image/png');
      const filename = `color_${colorCode}_${Date.now()}.png`;
      const attachment = new AttachmentBuilder(buf, { name: filename });
      const colorName = GetColorName(colorCode) || `#${colorCode.toUpperCase()}`; 
      const colorEmbed = new EmbedBuilder()
          .setTitle(colorName)
          .setColor(num)
          .setDescription(`#${colorCode.toUpperCase()}`)
          .setImage(`attachment://${filename}`)
          .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${interaction.client.icon}` });

      await interaction.reply({embeds: [colorEmbed], files:[attachment]});
    }
};