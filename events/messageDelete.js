const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'messageDelete',
	once: false,
	async execute(message) {
    const entry = await message.guild.fetchAuditLogs({ type: 72 }).then(audit => audit.entries.first());
    let user;
    let cachedMessage = await message.client.cache.getMessage(message.id);
    if (entry.extra.channel.id === message.channel.id
      && (entry.target.id === message.author.id)
      && (entry.createdTimestamp > (Date.now() - 5000))
      && entry.extra.count >= 1) {
        user = entry.executor;
      } else { 
        user = message.author;
      }
      let channelID = message.channel.id;
      let content;
      content = cachedMessage.content;
      console.log(content);
      const deleteLogEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('Message Deleted')
      .addFields(
        { name: 'Channel', value: `<#${channelID}> - ${channelID}` },
        { name: 'Message ID', value: `${message.id}` },
        { name: 'User', value: `<@${message.author.id}> - ${message.author.id}`},
        { name: 'Message Text', value: `${content}` },
        { name: 'Date Deleted', value: `<t:${Math.floor(entry.createdTimestamp/1000)}:F>`},
        { name: 'Deleted By', value: `<@${user.id}> - ${user.id}`}
      )
      .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${message.client.icon}` });

      const deleteLogChannel = await message.client.channels.fetch(message.client.config.channels.deleteLog);
      await deleteLogChannel.send({ embeds: [deleteLogEmbed] });
  }
};