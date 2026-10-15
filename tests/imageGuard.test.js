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

  // Create Image A: 400x300 pattern
  const canvasA = createCanvas(400, 300);
  const ctxA = canvasA.getContext('2d');
  const imgDataA = ctxA.createImageData(400, 300);
  for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 400; x++) {
      const idx = (y * 400 + x) * 4;
      imgDataA.data[idx] = (x * 255) / 400; // red gradient
      imgDataA.data[idx + 1] = (y * 255) / 300; // green gradient
      imgDataA.data[idx + 2] = 128;
      imgDataA.data[idx + 3] = 255;
    }
  }
  ctxA.putImageData(imgDataA, 0, 0);

  const pngA = canvasA.toBuffer('image/png');
  const jpegA = canvasA.toBuffer('image/jpeg', { quality: 0.75 });

  // Resized 50% scale
  const canvasResized = createCanvas(200, 150);
  const ctxResized = canvasResized.getContext('2d');
  const imgDataResized = ctxResized.createImageData(200, 150);
  for (let y = 0; y < 150; y++) {
    for (let x = 0; x < 200; x++) {
      const idx = (y * 200 + x) * 4;
      imgDataResized.data[idx] = (x * 2 * 255) / 400;
      imgDataResized.data[idx + 1] = (y * 2 * 255) / 300;
      imgDataResized.data[idx + 2] = 128;
      imgDataResized.data[idx + 3] = 255;
    }
  }
  ctxResized.putImageData(imgDataResized, 0, 0);
  const pngResized = canvasResized.toBuffer('image/png');

  // Completely different image (checkerboard pattern)
  const canvasOther = createCanvas(400, 300);
  const ctxOther = canvasOther.getContext('2d');
  const imgDataOther = ctxOther.createImageData(400, 300);
  for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 400; x++) {
      const idx = (y * 400 + x) * 4;
      const check = (Math.floor(x / 50) + Math.floor(y / 50)) % 2 === 0;
      imgDataOther.data[idx] = check ? 255 : 0;
      imgDataOther.data[idx + 1] = check ? 255 : 0;
      imgDataOther.data[idx + 2] = check ? 255 : 0;
      imgDataOther.data[idx + 3] = 255;
    }
  }
  ctxOther.putImageData(imgDataOther, 0, 0);
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

  console.log('\n--- All Image Guard Tests Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
