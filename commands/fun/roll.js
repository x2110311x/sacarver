const { EmbedBuilder } = require("discord.js");

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('roll')
                .setDescription('Roll a die of any size!')
                .addIntegerOption(option => 
                    option
                        .setName("sides")
                        .setDescription("How many sides should the die have. Defaults to 6")));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        const preRoll = new EmbedBuilder()
            .setColor(0xd5b052)
            .setTitle("Please wait while the die is rolled")
            .setImage('https://c.tenor.com/HcK7RSiai-AAAAAi/dice-roll-dice.gif')
            .setFooter({ text: '© 2022 x2110311x', iconURL: 'https://cdn.discordapp.com/avatars/470691679712706570/42e790b8113e7f21422796db72d652f2.webp?size=1024' });
        
        await interaction.reply({embeds: [preRoll]});
        let sides = interaction.options.getInteger('sides') ?? 6;
        let result = Math.floor(Math.random() * sides);
        
        const postRoll = new EmbedBuilder()
            .setColor(0xd5b052)
            .setTitle(`On a ${sides}-sided die, you rolled a...`)
            .setDescription(`${result}`)
            .setFooter({ text: '© 2022 x2110311x', iconURL: 'https://cdn.discordapp.com/avatars/470691679712706570/42e790b8113e7f21422796db72d652f2.webp?size=1024' });
        
        await new Promise(resolve => setTimeout(resolve, 4000));
        await interaction.editReply({embeds: [postRoll]});
    }
};