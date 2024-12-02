const { EmbedBuilder } = require('discord.js');

const Sacarver = require("../structures/bot");
const client = Sacarver.getInstance().client;

module.exports = {
	name: 'messageDelete',
	once: false,
	async execute(message) {
    client.log.debug("Received messageDelete event");

    try {
      if(message.author.bot){
        client.log.debug("Ignoring message delete for bot user");
        return;
      } 
    } catch (error) {
        console.log(error);
    }

    const entry = await message.guild.fetchAuditLogs({ type: 72 }).then(audit => audit.entries.first());
    let user;

    let cachedMessage = await client.cache.getMessage(message.id);

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
    if(cachedMessage==null){
      content = "`Message not cached`";
    } else {
      content = cachedMessage.content;
    }
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
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

    const deleteLogChannel = await client.channels.fetch(client.config.channels.deleteLog);
    await deleteLogChannel.send({ embeds: [deleteLogEmbed] });
  }
};