const { EmbedBuilder } = require('discord.js');
const packageJson = require("../../package.json");

module.exports = {
	builder: function (SlashCommandBuilder){
		SlashCommandBuilder.addSubcommand(subcommand =>
				subcommand
						.setName('info')
						.setDescription('Get information about the bot'));
		return SlashCommandBuilder;
	},
	async execute(interaction) {
		const pingEmbed = new EmbedBuilder()
            .setTitle('Sacarver Bot Information')
			.setColor('#d5b052')
			.addFields(
				{ name: 'Version', value: `${packageJson.version}` },
				{ name: 'Discord JS Version', value: `${(packageJson.dependencies['discord.js']).replace('^','')}` },
                { name: 'Developer', value: 'x2110311x' },
                { name: 'Source Code', value: `[GitHub Repository](${packageJson.homepage})` }
			);
		await interaction.reply({ embeds: [pingEmbed] });
	},
};