const fs = require('fs');
const { Collection } = require('discord.js');
const subcommandFiles = fs.readdirSync('./commands/utility/time').filter(file => file.endsWith('.js'));
const subcommands = new Collection();

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
            subcommandGroup
                .setName('time')
                .setDescription('Time utilities/converters')
                for (const file of subcommandFiles) {
                  if (file != 'index.js') {
                      try {
                          const subcommand = require(`./${file}`);
                          subcommands.set(`${file}`, subcommand);
                          subcommandGroup = subcommand.builder(subcommandGroup);
                      } catch (e) {
                          console.log('Could not load utility subcommand %s', file);
                          console.error(e);
                      }
                  }
              }
                return subcommandGroup
            })

        return SlashCommandBuilder
    },
    execute: async function(interaction){
      let subcommandName = interaction.options.getSubcommand() + '.js';
      let command = subcommands.get(subcommandName);
      await command.execute(interaction);
    }
}