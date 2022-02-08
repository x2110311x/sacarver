module.exports = async function (interaction){
    if (interaction.options.getSubcommand() === 'custom') {
        await require('./custom')(interaction);
    } else if (interaction.options.getSubcommand() === 'membercount') {
        await require('./membercount')(interaction);
    }
};