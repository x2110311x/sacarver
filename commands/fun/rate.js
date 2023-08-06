const { EmbedBuilder } = require("discord.js");

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('rate')
                .setDescription('Ask me to rate something')
                .addStringOption(option => 
                    option
                        .setName("item")
                        .setDescription("The item you would like me to rate")
                        .setRequired(true)));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        const preThink = new EmbedBuilder()
            .setColor(0xd5b052)
            .setTitle("Give me a second to think about that..")
            .setFooter({ text: '© 2022 x2110311x', iconURL: 'https://cdn.discordapp.com/avatars/470691679712706570/42e790b8113e7f21422796db72d652f2.webp?size=1024' });
        
        await interaction.reply({embeds: [preThink]});
        let item = interaction.options.getString('item');
        let result = Math.floor(Math.random() * 10);
        
        const postThink = new EmbedBuilder()
            .setColor(0xd5b052)
            .setTitle(`I would rate \`${item}\``)
            .setDescription(`${result} out of 10`)
            .setFooter({ text: '© 2022 x2110311x', iconURL: 'https://cdn.discordapp.com/avatars/470691679712706570/42e790b8113e7f21422796db72d652f2.webp?size=1024' });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        await interaction.editReply({embeds: [postThink]});
    }
};