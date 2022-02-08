module.exports = async function (interaction){
    if (interaction.options.getSubcommand() === 'add') {
        await require('./add')(interaction);
    }
};