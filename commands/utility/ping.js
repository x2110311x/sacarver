const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');


module.exports = {
	builder: function (SlashCommandBuilder){
		SlashCommandBuilder.addSubcommand(subcommand =>
				subcommand
						.setName('ping')
						.setDescription('Check the bot latency'))
		return SlashCommandBuilder
	},
	async execute(interaction) {
		const before = interaction.createdAt.getTime();
		const heartbeat = Math.floor(interaction.client.ws.ping);
		await interaction.reply('Pinging...', { fetchReply: true });
		const after = Date.now();
		const ping = Math.abs(after - before);
		const pingEmbed = new EmbedBuilder()
			.setColor('#d5b052')
			.addFields(
				{ name: 'API Heartbeat', value: `${heartbeat}ms` },
				{ name: 'Bot Latency', value: `${ping}ms` },
			);
		await interaction.editReply({ content:'Pong!', embeds: [pingEmbed] });
	},
};