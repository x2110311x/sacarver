module.exports = {
	name: 'guildMemberAdd',
	once: false,
	async execute(member, client) {
		client.log.debug('User join');
		client.user.setActivity(`${member.guild.memberCount} members`, { type: 'WATCHING' });
	},
};