const { Collection, EmbedBuilder } = require('discord.js');

async function fetchBanCount(guild) {
    if (!guild || typeof guild !== 'object')
      throw new Error(`Expected a guild, got "${typeof guild}"`);
  
    let lastId = null;
    let limit = 1000;
    let count = 1000;
    let bans = null;
    let fetches = 0;
    let total = 0;

    while (count >= (limit - fetches)) {
        if (lastId){
            bans = await guild.bans.fetch({limit: limit, after:lastId, cache: false, force: true});
        } else {
            bans = await guild.bans.fetch({limit: limit, cache: false, force: true});
        }
        fetches += 1;
        count = bans.size;
  
        total += count;
        lastId = bans.last().user.id ?? bans.last();
        console.log(`Fetch ${fetches}. Count: ${count}. Last: ${lastId}`);
    }
  
    return total;
  }

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('getbancount')
                .setDescription('Get the server ban count'));
                    
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        await interaction.deferReply();
        const guild = interaction.guild;
        let client = interaction.client;
        const bans = await fetchBanCount(guild);

        const banEmbed = new EmbedBuilder()
        .setColor(0xDC8203)
        .setTitle(`The server currently has ${bans} bans`)
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
        
        await interaction.editReply({embeds: [banEmbed]});
    }

};