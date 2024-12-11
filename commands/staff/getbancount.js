const { Collection, EmbedBuilder } = require('discord.js');

async function fetchMoreBans(guild, limit = 10000) { // https://stackoverflow.com/a/72672522
    if (!guild || typeof guild !== 'object')
      throw new Error(`Expected a guild, got "${typeof guild}"`);
    if (!Number.isInteger(limit))
      throw new Error(`Expected an integer, got ${typeof limit}.`);
    if (limit <= 1000) return guild.bans.fetch({ limit });
  
    let collection = new Collection();
    let lastId = null;
    let options = {};
    let remaining = limit;
  
    while (remaining > 0) {
      options.limit = remaining > 1000 ? 1000 : remaining;
      remaining = remaining > 1000 ? remaining - 1000 : 0;
  
      if (lastId) options.before = lastId;
  
      let bans = await guild.bans.fetch(options);
  
      if (!bans.last()) break;
  
      collection = collection.concat(bans);
      lastId = bans.last().id;
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
        const guild = interaction.guild;
        let client = interaction.client;
        const bans = await fetchMoreBans(guild);

        const banEmbed = new EmbedBuilder()
        .setColor(0xDC8203)
        .setTitle(`The server currently has ${bans.size} bans`)
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
        
        await interaction.reply({embeds: [banEmbed]});
    }

};