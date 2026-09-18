const { EmbedBuilder } = require('discord.js');

module.exports = {
	builder: function (SlashCommandBuilder) {
		SlashCommandBuilder.addSubcommand(subcommand =>
			subcommand
				.setName('getemoji')
				.setDescription('Get information about a custom emoji')
				.addStringOption(option =>
					option
						.setName('emoji')
						.setDescription('The custom emoji or emoji ID')
						.setRequired(true)
				)
		);
		return SlashCommandBuilder;
	},
	async execute(interaction) {
		const emojiInput = interaction.options.getString('emoji');
		const emojiId = emojiInput.match(/\d+/)?.[0] || emojiInput;

		let emojiObj = interaction.client.emojis.cache.get(emojiId);
		if (!emojiObj) {
			try {
				emojiObj = await interaction.client.emojis.fetch(emojiId);
			} catch (e) {
				emojiObj = null;
			}
		}

		if (!emojiObj) {
			return interaction.reply({
				content: `Could not find custom emoji for \`${emojiInput}\`. Make sure the bot is in the server where the emoji exists and the ID is correct.`,
				ephemeral: true,
			});
		}

		const embed = new EmbedBuilder()
			.setTitle(emojiObj.name || 'Custom Emoji')
			.setColor('#18c446')
			.setThumbnail(emojiObj.url)
			.addFields(
				{ name: 'ID', value: `${emojiObj.id}`, inline: true },
				{ name: 'Server ID', value: `${emojiObj.guild?.id || emojiObj.guildId || 'Unknown'}`, inline: true },
				{ name: 'Animated', value: emojiObj.animated ? 'Yes' : 'No', inline: true },
				{ name: 'URL', value: `[Link](${emojiObj.url})`, inline: true }
			);

		await interaction.reply({ embeds: [embed] });
	},
};
