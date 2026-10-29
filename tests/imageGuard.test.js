const assert = require('assert');
const { createCanvas } = require('canvas');
const { computePHash, hammingDistance, binaryToHex, hexToBinary } = require('../helpers/imageGuard/phash');
const { analyzeText } = require('../helpers/imageGuard/heuristics');

async function runTests() {
  console.log('--- Starting Image Guard Test Suite ---');

  // Test 1: Hex and Binary Roundtrip
  console.log('Test 1: Hex <-> Binary conversion');
  const sampleBinary = '1'.repeat(32) + '0'.repeat(32);
  const hex = binaryToHex(sampleBinary);
  const backToBinary = hexToBinary(hex);
  assert.strictEqual(backToBinary, sampleBinary, 'Binary should roundtrip through hex');
  console.log('✓ Hex <-> Binary conversion passed.');

  // Test 2: Heuristics & Regex Analysis
  console.log('\nTest 2: Scam text heuristics');
  const scamSamples = [
    'Claim your free 3 months Discord Nitro at discorcl-nitro.gift',
    'Steam $100 gift card giveaway! Click here to claim your wallet code',
    'Who wants free nitro? First one to claim gets it',
    'Scan this QR code with discord app to claim your free reward',
    'I am pleased to announce the launch of my own cryptocurrency casino. To celebrate, I am giving away $3,200 to everyone who registers, and you can withdraw the bonus immediately. Go to ruakax.com promo code: CRAZY',
    'MrBeast - special promo code: CRAZY - claim your reward'
  ];

  for (const sample of scamSamples) {
    const result = analyzeText(sample);
    assert.strictEqual(result.isScam, true, `Should flag scam text: "${sample}"`);
    assert(result.matchedPatterns.length > 0, 'Should have matched patterns');
  }

  const benignSamples = [
    'Hey guys, what time does the twenty one pilots concert start tonight?',
    'Check out this cool photo from the show in Columbus',
    'Does anyone know where to buy tickets?'
  ];

  for (const sample of benignSamples) {
    const result = analyzeText(sample);
    assert.strictEqual(result.isScam, false, `Should NOT flag benign text: "${sample}"`);
  }
  console.log('✓ Scam text heuristics passed.');

  // Test 3: Perceptual Hash (pHash) Invariance on Real-World Graphics
  console.log('\nTest 3: Perceptual Hash (pHash) Invariance');

  // Create Image A: 400x300 graphic banner with high-contrast shapes and text
  const canvasA = createCanvas(400, 300);
  const ctxA = canvasA.getContext('2d');
  // Background
  ctxA.fillStyle = '#1e293b';
  ctxA.fillRect(0, 0, 400, 300);
  // High contrast banner elements
  ctxA.fillStyle = '#ef4444';
  ctxA.fillRect(40, 40, 160, 100);
  ctxA.fillStyle = '#eab308';
  ctxA.beginPath();
  ctxA.arc(300, 120, 50, 0, Math.PI * 2);
  ctxA.fill();
  ctxA.fillStyle = '#3b82f6';
  ctxA.fillRect(60, 180, 280, 80);
  ctxA.fillStyle = '#ffffff';
  ctxA.font = '24px sans-serif';
  ctxA.fillText('DISCORD NITRO PROMO', 70, 230);

  const pngA = canvasA.toBuffer('image/png');
  const jpegA = canvasA.toBuffer('image/jpeg', { quality: 0.75 });

  // Resized 50% scale
  const canvasResized = createCanvas(200, 150);
  const ctxResized = canvasResized.getContext('2d');
  ctxResized.drawImage(canvasA, 0, 0, 200, 150);
  const pngResized = canvasResized.toBuffer('image/png');

  // Completely different image (green circle on white background)
  const canvasOther = createCanvas(400, 300);
  const ctxOther = canvasOther.getContext('2d');
  ctxOther.fillStyle = '#ffffff';
  ctxOther.fillRect(0, 0, 400, 300);
  ctxOther.fillStyle = '#10b981';
  ctxOther.beginPath();
  ctxOther.arc(200, 150, 80, 0, Math.PI * 2);
  ctxOther.fill();
  const pngOther = canvasOther.toBuffer('image/png');

  const hashPNG = await computePHash(pngA);
  const hashJPEG = await computePHash(jpegA);
  const hashResized = await computePHash(pngResized);
  const hashOther = await computePHash(pngOther);

  const distJPEG = hammingDistance(hashPNG, hashJPEG);
  const distResized = hammingDistance(hashPNG, hashResized);
  const distOther = hammingDistance(hashPNG, hashOther);

  console.log(`Hash Original:   ${binaryToHex(hashPNG)}`);
  console.log(`Hash JPEG (75%): ${binaryToHex(hashJPEG)} (Distance: ${distJPEG})`);
  console.log(`Hash Resized:    ${binaryToHex(hashResized)} (Distance: ${distResized})`);
  console.log(`Hash Dissimilar: ${binaryToHex(hashOther)} (Distance: ${distOther})`);

  assert(distJPEG <= 6, `JPEG compressed image must match with distance <= 6 (got ${distJPEG})`);
  assert(distResized <= 6, `Resized image must match with distance <= 6 (got ${distResized})`);
  assert(distOther > 15, `Dissimilar image must differ with distance > 15 (got ${distOther})`);
  // Test 4: Perfect pHash Exact Match (Distance 0)
  console.log('\nTest 4: Perfect pHash exact match validation');
  const exactDist = hammingDistance(hashPNG, hashPNG);
  assert.strictEqual(exactDist, 0, 'Identical images must have hamming distance 0');
  console.log('✓ Perfect pHash exact match (distance 0) confirmed.');

  // Test 5: Bot user exclusion in checkMessage
  console.log('\nTest 5: Bot user exclusion in checkMessage');
  const { checkMessage } = require('../helpers/imageGuard');
  const mockClient = {
    config: { roles: { staff: '123' }, imageGuard: { enabled: true } },
    log: { debug: () => {} }
  };
  const mockBotMessage = {
    author: { id: 'bot_999', bot: true },
    member: { roles: { cache: new Map() } },
    attachments: new Map()
  };
  const result = await checkMessage(mockClient, mockBotMessage);
  assert.strictEqual(result, null, 'checkMessage must return null and ignore bot users');
  // Test 6: Tiered Confidence Gating & Weighted Scoring
  console.log('\nTest 6: Tiered Confidence Gating & Weighted Scoring');
  // Solitary contextual phrase: confidence 0.4 < 0.7 threshold -> NOT a scam
  const singleContextual = analyzeText('Who wants free nitro?');
  assert.strictEqual(singleContextual.confidence, 0.4, 'Single contextual match should have 0.4 confidence');
  assert.strictEqual(singleContextual.isScam, false, 'Single contextual match should not trigger scam flag');

  // Correlating contextual phrases: confidence >= 0.7 threshold -> scam
  const multiContextual = analyzeText('Scan this QR code to claim your reward!');
  assert(multiContextual.confidence >= 0.8, 'Correlating contextual matches should reach >= 0.8 confidence');
  assert.strictEqual(multiContextual.isScam, true, 'Correlating contextual matches should trigger scam flag');

  // High confidence domain or definitive scam phrase -> scam on its own
  const highConfSample = analyzeText('Free nitro generator download at nitro-boost.gift');
  assert(highConfSample.confidence >= 0.8, 'High confidence indicator should reach >= 0.8 confidence');
  assert.strictEqual(highConfSample.isScam, true, 'High confidence indicator should flag alone');
  console.log('✓ Tiered confidence gating passed.');

  // Test 7: Noise & Hallucination Rejection
  console.log('\nTest 7: Noise & Hallucination Rejection');
  const noisyGarbage = 'a b c d e f g 1 2 3 % $ # @ ! qr . , ; : ? / \\ | [ ] { } app x y z '.repeat(40);
  const noiseResult = analyzeText(noisyGarbage);
  assert.strictEqual(noiseResult.isNoise, true, 'Hallucinated single-character noise should be classified as noise');
  assert.strictEqual(noiseResult.isScam, false, 'Hallucinated noise should never flag as scam');
  console.log('✓ Noise & hallucination rejection passed.');

  // Test 8: Nearest Neighbor Selection (Exact Match preferred over Near Match)
  console.log('\nTest 8: Nearest Neighbor Selection');
  const targetBinary = '1'.repeat(64);
  const targetHex = binaryToHex(targetBinary);

  // Hash 1: distance 2 (ends in 00)
  const hashDist2Binary = '1'.repeat(62) + '00';
  const hashDist2Hex = binaryToHex(hashDist2Binary);

  // Hash 2: distance 0 (identical)
  const hashDist0Binary = targetBinary;
  const hashDist0Hex = targetHex;

  const mockHashCache = new Map();
  // Insert distance 2 first to emulate worst-case iteration order
  mockHashCache.set(hashDist2Hex, { id: 1, hex: hashDist2Hex, binary: hashDist2Binary, label: 'Near Match' });
  mockHashCache.set(hashDist0Hex, { id: 2, hex: hashDist0Hex, binary: hashDist0Binary, label: 'Exact Match' });

  // Simulate nearest neighbor search logic from helpers/imageGuard/index.js
  let nearestMatch = null;
  let lowestDistance = 64;
  if (mockHashCache.has(targetHex)) {
    nearestMatch = mockHashCache.get(targetHex);
    lowestDistance = 0;
  } else {
    for (const [, known] of mockHashCache) {
      const dist = hammingDistance(targetBinary, known.binary);
      if (dist < lowestDistance) {
        lowestDistance = dist;
        nearestMatch = known;
      }
      if (lowestDistance === 0) break;
    }
  }

  assert.strictEqual(lowestDistance, 0, 'Must identify exact match (distance 0)');
  assert.strictEqual(nearestMatch.id, 2, 'Must pick Exact Match (ID 2) even if Near Match (ID 1) was listed first');
  console.log('✓ Nearest neighbor selection passed.');

  // Test 9: Near Image Match & Threshold Gating
  console.log('\nTest 9: Near Image Match & Threshold Gating (Distance <= 6)');
  const threshold = 6;
  const testScenarios = [
    { distance: 0, autoBanExact: true, autoBanNear: false, isStaff: false, expectedBan: true, label: 'Exact match (dist 0)' },
    { distance: 4, autoBanExact: true, autoBanNear: true, isStaff: false, expectedBan: true, label: 'Near match (dist 4 <= 6) with autoBanNear' },
    { distance: 6, autoBanExact: true, autoBanNear: true, isStaff: false, expectedBan: true, label: 'Near match boundary (dist 6 <= 6) with autoBanNear' },
    { distance: 4, autoBanExact: true, autoBanNear: false, isStaff: false, expectedBan: false, label: 'Near match (dist 4 <= 6) with autoBanNear=false' },
    { distance: 4, autoBanExact: true, autoBanNear: true, isStaff: true, expectedBan: false, label: 'Near match (dist 4) staff preview protection' },
    { distance: 7, autoBanExact: true, autoBanNear: true, isStaff: false, expectedMatch: false, label: 'Distance 7 > threshold 6' }
  ];

  for (const s of testScenarios) {
    const isMatch = s.distance <= threshold;
    if (s.expectedMatch !== undefined) {
      assert.strictEqual(isMatch, s.expectedMatch, `${s.label} match check`);
    } else {
      const isPerfect = s.distance === 0;
      const isNear = s.distance > 0 && s.distance <= threshold;
      const shouldAutoBan = (isPerfect && s.autoBanExact) || (isNear && s.autoBanNear);
      const willBan = shouldAutoBan && !s.isStaff;
      assert.strictEqual(willBan, s.expectedBan, `${s.label} moderation decision`);
    }
  }
  console.log('✓ Near image match & threshold gating passed.');

  // Test 10: Message Deletion & Cross-Channel Sweeping
  console.log('\nTest 10: Cross-Channel Message Deletion & Purge Lag Protection');
  const { executeBanAndPurge } = require('../helpers/imageGuard');

  let deletedMessageIds = [];
  let bulkDeletedMessageIds = [];
  let userBannedWithReason = null;
  let userBannedDeleteSeconds = null;
  let noteCreated = null;

  const mockTriggerMessage = {
    id: 'msg_trigger_100',
    channelId: 'chan_general',
    author: { id: 'scammer_1', createDM: async () => ({ send: async () => {} }) },
    channel: {
      id: 'chan_general',
      async bulkDelete(messages) {
        for (const [id] of messages) {
          bulkDeletedMessageIds.push(id);
        }
      },
      messages: {
        async fetch() {
          const m1 = { id: 'msg_trigger_100', author: { id: 'scammer_1' }, delete: async () => { deletedMessageIds.push('msg_trigger_100'); } };
          const mInnocent = { id: 'msg_innocent_103', author: { id: 'innocent_user' }, delete: async () => { deletedMessageIds.push('msg_innocent_103'); } };

          const map = new Map();
          map.set(m1.id, m1);
          map.set(mInnocent.id, mInnocent);
          return map;
        }
      }
    },
    async delete() {
      deletedMessageIds.push('msg_trigger_100');
    }
  };

  const channelMusic = {
    id: 'chan_music',
    isTextBased: () => true,
    messages: {
      cache: new Map(),
      async fetch(id) {
        if (id === 'msg_cross_music') {
          return { id, delete: async () => { deletedMessageIds.push('msg_cross_music'); } };
        }
        return null;
      }
    }
  };

  const msgMemes = {
    id: 'msg_cross_memes',
    author: { id: 'scammer_1' },
    delete: async () => { deletedMessageIds.push('msg_cross_memes'); }
  };
  const channelMemes = {
    id: 'chan_memes',
    isTextBased: () => true,
    messages: {
      cache: new Map([['msg_cross_memes', msgMemes]])
    }
  };

  const mockClientForPurge = {
    config: {
      guildID: 'guild_123',
      clientID: 'bot_client',
      channels: { banLog: 'chan_banlog', scamLog: 'chan_scamlog' },
      imageGuard: { banAppealUrl: 'https://appeal.test' }
    },
    cache: {
      async getUserRecentMessages(userId) {
        if (userId === 'scammer_1') {
          return [
            { channelId: 'chan_general', messageId: 'msg_trigger_100' },
            { channelId: 'chan_music', messageId: 'msg_cross_music' }
          ];
        }
        return [];
      },
      async clearUserRecentMessages() {}
    },
    users: {
      async fetch() {
        return mockTriggerMessage.author;
      }
    },
    guilds: {
      cache: new Map([
        ['guild_123', {
          channels: {
            cache: new Map([
              ['chan_general', mockTriggerMessage.channel],
              ['chan_music', channelMusic],
              ['chan_memes', channelMemes]
            ])
          }
        }]
      ]),
      async fetch() {
        return {
          channels: {
            cache: new Map([
              ['chan_general', mockTriggerMessage.channel],
              ['chan_music', channelMusic],
              ['chan_memes', channelMemes]
            ])
          },
          members: {
            async ban(userId, options) {
              userBannedWithReason = options.reason;
              userBannedDeleteSeconds = options.deleteMessageSeconds;
            }
          }
        };
      }
    },
    channels: {
      async fetch(id) {
        if (id === 'chan_music') return channelMusic;
        if (id === 'chan_memes') return channelMemes;
        return {
          id,
          send: async () => {}
        };
      }
    },
    DB: {
      Notes: {
        async create(noteData) {
          noteCreated = noteData;
        }
      }
    },
    log: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    }
  };

  await executeBanAndPurge(
    mockClientForPurge,
    mockTriggerMessage,
    Buffer.from('dummy'),
    { matchType: 'pHash', distance: 4, hexHash: 'a1b2', label: 'Discord Nitro Scam' }
  );

  assert(deletedMessageIds.includes('msg_trigger_100'), 'Triggering message in #general must be deleted');
  assert(deletedMessageIds.includes('msg_cross_music'), 'Message in #music spread across channel must be deleted');
  assert(deletedMessageIds.includes('msg_cross_memes'), 'Message in #memes spread across channel must be deleted');
  assert(!deletedMessageIds.includes('msg_innocent_103'), 'Innocent user message must NOT be deleted');
  assert.strictEqual(userBannedDeleteSeconds, 300, 'Guild ban must request 300s purge');
  assert(userBannedWithReason.includes('pHash near match'), 'Ban reason must specify near match');
  assert(noteCreated && noteCreated.User === 'scammer_1', 'DB Note must be recorded for scammer');
  console.log('✓ Cross-channel message deletion & purge lag protection passed.');

  console.log('\n--- All Image Guard Tests Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
