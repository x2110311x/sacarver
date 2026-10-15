const add = require('./add');
const list = require('./list');
const remove = require('./remove');
const test = require('./test');

module.exports = {
  builder: function (SlashCommandBuilder) {
    SlashCommandBuilder.addSubcommandGroup(subcommandGroup => {
      subcommandGroup
        .setName('scamimage')
        .setDescription('Manage and test Image Guard scam image hashes');

      subcommandGroup = add.builder(subcommandGroup);
      subcommandGroup = list.builder(subcommandGroup);
      subcommandGroup = remove.builder(subcommandGroup);
      subcommandGroup = test.builder(subcommandGroup);
      return subcommandGroup;
    });

    return SlashCommandBuilder;
  },
  execute: async function (interaction) {
    const subcommandName = interaction.options.getSubcommand();
    if (subcommandName === 'add') {
      await add.execute(interaction);
    } else if (subcommandName === 'list') {
      await list.execute(interaction);
    } else if (subcommandName === 'remove') {
      await remove.execute(interaction);
    } else if (subcommandName === 'test') {
      await test.execute(interaction);
    } else {
      await interaction.reply({ ephemeral: true, content: 'Unknown scamimage subcommand.' });
    }
  }
};
