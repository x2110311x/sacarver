const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Checks the Bot Latency and API heartbeat'),
	async execute(interaction) {
		const before = interaction.createdAt.getTime();
		const heartbeat = Math.floor(interaction.client.ws.ping);
		await interaction.reply('Pinging...', { fetchReply: true })
			.then(() => {
				const after = Date.now();
				const ping = Math.abs(after - before);
				const pingEmbed = new MessageEmbed()
					.setColor('#d5b052')
					.addFields(
						{ name: 'API Heartbeat', value: `${heartbeat}ms` },
						{ name: 'Bot Latency', value: `${ping}ms` },
					);
				interaction.editReply({ content:'Pong!', embeds: [pingEmbed] });
			});
	},
};