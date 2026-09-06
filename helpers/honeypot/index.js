const { EmbedBuilder } = require("discord.js");


async function processHoneypot(client, message){
    var data = {
    "user": message.author.id,
    "severity": "high",
    "note": "User sent a message in the honeypot channel.",
    "message": message.content,
    "dateAdded": Math.floor(message.createdTimestamp/1000),
    "noter": client.config.clientID,
    "DMd": false,
    "banned": false
  }

  // DM the user
  try{
    var dmChannel = await message.author.createDM();
    await dmChannel.send("You have been banned from \`twenty one pilots\` for sending a message in our honeypot channel.\nThis channel is designed to automatically combat scam messages. If you believe this was a mistake, please submit a ban appeal at https://bans.discordclique.com");
    data.DMd = true;
  } catch (err){
    client.log.error({message: "Failed to DM user about honeypot ban", error: err})
  }

  // Ban the user
  try {
    var member = message.member;
    await member.ban({ deleteMessageSeconds: 300, reason: 'User sent message in honeypot channel.' });
    data.banned = true;
  }
  catch (err){
    client.log.error({message: "Failed to ban user for honeypot detection", error: err})
  }
  await message.delete();
  await staffLog(client, data);
  await addNote(client, data);
}

async function staffLog(client, data){
    const banLogEmbed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("User sent message in honeypot channel")
    .setDescription(`${data.DMd ? "User was DM'd ban appeal" : "User was unable to be DM'd."}\n User ${data.banned ? "was" : "was unable to be"} automatically banned for honeypot detection.`)
    .addFields(
      { name: 'User', value: `<@${data.user}> - ${data.user}`},
      { name: 'Message Text', value: `${data.message}` },
      { name: 'Date banned', value: `<t:${data.dateAdded}:F>`}
    )
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

    const banLog = await client.channels.fetch(client.config.channels.banLog);
    const chatModeration = await client.channels.fetch(client.config.channels.chatModeration);
    
    if(data.banned){
      await banLog.send({ embeds: [banLogEmbed]});
    }
    await chatModeration.send({ embeds: [banLogEmbed]});
}

async function addNote(client, data) {
  let DB = client.DB;
  data.note += `\nUser ${data.banned ? "was" : "was unable to be"} automatically banned.`;
  try{
    await DB.Notes.create({
      "User": data.user,
      "Date": data.dateAdded,
      "Note": data.note,
      "Severity": data.severity,
      "Noter": data.noter
    });
  
  client.log.info("Added note to database");
  } catch (err){

    client.log.error({message: "Failed to insert note into database", error: err})
    return;
  }
}

module.exports = {
  processHoneypot
}