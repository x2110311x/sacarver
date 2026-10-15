const path = require('path');
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require('../config.json');
const log = require('../structures/logging').getInstance().logger;

const commands = [];
const projectRoot = path.resolve(__dirname, '..');
const commandsDir = path.join(projectRoot, 'commands');

const commandFolders = fs.readdirSync(commandsDir, { withFileTypes: true })
  .filter(item => item.isDirectory())
  .map(item => item.name);

for (const folder of commandFolders) {
  try {
    const command = require(path.join(commandsDir, folder));
    if (command && command.data && typeof command.data.toJSON === 'function') {
      commands.push(command.data.toJSON());
      log.info(`Prepared command /${command.data.name} for deployment`);
    }
  } catch (err) {
    log.error({ message: `Failed to load command folder ${folder} for deploy`, error: err });
  }
}

const rest = new REST({ version: '9' }).setToken(config.token);

(async () => {
  try {
    log.info(`Started refreshing ${commands.length} application (/) commands.`);

    await rest.put(
      Routes.applicationGuildCommands(config.clientID, config.guildID),
      { body: commands },
    );

    log.info('Successfully reloaded application (/) commands.');
  } catch (err) {
    log.error({ message: 'Error deploying commands', error: err });
  }
})();
