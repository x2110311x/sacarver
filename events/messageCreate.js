const Sacarver = require("../structures/bot");
const client = Sacarver.getInstance().client;

module.exports = {
	name: 'messageCreate',
	once: false,
	async execute(message) {
    //client.log.debug(`Message create: ${message.id}`);
    await client.cache.cacheMessage(message);
  }
};