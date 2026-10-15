const assert = require('assert');
const { ActivityType } = require('discord.js');
const { getVersion } = require('../helpers/version');
const { updateMemberCountStatus } = require('../helpers/status');
const { analyzeText } = require('../helpers/imageGuard/heuristics');

async function runTests() {
  console.log('--- Starting Helper Functions Test Suite ---');

  // 1. Version helper tests
  console.log('\nTest 1: helpers/version.js');
  const originalCommit = process.env.GIT_COMMIT;
  try {
    process.env.GIT_COMMIT = 'test-sha-1234';
    const versionFromEnv = getVersion();
    assert.strictEqual(versionFromEnv, 'test-sha-1234', 'getVersion should respect GIT_COMMIT environment variable');

    delete process.env.GIT_COMMIT;
    const versionDynamic = getVersion();
    assert(typeof versionDynamic === 'string' && versionDynamic.length > 0, 'getVersion should return a string');
    console.log(`✓ getVersion passed (returned: "${versionDynamic}").`);
  } finally {
    if (originalCommit !== undefined) {
      process.env.GIT_COMMIT = originalCommit;
    } else {
      delete process.env.GIT_COMMIT;
    }
  }

  // 2. Status helper tests
  console.log('\nTest 2: helpers/status.js');
  let activitySet = null;
  let activityOptions = null;
  const mockClient = {
    config: { guildID: 'mock_guild_123' },
    user: {
      setActivity(name, options) {
        activitySet = name;
        activityOptions = options;
      }
    },
    guilds: {
      async fetch(id) {
        if (id === 'mock_guild_123') {
          return { memberCount: 42000 };
        }
        if (id === 'error_guild') {
          throw new Error('Guild fetch error');
        }
        return null;
      }
    },
    log: {
      debug() {},
      error() {}
    }
  };

  await updateMemberCountStatus(mockClient);
  assert.strictEqual(activitySet, '42000 members', 'Status activity should be formatted with member count');
  assert.strictEqual(activityOptions?.type, ActivityType.Watching, 'Status activity should be Watching');
  console.log('✓ updateMemberCountStatus sets Watching status.');

  // Error resilience test
  activitySet = null;
  await assert.doesNotReject(
    async () => {
      await updateMemberCountStatus(mockClient, 'error_guild');
    },
    'updateMemberCountStatus should handle fetch errors without throwing'
  );
  assert.strictEqual(activitySet, null, 'Activity should not be set on fetch failure');
  console.log('✓ updateMemberCountStatus handles errors gracefully.');

  // 3. Heuristics edge case tests
  console.log('\nTest 3: helpers/imageGuard/heuristics.js edge cases');
  
  // Empty or invalid input
  const emptyResult = analyzeText('');
  assert.strictEqual(emptyResult.isScam, false, 'Empty text should not flag as scam');

  // Case insensitivity
  const uppercaseScam = analyzeText('FREE DISCORD NITRO AT DISCORD-GIFT.COM');
  assert.strictEqual(uppercaseScam.isScam, true, 'Uppercase scam phrases should be detected');

  // Benign messages with links
  const benignUrl = analyzeText('Check out the new music video on https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.strictEqual(benignUrl.isScam, false, 'Standard YouTube URLs should not be flagged as scams');

  const benignSpotify = analyzeText('Listening to Clancy album on https://open.spotify.com/album/123');
  assert.strictEqual(benignSpotify.isScam, false, 'Standard Spotify links should not be flagged as scams');

  console.log('✓ Heuristic edge cases and false-positive checks passed.');

  console.log('\n--- All Helper Function Tests Passed ---');
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Helper functions test failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
