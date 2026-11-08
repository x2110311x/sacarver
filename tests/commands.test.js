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

  // Test /staff info role execution
  const { Collection } = require('discord.js');
  const staffInfoRole = require('../commands/staff/info/role');
  const mockMembers = new Collection();
  mockMembers.set('1', {
    id: '1',
    user: { username: 'alice' },
    roles: { cache: new Collection([['role_mod', { id: 'role_mod' }]]) }
  });
  mockMembers.set('2', {
    id: '2',
    user: { username: 'bob' },
    roles: { cache: new Collection([['role_other', { id: 'role_other' }]]) }
  });
  mockMembers.set('3', {
    id: '3',
    user: { username: 'charlie' },
    roles: { cache: new Collection([['role_mod', { id: 'role_mod' }]]) }
  });

  let deferred = false;
  let editedPayload = null;
  const mockInteraction = {
    deferReply: async () => { deferred = true; },
    editReply: async (payload) => { editedPayload = payload; },
    options: {
      getRole: (name) => name === 'role' ? { id: 'role_mod', name: 'Moderators' } : null
    },
    guild: {
      id: 'guild_1',
      members: {
        fetch: async () => mockMembers
      }
    }
  };

  await staffInfoRole.execute(mockInteraction);
  assert.strictEqual(deferred, true, '/staff info role should defer reply');
  assert(editedPayload && Array.isArray(editedPayload.files) && editedPayload.files.length === 1, '/staff info role should reply with one file attachment');
  const attachment = editedPayload.files[0];
  assert.strictEqual(attachment.name, 'Moderators.txt', 'Attachment name should match sanitized role name');
  assert.strictEqual(attachment.attachment.toString('utf-8'), 'alice\ncharlie', 'Attachment content should contain matching usernames separated by newline');
  console.log('✓ Validated /staff info role execution and text file attachment output.');

  console.log('\n--- All Slash Commands Validated Successfully ---');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Command validation test failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
