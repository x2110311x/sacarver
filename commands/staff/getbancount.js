const { Collection, EmbedBuilder } = require('discord.js');

async function fetchMoreBans(guild) { // https://stackoverflow.com/a/72672522
    if (!guild || typeof guild !== 'object')
      throw new Error(`Expected a guild, got "${typeof guild}"`);
  
    let collection = new Collection();
    let lastId = null;
    let limit = 800;
    let count = 1000;
    let bans = null;
    let fetches = 0;

    while (count >= limit-10) {
        if (lastId){
            bans = await guild.bans.fetch({limit: limit, before:lastId, cache: false, force: true});
        } else {
            bans = await guild.bans.fetch({limit: limit, cache: false, force: true});
        }
        fetches += 1;
        count = bans.size;
  
        collection = collection.concat(bans);
        lastId = bans.last().user.id ?? bans.last();
        console.log(`Fetch ${fetches}. Count: ${count}. Last: ${lastId}`);
    }
  
    return collection;
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
        const bans = await fetchMoreBans(guild);

        const banEmbed = new EmbedBuilder()
        .setColor(0xDC8203)
        .setTitle(`The server currently has ${bans.size} bans`)
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
        
        await interaction.editReply({embeds: [banEmbed]});
    }

};