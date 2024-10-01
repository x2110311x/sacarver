module.exports = {
	name: 'messageCreate',
	once: false,
	async execute(message) {
    let client = message.client;
    await client.cache.cacheMessage(message);
  }
};