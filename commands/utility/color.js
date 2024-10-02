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
      const colorCode = interaction.options.getString('code');
      const canvas = createCanvas(200, 200);
      const context = canvas.getContext('2d');
      context.fillStyle = `#${colorCode}`;
      context.fillRect(0, 0, 200, 200);
      const buf = canvas.toBuffer('image/png', { compressionLevel: 3, filters: canvas.PNG_FILTER_NONE });
      const attachment = new AttachmentBuilder(buf, { name: 'color.png' });
      const colorName = GetColorName(colorCode); 
      const coloeEmbed = new EmbedBuilder()
          .setColor(`0x${colorCode}`)
          .setTitle(colorName)
          .setDescription(`#${colorCode}`)
          .setImage("attachment://color.png")
          .setFooter({ text: '© 2024 x2110311x', iconURL: interaction.client.user.avatarURL() });

      await interaction.reply({embeds: [coloeEmbed], files:[attachment]});
    }
};