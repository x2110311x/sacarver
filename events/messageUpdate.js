const { EmbedBuilder } = require('discord.js');

const Sacarver = require("../structures/bot");
const client = Sacarver.getInstance().client;

module.exports = {
	name: 'messageUpdate',
	once: false,
	async execute(message, newMessage) {
    client.log.debug("Received messageUpdate event");
    let cachedMessage = await client.cache.getMessage(message.id);
    let channelID;
    let author;
    let content;

    if(!message.partial){
      channelID = message.channel.id;
      channelID = `<#${channelID}> - ${channelID}`;
      author = message.author.id; 
      author = `<@${author}> - ${author}`;
      
      if(message.author.bot){
        client.log.debug("Ignoring message update for bot user");
        return;
      }
    } else {
      author = message.author;
      channelID = message.channel;
    }

    let newContent = newMessage.content;

    if(cachedMessage==null){
      content = "`Message not cached`";
    } else {
      if(cachedMessage.content != ""){
        content = cachedMessage.content;
      } else {
        content = "`Message not cached`";
      }
    }
    
    if(newContent==null || newContent == ""){
      newContent = "`Blank`";
      client.log.warn(`Blank new message content while logging message edit. Message ID : ${message.id}`);
    }
    
    if(author==null || author == ""){
      author = "Unknown message author";
      client.log.warn(`Unknown author while logging message edit. Message ID : ${message.id}`);
    }

    if(channelID==null || channelID == ""){
      channelID = "Unknown channel";
      client.log.warn(`Unknown channel while logging message edit. Message ID : ${message.id}`);
    }
    
    const editLogEmbed = new EmbedBuilder()
    .setColor(0xDC8203)
    .setTitle('Message Edited')
    .addFields(
      { name: 'Channel', value: `${channelID}` },
      { name: 'Message ID', value: `${message.id}` },
      { name: 'User', value: `${author}`},
      { name: 'Original Message Text', value: `${content}` },
      { name: 'New Message Text', value: `${newMessage.content}` },
      { name: 'Date Edited', value: `<t:${Math.floor(newMessage.editedTimestamp/1000)}:F>`},
    )
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

    const editLogChannel = await client.channels.fetch(client.config.channels.editLog);
    await editLogChannel.send({ embeds: [editLogEmbed] });
    await client.cache.cacheMessage(newMessage);
  }
};