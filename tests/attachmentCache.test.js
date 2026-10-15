const assert = require('assert');
const { AttachmentBuilder } = require('discord.js');
const RedisCache = require('../structures/cache');

async function runTests() {
  console.log('--- Starting Attachment Cache Test Suite ---');

  // Create an in-memory mock Redis client to test RedisCache methods without external dependencies
  const memoryStore = new Map();
  const mockRedisClient = {
    async set(key, value, options) {
      memoryStore.set(key, { value, options });
      return 'OK';
    },
    async get(optionsOrKey, keyMaybe) {
      const key = keyMaybe || optionsOrKey;
      const entry = memoryStore.get(key);
      if (!entry) return null;
      return entry.value;
    },
    async exists(key) {
      return memoryStore.has(key) ? 1 : 0;
    },
    async incr(key) {
      const current = parseInt(memoryStore.get(key)?.value || '0', 10);
      memoryStore.set(key, { value: String(current + 1) });
      return current + 1;
    }
  };

  const cache = new RedisCache();
  cache.client = mockRedisClient;

  // Test 1: Binary Buffer Roundtrip & Fidelity
  console.log('Test 1: Binary Buffer fidelity in cacheAttachment & getAttachment');
  const sampleBinary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0xfe, 0x7f]);
  await cache.cacheAttachment('att_123', sampleBinary, 86400);

  const storedEntry = memoryStore.get('attachment:att_123');
  assert(storedEntry, 'Key attachment:att_123 should exist in store');
  assert.strictEqual(storedEntry.options.EX, 86400, 'TTL should match 86400 seconds');

  const retrieved = await cache.getAttachment('att_123');
  assert(Buffer.isBuffer(retrieved), 'Retrieved value should be a Buffer');
  assert.strictEqual(Buffer.compare(retrieved, sampleBinary), 0, 'Retrieved buffer should match original exactly');
  console.log('✓ Binary Buffer roundtrip passed.');

  // Test 2: hasAttachment checks
  console.log('\nTest 2: hasAttachment verification');
  assert.strictEqual(await cache.hasAttachment('att_123'), true, 'Should return true for existing attachment');
  assert.strictEqual(await cache.hasAttachment('non_existent'), false, 'Should return false for non-existent attachment');
  console.log('✓ hasAttachment passed.');

  // Test 3: getAttachmentFiles with cached and uncached attachments
  console.log('\nTest 3: getAttachmentFiles functionality');
  const testAttachments = [
    { id: 'att_123', name: 'photo.png', url: 'https://cdn.discordapp.com/attachments/photo.png' },
    { id: 'att_456', name: 'missing.png', url: 'https://cdn.discordapp.com/attachments/missing.png' }
  ];

  const result = await cache.getAttachmentFiles(testAttachments);
  assert.strictEqual(result.files.length, 1, 'Should resolve 1 cached file');
  assert(result.files[0] instanceof AttachmentBuilder, 'Result should be an AttachmentBuilder');
  assert.strictEqual(result.files[0].name, 'photo.png', 'AttachmentBuilder name should match');
  assert(result.extraContent.includes('missing.png'), 'Uncached file should be reported in extraContent');
  assert(result.extraContent.includes('*(File not cached or expired)*'), 'Notice should be included for uncached file');
  console.log('✓ getAttachmentFiles passed.');

  // Test 4: Payload size and count limits in getAttachmentFiles
  console.log('\nTest 4: Payload limits in getAttachmentFiles');
  // Create an attachment that exceeds the 24MB payload ceiling
  const hugeBuffer = Buffer.alloc(25 * 1024 * 1024);
  await cache.cacheAttachment('att_huge', hugeBuffer, 86400);

  const payloadResult = await cache.getAttachmentFiles([
    { id: 'att_huge', name: 'huge.dat', url: 'https://cdn.discordapp.com/attachments/huge.dat' }
  ]);
  assert.strictEqual(payloadResult.files.length, 0, 'Oversized payload should not be included in files array');
  assert(payloadResult.extraContent.includes('Exceeded upload size/count limit'), 'Should note oversized file in extraContent');
  console.log('✓ Payload limits passed.');

  // Test 5: downloadAndCacheAttachments with size filtering and mock fetch
  console.log('\nTest 5: downloadAndCacheAttachments handles size limits and existing cache');
  let fetchCount = 0;
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    fetchCount++;
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => Buffer.from('dummy image content').buffer
    };
  };

  try {
    const attachmentsToDownload = [
      // Already cached from Test 1 (att_123) -> should NOT fetch
      { id: 'att_123', name: 'photo.png', url: 'https://cdn.discordapp.com/attachments/photo.png' },
      // Too large (size > 26214400) -> should NOT fetch
      { id: 'att_giant', name: 'giant.iso', size: 30 * 1024 * 1024, url: 'https://cdn.discordapp.com/attachments/giant.iso' },
      // New normal attachment -> SHOULD fetch
      { id: 'att_new', name: 'new.png', size: 1000, url: 'https://cdn.discordapp.com/attachments/new.png' }
    ];

    await cache.downloadAndCacheAttachments(attachmentsToDownload);
    assert.strictEqual(fetchCount, 1, 'Only the new, within-limit attachment should trigger fetch');
    assert(await cache.hasAttachment('att_new'), 'New attachment should be stored in cache');
    console.log('✓ downloadAndCacheAttachments passed.');
  } finally {
    global.fetch = originalFetch;
  }

  // Test 6: cacheMessage integrates attachment caching
  console.log('\nTest 6: cacheMessage integrates attachments collection');
  const mockMessage = {
    id: 'msg_999',
    author: { id: 'user_111' },
    channelId: 'chan_222',
    content: 'Check out this file',
    createdTimestamp: Date.now(),
    attachments: {
      toJSON: () => [
        { id: 'att_msg', name: 'file.txt', size: 100, url: 'https://cdn.discordapp.com/attachments/file.txt' }
      ]
    }
  };

  let msgFetchCalled = false;
  global.fetch = async (url) => {
    msgFetchCalled = true;
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => Buffer.from('hello world').buffer
    };
  };

  try {
    await cache.cacheMessage(mockMessage);
    const cachedMsg = await cache.getMessage('msg_999');
    assert.strictEqual(cachedMsg.content, 'Check out this file', 'Message content should be cached');
    assert.strictEqual(cachedMsg.attachments.length, 1, 'Message attachments array should be cached');
    assert.strictEqual(msgFetchCalled, true, 'Attachment should be downloaded during cacheMessage');
    assert.strictEqual(await cache.hasAttachment('att_msg'), true, 'Attachment should be present in Redis');
    console.log('✓ cacheMessage integration passed.');
  } finally {
    global.fetch = originalFetch;
  }

  console.log('\n--- All Attachment Cache Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
