let instance = null;
const { Client, Partials, Collection, GatewayIntentBits } = require('discord.js');

class Sacarver {

    constructor() {
      
      const client = new Client({
        partials: [Partials.Message],
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
        ],
       });
      client.commands = new Collection();
      client.commandData = [];
      client.roles = new Collection();
      client.guildchannels = new Collection();

        this.client = client;
    }
    
    static getInstance() {
            if(!instance) {
                instance = new Sacarver();
            }
            return instance;
    }
}

module.exports = Sacarver;