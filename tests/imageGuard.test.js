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
  console.log('✓ Bot users ignored by Image Guard.');

  console.log('\n--- All Image Guard Tests Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
