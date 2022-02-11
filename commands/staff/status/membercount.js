module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('membercount')
                .setDescription('Set the status to the member count'))
        return SlashCommandBuilder
    },
    execute: async function(interaction){
        await interaction.guild.fetch().then(guild => {
            guild.members.fetch().then(() => {
                console.log('Fetched all guild members');
                interaction.client.user.setActivity(`${guild.memberCount} members`, { type: 'WATCHING' });
            })
        }).then(() => {
            interaction.reply({ content: 'Set Status', ephemeral: true });
        });
    }
}