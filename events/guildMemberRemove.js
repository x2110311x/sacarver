module.exports = {
	name: 'guildMemberRemove',
	once: false,
	async execute(member, client) {
		client.log.debug('User leave');
		client.user.setActivity(`${member.guild.memberCount} members`, { type: 'WATCHING' });
	},
};