module.exports = async function (interaction){
    await interaction.guild.fetch().then(guild => {
        guild.members.fetch().then(() => {
            console.log('Fetched all guild members');
            interaction.client.user.setActivity(`${guild.memberCount} members`, { type: 'WATCHING' });
        })
    }).then(() => {
        interaction.reply({ content: 'Set Status', ephemeral: true });
    });
};