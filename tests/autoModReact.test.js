const assert = require('assert');
const { reactToRecentMessages } = require('../helpers/autoModReact');

async function runTests() {
  console.log('--- Starting AutoMod Reaction Test Suite ---');

  // Helper to create mock client
  function createMockClient(options = {}) {
    const logEntries = { info: [], warn: [], debug: [] };

    const mockClient = {
      config: {
        autoModReactions: options.autoModReactions ?? ['860015991031463947', '587034603861049604'],
        autoModReactionWindowMs: options.autoModReactionWindowMs ?? 60000
      },
      log: {
        info: (msg) => logEntries.info.push(msg),
        warn: (msg) => logEntries.warn.push(msg),
        debug: (msg) => logEntries.debug.push(msg)
      },
      cache: {
        getUserRecentMessages: async (_uid) => options.cachedMessages || []
      },
      channels: {
        cache: new Map(),
        fetch: async (id) => options.fetchChannel ? options.fetchChannel(id) : null
      },
      _logEntries: logEntries
    };

    return mockClient;
  }

  // Helper to create mock message
  function createMockMessage(id, channelId, failReact = false) {
    const reactions = [];
    return {
      id,
      channelId,
      react: async (emoji) => {
        if (failReact) {
          throw new Error('DiscordAPIError: Missing Permissions to Add Reactions');
        }
        reactions.push(emoji);
        return true;
      },
      _reactions: reactions
    };
  }

  // Test 1: Messages within 60 seconds receive both reactions in order
  console.log('Test 1: Reacts to messages within 60s window in correct order');
  {
    const now = Date.now();
    const msg1 = createMockMessage('m1', 'c1');
    const msg2 = createMockMessage('m2', 'c2');
    const msgOld = createMockMessage('m_old', 'c1');

    const client = createMockClient({
      cachedMessages: [
        { channelId: 'c1', messageId: 'm1', timestamp: now - 15000 },
        { channelId: 'c2', messageId: 'm2', timestamp: now - 50000 },
        { channelId: 'c1', messageId: 'm_old', timestamp: now - 80000 } // >60s old
      ],
      fetchChannel: (cId) => {
        return {
          id: cId,
          messages: {
            cache: new Map(),
            fetch: async (mId) => {
              if (mId === 'm1') return msg1;
              if (mId === 'm2') return msg2;
              if (mId === 'm_old') return msgOld;
              return null;
            }
          }
        };
      }
    });

    const res = await reactToRecentMessages(client, 'user123', null);
    assert.strictEqual(res.totalTargets, 2, 'Should target exactly 2 recent messages within 60s');
    assert.strictEqual(res.reactedMessages, 2, 'Should have reacted to both messages');

    assert.deepStrictEqual(msg1._reactions, ['860015991031463947', '587034603861049604'], 'msg1 should have received both reactions in order');
    assert.deepStrictEqual(msg2._reactions, ['860015991031463947', '587034603861049604'], 'msg2 should have received both reactions in order');
    assert.strictEqual(msgOld._reactions.length, 0, 'Old message should not have been reacted to');
    console.log('✓ 60-second window filter and reaction order verified.');
  }

  // Test 2: Triggering message included and deduplicated
  console.log('Test 2: Triggering message is always included and not duplicated');
  {
    const now = Date.now();
    const triggeringMsg = createMockMessage('m_trig', 'c_trig');
    const cachedMsg = createMockMessage('m_cached', 'c1');

    const client = createMockClient({
      cachedMessages: [
        // Included both triggering message and another recent message
        { channelId: 'c_trig', messageId: 'm_trig', timestamp: now - 2000 },
        { channelId: 'c1', messageId: 'm_cached', timestamp: now - 10000 }
      ],
      fetchChannel: (cId) => {
        return {
          id: cId,
          messages: {
            cache: new Map(),
            fetch: async (mId) => (mId === 'm_cached' ? cachedMsg : null)
          }
        };
      }
    });

    const res = await reactToRecentMessages(client, 'user123', triggeringMsg);
    assert.strictEqual(res.totalTargets, 2, 'Should deduplicate triggering message and have 2 targets total');
    assert.strictEqual(res.reactedMessages, 2, 'Both targets should be reacted to');
    assert.deepStrictEqual(triggeringMsg._reactions, ['860015991031463947', '587034603861049604']);
    assert.deepStrictEqual(cachedMsg._reactions, ['860015991031463947', '587034603861049604']);
    console.log('✓ Triggering message inclusion and deduplication verified.');
  }

  // Test 3: Fallback and error resilience when a reaction rejects
  console.log('Test 3: Gracefully handles missing channel or reaction rejection without crashing');
  {
    const failingMsg = createMockMessage('m_fail', 'c1', true);
    const client = createMockClient({
      cachedMessages: [
        { channelId: 'c1', messageId: 'm_fail', timestamp: Date.now() - 5000 },
        { channelId: 'c_missing', messageId: 'm_ghost', timestamp: Date.now() - 5000 }
      ],
      fetchChannel: (cId) => {
        if (cId === 'c1') {
          return {
            id: cId,
            messages: {
              cache: new Map(),
              fetch: async () => failingMsg
            }
          };
        }
        return null; // Missing channel
      }
    });

    // Should complete cleanly without throwing
    const res = await reactToRecentMessages(client, 'user123', null);
    assert.strictEqual(res.totalTargets, 2, 'Two targets found');
    assert.strictEqual(res.reactedMessages, 0, '0 successful reactions due to failure/missing channel');
    assert(client._logEntries.warn.length > 0, 'Warnings should be logged');
    console.log('✓ Resilience to reaction failures and missing channels verified.');
  }

  // Test 4: Custom configured emojis and custom window
  console.log('Test 4: Supports customized reaction emojis and time window');
  {
    const now = Date.now();
    const customMsg = createMockMessage('m_custom', 'c1');
    const client = createMockClient({
      autoModReactions: ['⚠️', '🛑'],
      autoModReactionWindowMs: 30000,
      cachedMessages: [
        { channelId: 'c1', messageId: 'm_custom', timestamp: now - 20000 },
        { channelId: 'c1', messageId: 'm_too_old_for_30s', timestamp: now - 35000 }
      ],
      fetchChannel: (cId) => ({
        id: cId,
        messages: {
          cache: new Map(),
          fetch: async (mId) => (mId === 'm_custom' ? customMsg : null)
        }
      })
    });

    const res = await reactToRecentMessages(client, 'user_custom', null);
    assert.strictEqual(res.totalTargets, 1, 'Only message within 30s window should be targeted');
    assert.deepStrictEqual(customMsg._reactions, ['⚠️', '🛑'], 'Custom emojis should be applied');
    console.log('✓ Configurable emojis and custom window verified.');
  }

  // Test 5: Empty user or no cached messages
  console.log('Test 5: Handles empty userId or empty cache gracefully');
  {
    const client = createMockClient({ cachedMessages: [] });
    const res1 = await reactToRecentMessages(client, null);
    assert.strictEqual(res1.totalTargets, 0);

    const res2 = await reactToRecentMessages(client, 'user_none', null);
    assert.strictEqual(res2.totalTargets, 0);
    console.log('✓ Empty/null inputs handled cleanly.');
  }

  // Test 6: Honeypot integration executes reactions BEFORE attachment download, DM, ban, and delete
  console.log('Test 6: Honeypot executes reactions before any processing (DM, ban, delete)');
  {
    const honeypot = require('../helpers/honeypot');
    const executionOrder = [];

    const mockMessage = {
      id: 'hp_msg_1',
      channelId: 'hp_chan',
      content: 'free nitro click here',
      createdTimestamp: Date.now(),
      attachments: new Map(),
      author: {
        id: 'bad_actor_1',
        tag: 'badactor#0001',
        createDM: async () => {
          executionOrder.push('dm');
          return {
            send: async () => executionOrder.push('dm_sent')
          };
        }
      },
      member: {
        roles: {
          cache: {
            some: () => false // not staff
          }
        },
        ban: async () => executionOrder.push('ban')
      },
      react: async (emoji) => executionOrder.push(`react:${emoji}`),
      delete: async () => executionOrder.push('delete')
    };

    const mockClient = {
      config: {
        roles: { staff: 'staff_role' },
        channels: { honeypot: 'hp_chan', banLog: 'ban_log' },
        clientID: 'bot_id',
        autoModReactions: ['860015991031463947', '587034603861049604'],
        autoModReactionWindowMs: 60000
      },
      log: {
        info: () => {},
        warn: () => {},
        debug: () => {},
        error: () => {}
      },
      cache: {
        getUserRecentMessages: async () => []
      },
      channels: {
        cache: new Map(),
        fetch: async () => ({
          send: async () => {},
          setTopic: async () => {}
        })
      },
      DB: {
        Honeypot: {
          findOrCreate: async () => [{ BannedCount: 1, save: async () => {} }]
        }
      },
      notes: {
        addNote: async () => {}
      }
    };

    await honeypot.processHoneypot(mockClient, mockMessage);

    // Reactions MUST occur before DM, ban, and delete
    const firstReactIndex = executionOrder.indexOf('react:860015991031463947');
    const secondReactIndex = executionOrder.indexOf('react:587034603861049604');
    const dmIndex = executionOrder.indexOf('dm');
    const banIndex = executionOrder.indexOf('ban');
    const deleteIndex = executionOrder.indexOf('delete');

    assert(firstReactIndex !== -1, 'First reaction should be recorded');
    assert(secondReactIndex !== -1, 'Second reaction should be recorded');
    assert(firstReactIndex < secondReactIndex, 'First reaction should precede second reaction');
    assert(secondReactIndex < dmIndex, 'Reactions must happen BEFORE DM');
    assert(secondReactIndex < banIndex, 'Reactions must happen BEFORE ban');
    assert(secondReactIndex < deleteIndex, 'Reactions must happen BEFORE delete');
    console.log('✓ Honeypot execution ordering confirmed (reactions precede DM, ban, delete).');
  }

  // Test 7: ImageGuard executeBanAndPurge executes reactions BEFORE delete and ban
  console.log('Test 7: ImageGuard executeBanAndPurge executes reactions before delete and ban');
  {
    const imageGuard = require('../helpers/imageGuard');
    const igExecutionOrder = [];

    const mockMessage = {
      id: 'ig_msg_1',
      channelId: 'ig_chan',
      author: {
        id: 'bad_actor_2',
        tag: 'badactor2#0001',
        createDM: async () => ({ send: async () => {} })
      },
      member: {
        ban: async () => igExecutionOrder.push('ban')
      },
      react: async (emoji) => igExecutionOrder.push(`react:${emoji}`),
      delete: async () => igExecutionOrder.push('delete'),
      channel: {
        id: 'ig_chan',
        bulkDelete: async () => igExecutionOrder.push('bulkDelete'),
        messages: {
          fetch: async () => new Map()
        }
      }
    };

    const mockClient = {
      config: {
        guildID: 'guild_1',
        roles: { staff: 'staff_role' },
        channels: { scamLog: 'scam_log', banLog: 'ban_log' },
        autoModReactions: ['860015991031463947', '587034603861049604'],
        autoModReactionWindowMs: 60000,
        imageGuard: {
          banAppealUrl: 'https://bans.example.com'
        }
      },
      log: {
        info: () => {},
        warn: () => {},
        debug: () => {},
        error: () => {}
      },
      cache: {
        getUserRecentMessages: async () => []
      },
      channels: {
        cache: new Map(),
        fetch: async () => ({
          send: async () => {}
        })
      },
      guilds: {
        cache: new Map(),
        fetch: async () => ({
          members: {
            ban: async () => igExecutionOrder.push('ban')
          }
        })
      },
      DB: {
        ScamImageHashes: {
          increment: async () => {}
        }
      },
      notes: {
        addNote: async () => {}
      }
    };

    await imageGuard.executeBanAndPurge(mockClient, mockMessage, Buffer.from([]), {
      matchType: 'pHash',
      distance: 0,
      hexHash: '1234',
      matchedHash: '1234',
      label: 'Scam Test'
    });

    const firstReactIndex = igExecutionOrder.indexOf('react:860015991031463947');
    const secondReactIndex = igExecutionOrder.indexOf('react:587034603861049604');
    const deleteIndex = igExecutionOrder.findIndex(e => e === 'delete' || e === 'bulkDelete');
    const banIndex = igExecutionOrder.indexOf('ban');

    assert(firstReactIndex !== -1, 'First reaction should be recorded in ImageGuard');
    assert(secondReactIndex !== -1, 'Second reaction should be recorded in ImageGuard');
    assert(firstReactIndex < secondReactIndex, 'First reaction precedes second reaction');
    assert(secondReactIndex < deleteIndex, 'Reactions must happen BEFORE delete');
    assert(secondReactIndex < banIndex, 'Reactions must happen BEFORE ban');
    console.log('✓ ImageGuard execution ordering confirmed (reactions precede delete and ban).');
  }

  console.log('\n--- All AutoMod Reaction Tests Passed Successfully! ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
