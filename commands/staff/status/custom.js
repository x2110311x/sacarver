module.exports = async function (interaction){
    let type = interaction.options.getString('activity');
    let activity = interaction.options.getString('status');
    await interaction.client.user.setActivity(activity, { type: type });
    await interaction.reply({ content: 'Status set', ephemeral: true });
};