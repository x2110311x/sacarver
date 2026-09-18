const dmForwarding = require('../helpers/dmForwarding');

module.exports = {
	name: 'interactionCreate',
	once: false,
	async execute(interaction) {
		if (interaction.isButton()) {
			if (interaction.customId.startsWith('dm_reply_')) {
				try {
					await dmForwarding.handleReplyButton(interaction);
				} catch (error) {
					interaction.client.log.error({ message: 'Error handling DM reply button', error });
				}
				return;
			}
		}

		if (interaction.isModalSubmit()) {
			if (interaction.customId.startsWith('dm_reply_modal_')) {
				try {
					await dmForwarding.handleReplyModal(interaction);
				} catch (error) {
					interaction.client.log.error({ message: 'Error handling DM reply modal', error });
				}
				return;
			}
		}

		if (!interaction.isCommand()) return;
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;
		try {
			await command.execute(interaction);
		}
		catch (error) {
			interaction.client.log.error({message: "Error executing command", error: error});
			try {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			} catch (err) {
				interaction.client.log.error({message: "Error executing command", error: err});
				// eslint-disable-next-line no-undef
				if (err instanceof InteractionAlreadyreplied) {
					await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
				}
			}
		}
	},
};