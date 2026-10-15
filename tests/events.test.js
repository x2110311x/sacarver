const assert = require('assert');
const path = require('path');
const fs = require('fs');

const configPath = path.resolve(__dirname, '../config.json');
const exampleConfigPath = path.resolve(__dirname, '../config.example.json');
let tempConfigCreated = false;

async function runTests() {
  console.log('--- Starting Event Handlers Validation Test Suite ---');

  if (!fs.existsSync(configPath) && fs.existsSync(exampleConfigPath)) {
    fs.copyFileSync(exampleConfigPath, configPath);
    tempConfigCreated = true;
  }

  const eventsDir = path.resolve(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsDir).filter(file => file.endsWith('.js'));

  assert(eventFiles.length > 0, 'Should find event files in events directory');

  for (const file of eventFiles) {
    const eventPath = path.join(eventsDir, file);
    const event = require(eventPath);

    assert(event, `Event module ${file} must export an object`);
    assert(typeof event.name === 'string' && event.name.length > 0, `Event ${file} must export a string 'name'`);
    assert(typeof event.execute === 'function', `Event ${file} must export an 'execute' function`);
    if ('once' in event) {
      assert(typeof event.once === 'boolean', `Event ${file} 'once' property must be boolean if present`);
    }

    console.log(`✓ Event "${file}" loaded: listening for event "${event.name}" (once: ${Boolean(event.once)})`);
  }

  console.log(`\n--- Successfully Validated ${eventFiles.length} Event Handlers ---`);
}

if (require.main === module) {
  runTests()
    .catch(err => {
      console.error('Event validation test failed:', err);
      process.exit(1);
    })
    .finally(() => {
      if (tempConfigCreated && fs.existsSync(configPath)) {
        try {
          fs.unlinkSync(configPath);
        } catch (_err) {
          // ignore cleanup error
        }
      }
    });
}

module.exports = runTests;
