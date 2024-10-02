let instance = null;
const { Client, Options, Partials, Collection, GatewayIntentBits } = require('discord.js');

class Sacarver {

    constructor() {
      
      const client = new Client({
        partials: [Partials.Message],
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildPresences,
        ],
        makeCache: Options.cacheWithLimits({
          ...Options.DefaultMakeCacheSettings,
          MessageManager: 2000,
          GuildMemberManager: 500
        }),
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