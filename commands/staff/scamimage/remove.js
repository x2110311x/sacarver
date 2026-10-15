const { EmbedBuilder } = require('discord.js');
const imageGuard = require('../../../helpers/imageGuard');

module.exports = {
  builder: function(subcommandGroup) {
    subcommandGroup.addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a scam image hash from the database')
        .addIntegerOption(option =>
          option
            .setName('id')
            .setDescription('The ID of the scam hash entry to delete')
            .setRequired(true)
        )
    );
    return subcommandGroup;
  },
  execute: async function(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const client = interaction.client;
    const id = interaction.options.getInteger('id');

    try {
      const record = await client.DB.ScamImageHashes.findByPk(id);
      if (!record) {
        return interaction.editReply({ content: `❌ No scam image hash found with ID #${id}.` });
      }

      const deletedHash = record.Hash;
      const label = record.Label;
      await record.destroy();
      await imageGuard.loadHashes(client);

      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('🗑️ Scam Image Hash Removed')
        .setDescription(`Successfully removed entry **#${id}** from the database and updated the active filter cache.`)
        .addFields(
          { name: 'Label', value: label || 'None', inline: true },
          { name: 'Removed Hash', value: `\`${deletedHash}\``, inline: true }
        )
        .setFooter({ text: `Image Guard • © ${new Date().getFullYear()} x2110311x`, iconURL: client.icon })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      client.log.error({ message: `[ImageGuard] Failed to remove scam hash #${id}`, error: err });
      await interaction.editReply({ content: '❌ Failed to delete scam hash from the database.' });
    }
  }
};
