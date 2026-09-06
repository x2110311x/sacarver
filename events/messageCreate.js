const Sacarver = require("../structures/bot");
const client = Sacarver.getInstance().client;
const profanity = require('better-profane-words');

module.exports = {
	name: 'messageCreate',
	once: false,
	async execute(message) {
    //client.log.debug(`Message create: ${message.id}`);
    await client.cache.cacheMessage(message);

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