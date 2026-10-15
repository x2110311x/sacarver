const { EmbedBuilder } = require('discord.js');

module.exports = {
  builder: function(subcommandGroup) {
    subcommandGroup.addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List known scam image hashes registered in the database')
    );
    return subcommandGroup;
  },
  execute: async function(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const client = interaction.client;

    try {
      const hashes = await client.DB.ScamImageHashes.findAll({
        limit: 25,
        order: [['ID', 'DESC']]
      });

      if (hashes.length === 0) {
        return interaction.editReply({ content: 'ℹ️ There are currently no scam image hashes registered in the database.' });
      }

      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`🛡️ Registered Scam Image Hashes (${hashes.length})`)
        .setDescription('Showing the most recent registered scam image perceptual hashes:')
        .setFooter({ text: `Image Guard • © ${new Date().getFullYear()} x2110311x`, iconURL: client.icon })
        .setTimestamp();

      for (const h of hashes) {
        embed.addFields({
          name: `#${h.ID} - ${h.Label || 'Scam Image'}`,
          value: `• Hash: \`${h.Hash}\`\n• Added: <t:${h.DateAdded}:R> by <@${h.AddedBy}>\n• Matches: **${h.MatchCount || 0}**`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      client.log.error({ message: '[ImageGuard] Failed to list scam hashes', error: err });
      await interaction.editReply({ content: '❌ Failed to query scam hashes from the database.' });
    }
  }
};
