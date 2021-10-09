module.exports = {
	name: 'guildMemberRemove',
	once: false,
	async execute(member, client) {
		console.log('User leave');
		client.user.setActivity(`${member.guild.memberCount} members`, { type: 'WATCHING' });
	},
};