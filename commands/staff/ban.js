module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to ban, if they are in the server')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('userid')
                        .setDescription('The ID of the user to ban, if they are not in the server')
                        .setRequired(false)));
                    
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        let user = interaction.options.getUser('user');
        if (user == null){
            user = interaction.options.getString('userid');
        }
        let guild = interaction.guild;

        console.log(user);
        
        await guild.bans.create(user).then(banInfo =>
            interaction.reply(`Banned ${banInfo.user?.tag ?? banInfo.tag ?? banInfo}`)
            );
    }
};