let instance = null;
const { Client, Collection, IntentsBitField } = require('discord.js');

class Sacarver {

    constructor() {
      const myIntents = new IntentsBitField();
      myIntents.add( IntentsBitField.Flags.GuildPresences, IntentsBitField.Flags.GuildMembers, 
        IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages );
      
      const client = new Client({ intents: myIntents });
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