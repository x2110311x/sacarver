module.exports = {
	name: 'interactionCreate',
	once: false,
	async execute(interaction) {
		if (!interaction.isCommand()) return;
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;
		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			try {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			} catch (err) {
				console.error(err);
				// eslint-disable-next-line no-undef
				if (err instanceof InteractionAlreadyreplied) {
					await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
				}
			}
		}
	},
};