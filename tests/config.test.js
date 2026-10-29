const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('--- Starting Config Template Validation Test Suite ---');

  const exampleConfigPath = path.resolve(__dirname, '../config.example.json');
  assert(fs.existsSync(exampleConfigPath), 'config.example.json must exist in repository root');

  const rawConfig = fs.readFileSync(exampleConfigPath, 'utf8');
  let config;
  try {
    config = JSON.parse(rawConfig);
  } catch (err) {
    assert.fail(`config.example.json is not valid JSON: ${err.message}`);
  }

  // 1. Top-level keys
  const requiredTopKeys = [
    'token',
    'guildID',
    'clientID',
    'roles',
    'channels',
    'imageGuard',
    'db',
    'cacheExpiration',
    'attachmentCacheExpiration',
    'maxAttachmentCacheSize',
    'swearJarChannels'
  ];
  for (const key of requiredTopKeys) {
    assert(key in config, `config.example.json missing top-level key: ${key}`);
  }
  console.log('✓ Top-level keys verified.');

  // 2. Roles structure
  const requiredRoles = ['staff', 'newMember', 'vc'];
  for (const role of requiredRoles) {
    assert(role in config.roles, `config.example.json missing role: ${role}`);
  }
  console.log('✓ Roles configuration verified.');

  // 3. Channels structure
  const requiredChannels = [
    'deleteLog',
    'editLog',
    'weatheredFlag',
    'joinLeaveLog',
    'nickLog',
    'vcLog',
    'staffCommandLog',
    'tbApps',
    'honeypot',
    'banLog',
    'chatModeration',
    'staffDmLog',
    'scamLog'
  ];
  for (const ch of requiredChannels) {
    assert(ch in config.channels, `config.example.json missing channel: ${ch}`);
  }
  console.log('✓ Channels configuration verified.');

  // 4. ImageGuard structure
  const requiredImageGuard = [
    'enabled',
    'mode',
    'ocrUrl',
    'hammingThreshold',
    'autoBanExactMatch',
    'autoBanNearMatch',
    'banAppealUrl'
  ];
  for (const igKey of requiredImageGuard) {
    assert(igKey in config.imageGuard, `config.example.json missing imageGuard setting: ${igKey}`);
  }
  assert(typeof config.imageGuard.enabled === 'boolean', 'imageGuard.enabled should be boolean');
  assert(typeof config.imageGuard.hammingThreshold === 'number', 'imageGuard.hammingThreshold should be number');
  assert.strictEqual(config.imageGuard.hammingThreshold, 6, 'imageGuard.hammingThreshold should be 6');
  assert(typeof config.imageGuard.autoBanNearMatch === 'boolean', 'imageGuard.autoBanNearMatch should be boolean');
  console.log('✓ ImageGuard configuration verified.');

  // 5. DB structure
  const requiredDb = ['DBName', 'user', 'pass', 'host', 'port'];
  for (const dbKey of requiredDb) {
    assert(dbKey in config.db, `config.example.json missing db key: ${dbKey}`);
  }
  console.log('✓ Database configuration verified.');

  // 6. Security verification (no secrets leaked in example template)
  assert.strictEqual(config.token, '', 'config.example.json token should be empty string');
  assert.strictEqual(config.db.pass, '', 'config.example.json db.pass should be empty string');
  console.log('✓ Sanitization verified (no secrets committed to example config).');

  // 7. Verify .env.example
  const envExamplePath = path.resolve(__dirname, '../.env.example');
  assert(fs.existsSync(envExamplePath), '.env.example must exist in repository root');
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  assert(envContent.includes('MYSQL_ROOT_PASSWORD='), '.env.example should contain MYSQL_ROOT_PASSWORD');
  assert(envContent.includes('MYSQL_DATABASE='), '.env.example should contain MYSQL_DATABASE');
  console.log('✓ .env.example verified.');

  console.log('\n--- All Config Validation Checks Passed ---');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Config validation test failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
