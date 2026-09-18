const { EmbedBuilder } = require('discord.js');
const Sacarver = require("../structures/bot");
const client = Sacarver.getInstance().client;
const profanity = require('better-profane-words');
const honeypot = require("../helpers/honeypot");
const dmForwarding = require("../helpers/dmForwarding");

const EXEMPT_SCREENING_USERS = ['470691679712706570', '470410168186699788', '470705413885788160', '470412382456381471'];

module.exports = {
	name: 'messageCreate',
	once: false,
	async execute(message) {
    if (!message.guild) {
      await dmForwarding.handleDm(client, message);
      return;
    }

    //client.log.debug(`Message create: ${message.id}`);
    await client.cache.cacheMessage(message);

    const screeningChannelId = client.config.channels.weatheredFlag || '470406597860917249';
    if (message.channelId === screeningChannelId && !message.webhookId && message.member) {
      const staffRoleId = client.config.roles.staff || '323555864646647808';
      const isStaff = message.member.roles.cache.has(staffRoleId);
      if (!isStaff && !EXEMPT_SCREENING_USERS.includes(message.author.id)) {
        try {
          const embedJoin = new EmbedBuilder()
            .setColor(0x753543)
            .setTitle('User Passed Member Screening')
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .addFields(
              { name: 'User ID', value: `${message.author.id}`, inline: false },
              { name: 'Passed At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: client.icon || undefined });

          const joinLeaveLogChannelId = client.config.channels.joinLeaveLog || screeningChannelId;
          const joinLeaveLog = await client.channels.fetch(joinLeaveLogChannelId);
          if (joinLeaveLog) {
            await joinLeaveLog.send({ embeds: [embedJoin] });
          }
        } catch (err) {
          client.log.error({ message: 'Error logging member screening pass', error: err });
        }
      }
    }

    if(message.channelId == client.config.channels.honeypot){
      await honeypot.processHoneypot(client, message);
    }

    if(message.channelId == 1309644276795310110 || message.channelId == 1326261449701720104){
      if(profanity.containsProfanity(message.content)){
        var user = message.author.id;
        await client.cache.addSwear(user);
        var count = await client.cache.getSwear(user);

        await message.channel.send(`${message.member.displayName} now has ${count} swears.`);
      }
    }
  }
};