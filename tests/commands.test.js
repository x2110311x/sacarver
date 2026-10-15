const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('--- Starting Slash Command Validation Test Suite ---');

  const commandsDir = path.resolve(__dirname, '../commands');
  const commandFolders = fs.readdirSync(commandsDir, { withFileTypes: true })
    .filter(item => item.isDirectory())
    .map(item => item.name);

  assert(commandFolders.length > 0, 'Should find at least one command directory');

  for (const folder of commandFolders) {
    console.log(`\nValidating command module: /${folder}`);
    const modulePath = path.join(commandsDir, folder);
    const command = require(modulePath);

    assert(command, `Command module ${folder} must export an object`);
    assert(command.data, `Command module ${folder} must export a 'data' property`);
    assert(typeof command.data.name === 'string' && command.data.name.length > 0, `Command /${folder} must have a name`);
    assert(typeof command.data.description === 'string' && command.data.description.length > 0, `Command /${folder} must have a description`);
    assert(typeof command.execute === 'function', `Command /${folder} must export an execute function`);

    // Verify JSON serialization for Discord REST API
    assert(typeof command.data.toJSON === 'function', `Command /${folder} data must have toJSON method`);
    const json = command.data.toJSON();
    assert.strictEqual(json.name, folder, `Serialized command name must match folder name "${folder}"`);
    assert(Array.isArray(json.options), `Command /${folder} should have an options array`);
    console.log(`✓ /${folder} serialized to valid Discord API payload with ${json.options.length} subcommand(s) / option(s).`);

    // Validate individual subcommand files in folder
    const files = fs.readdirSync(modulePath).filter(f => f.endsWith('.js') && f !== 'index.js');
    for (const file of files) {
      const subPath = path.join(modulePath, file);
      const sub = require(subPath);
      assert(typeof sub.execute === 'function', `Subcommand ${folder}/${file} must export an execute function`);
      if (sub.builder) {
        assert(typeof sub.builder === 'function', `Subcommand ${folder}/${file} builder must be a function`);
      }
    }
    console.log(`✓ Validated ${files.length} subcommand files in /${folder}.`);
  }

  console.log('\n--- All Slash Commands Validated Successfully ---');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Command validation test failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
