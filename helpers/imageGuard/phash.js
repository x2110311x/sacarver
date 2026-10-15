const { createCanvas, loadImage } = require('canvas');

const SAMPLE_SIZE = 32;
const HASH_SIZE = 8; // 8x8 = 64 bits

// Precompute DCT cosine lookup tables for performance
const cosTable = [];
for (let u = 0; u < HASH_SIZE; u++) {
  cosTable[u] = [];
  for (let x = 0; x < SAMPLE_SIZE; x++) {
    cosTable[u][x] = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * SAMPLE_SIZE));
  }
}

/**
 * Computes a 64-bit perceptual hash (pHash) from an image buffer using 2D DCT.
 * @param {Buffer} buffer
 * @returns {Promise<string>} 64-character binary string (e.g. '10101100...')
 */
async function computePHash(buffer) {
  const img = await loadImage(buffer);
  const canvas = createCanvas(SAMPLE_SIZE, SAMPLE_SIZE);
  const ctx = canvas.getContext('2d');

  // Draw and downscale image to 32x32
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const imgData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;

  // Compute 32x32 grayscale luminance matrix
  const matrix = [];
  for (let y = 0; y < SAMPLE_SIZE; y++) {
    matrix[y] = [];
    for (let x = 0; x < SAMPLE_SIZE; x++) {
      const idx = (y * SAMPLE_SIZE + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      matrix[y][x] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
  }

  // Compute 2D DCT for the top 8x8 low frequencies
  const dct = [];
  const coefficients = [];

  for (let u = 0; u < HASH_SIZE; u++) {
    dct[u] = [];
    for (let v = 0; v < HASH_SIZE; v++) {
      let sum = 0;
      for (let x = 0; x < SAMPLE_SIZE; x++) {
        const cosX = cosTable[u][x];
        for (let y = 0; y < SAMPLE_SIZE; y++) {
          sum += matrix[y][x] * cosX * cosTable[v][y];
        }
      }
      const alphaU = u === 0 ? 1 / Math.sqrt(SAMPLE_SIZE) : Math.sqrt(2 / SAMPLE_SIZE);
      const alphaV = v === 0 ? 1 / Math.sqrt(SAMPLE_SIZE) : Math.sqrt(2 / SAMPLE_SIZE);
      const val = alphaU * alphaV * sum;
      dct[u][v] = val;
      // Exclude DC component (0,0) from median calculation
      if (u !== 0 || v !== 0) {
        coefficients.push(val);
      }
    }
  }

  // Calculate median of 63 AC coefficients
  const sorted = [...coefficients].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Generate 64-bit binary string
  let hash = '';
  for (let u = 0; u < HASH_SIZE; u++) {
    for (let v = 0; v < HASH_SIZE; v++) {
      hash += dct[u][v] > median ? '1' : '0';
    }
  }

  return hash;
}

/**
 * Calculates the Hamming distance between two binary hash strings.
 * @param {string} hash1
 * @param {string} hash2
 * @returns {number} Number of differing bits (0 to 64)
 */
function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return 64;
  }
  let diff = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) diff++;
  }
  return diff;
}

/**
 * Converts a 64-bit binary string to a 16-character hex string.
 * @param {string} binary
 * @returns {string}
 */
function binaryToHex(binary) {
  let hex = '';
  for (let i = 0; i < binary.length; i += 4) {
    hex += parseInt(binary.substring(i, i + 4), 2).toString(16);
  }
  return hex;
}

/**
 * Converts a 16-character hex string to a 64-bit binary string.
 * @param {string} hex
 * @returns {string}
 */
function hexToBinary(hex) {
  let binary = '';
  for (let i = 0; i < hex.length; i++) {
    binary += parseInt(hex[i], 16).toString(2).padStart(4, '0');
  }
  return binary;
}

module.exports = {
  computePHash,
  hammingDistance,
  binaryToHex,
  hexToBinary
};
