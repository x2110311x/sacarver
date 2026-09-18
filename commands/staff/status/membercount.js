const { updateMemberCountStatus } = require('../../../helpers/status');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('membercount')
                .setDescription('Set the status to the member count'));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await updateMemberCountStatus(interaction.client, interaction.guild?.id);
        await interaction.reply({ content: 'Set Status', ephemeral: true });
    }
};