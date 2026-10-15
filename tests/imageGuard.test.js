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
    'Scan this QR code with discord app to claim your free reward'
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

  // Create Image A: 400x300 gradient banner with text and shapes
  const canvasA = createCanvas(400, 300);
  const ctxA = canvasA.getContext('2d');
  const grad = ctxA.createLinearGradient(0, 0, 400, 300);
  grad.addColorStop(0, '#2c3e50');
  grad.addColorStop(1, '#3498db');
  ctxA.fillStyle = grad;
  ctxA.fillRect(0, 0, 400, 300);
  ctxA.fillStyle = '#ffffff';
  ctxA.fillText('DISCORD NITRO GIVEAWAY', 30, 80);
  ctxA.fillStyle = '#e74c3c';
  ctxA.fillRect(30, 180, 200, 50);

  const pngA = canvasA.toBuffer('image/png');
  const jpegA = canvasA.toBuffer('image/jpeg', { quality: 0.75 });

  // Resized 50% scale
  const canvasResized = createCanvas(200, 150);
  const ctxResized = canvasResized.getContext('2d');
  ctxResized.drawImage(canvasA, 0, 0, 200, 150);
  const pngResized = canvasResized.toBuffer('image/png');

  // Completely different image (Orange with dark circle)
  const canvasOther = createCanvas(400, 300);
  const ctxOther = canvasOther.getContext('2d');
  ctxOther.fillStyle = '#e67e22';
  ctxOther.fillRect(0, 0, 400, 300);
  ctxOther.fillStyle = '#2c3e50';
  ctxOther.beginPath();
  ctxOther.arc(200, 150, 100, 0, Math.PI * 2);
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
  console.log('✓ Perceptual hash invariance passed.');

  console.log('\n--- All Image Guard Tests Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
