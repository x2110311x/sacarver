/**
 * Heuristics and regex patterns for detecting Discord image scams (Nitro, Steam, Crypto, QR phishing).
 */

// Suspicious phishing domains (High confidence, weight: 0.8)
const SUSPICIOUS_DOMAINS = [
  /discor[cl]/i,
  /dlscord/i,
  /disco-rd/i,
  /discord[a-z0-9-]*\.(gift|link|xyz|top|ru|click|shop|fun|site|info|icu|space)/i,
  /steamcommun[il1]{2,}ty/i,
  /steancommunity/i,
  /steam-gift/i,
  /steam[a-z0-9-]*\.(gift|trade|xyz|top|ru|link)/i,
  /nitro-[a-z0-9-]+\.[a-z]{2,}/i
];

// Definitive high-confidence scam signatures (Weight: 0.8)
const HIGH_CONFIDENCE_PHRASES = [
  /discord\s*(nitro)?\s*(for\s*free|free\s*nitro|3\s*months?|giveaway|gift|airdrop)/i,
  /free\s*discord\s*nitro/i,
  /nitro\s*generator/i,
  /steam\s*(gift\s*card|\$50|\$100|wallet|trade\s*offer)/i,
  /\$(50|100)\s*steam/i,
  /crypto(currency)?\s*casino/i,
  /mrbeast.*(casino|giveaway|\$[0-9,]+|bonus|promo|reward)/i,
  /ruakax\.[a-z]{2,}/i,
  /test\s*my\s*(new\s*)?game\s*(and\s*get|for|\$)/i
];

// Contextual / medium-confidence phrases (Weight: 0.4)
// Requires at least two correlating indicators to trigger an alert on its own
const CONTEXTUAL_PHRASES = [
  // QR Code phishing (bounded proximity and word boundaries)
  /\bqr\s*(?:code)?\b.{0,50}\b(claim|login|verify|reward|nitro|gift)\b/i,
  /\b(?:scan|use)\b.{0,30}\b(?:this\s*)?qr\b/i,
  /\bqr\s*(?:code)?\b.{0,50}\b(discord|camera|phone|mobile)\b/i,
  /\b(?:discord|camera|phone|mobile)\b.{0,50}\bqr\s*(?:code)?\b/i,
  /\b(?:scan|open)\b.{0,40}\bqr\b.{0,40}\b(?:app|camera|discord)\b/i,

  // Discord Nitro giveaways & claims
  /\bwho\s*wants\s*(?:free\s*)?nitro\b/i,
  /\bfirst\s*(?:one\s*)?to\s*claim\s*gets\b/i,

  // Financial & giveaway incentives
  /\bgiving\s*a?wa[y|v]\s*\$[0-9,]+/i,
  /\bwith?draw\s*(?:the\s*)?bonus\b/i,
  /\bplay\s*or\s*with?draw\b/i,
  /\breceive\s*(?:your\s*)?\$[0-9,]+\b/i,
  /\$[0-9,]+\s*bonus\b/i,
  /\bpromo\s*c[oa0]de\b/i,
  /\bclaim\s*(?:your\s*)?(?:reward|bonus|nitro|crypto|funds|gift|steam|wallet(?:\s*code)?)\b/i,
  /\bdeleted\s*(?:one|1)\s*hour\s*after\b/i,
  /\bonly\s*the\s*fastest\b/i
];

/**
 * Checks if extracted text is likely OCR hallucination/noise on non-text imagery.
 * When Tesseract runs on photos, backgrounds, or inverted graphics, it produces
 * thousands of isolated 1-2 character fragments with virtually no valid words.
 * @param {string} text
 * @returns {boolean}
 */
function isNoiseText(text) {
  if (!text || text.length < 500) return false;

  const tokens = text.trim().split(/\s+/);
  if (tokens.length < 40) return false;

  // Count tokens that look like legitimate English words (>= 3 alpha characters)
  const readableWords = tokens.filter(t => /^[a-zA-Z]{3,}$/.test(t));
  const readableRatio = readableWords.length / tokens.length;

  // If text is large (> 500 chars) and less than 20% of tokens are readable words, it is noise
  return readableRatio < 0.20;
}

/**
 * Analyzes extracted OCR text for scam indicators with tiered weighted scoring.
 * @param {string} text
 * @param {number} [minConfidence=0.7] Minimum confidence threshold to classify as scam
 * @returns {{ isScam: boolean, matchedPatterns: string[], confidence: number, isNoise: boolean }}
 */
function analyzeText(text, minConfidence = 0.7) {
  if (!text || typeof text !== 'string') {
    return { isScam: false, matchedPatterns: [], confidence: 0, isNoise: false };
  }

  // Reject hallucinated OCR noise from non-text images
  if (isNoiseText(text)) {
    return { isScam: false, matchedPatterns: [], confidence: 0, isNoise: true };
  }

  const cleaned = text.toLowerCase().replace(/\s+/g, ' ');
  const matchedPatterns = [];
  let score = 0;

  // 1. High confidence domains (weight: 0.8)
  for (const regex of SUSPICIOUS_DOMAINS) {
    if (regex.test(cleaned)) {
      matchedPatterns.push(`Domain: ${regex.toString()}`);
      score += 0.8;
    }
  }

  // 2. High confidence phrases (weight: 0.8)
  for (const regex of HIGH_CONFIDENCE_PHRASES) {
    if (regex.test(cleaned)) {
      matchedPatterns.push(`Phrase (High): ${regex.toString()}`);
      score += 0.8;
    }
  }

  // 3. Contextual phrases (weight: 0.4)
  for (const regex of CONTEXTUAL_PHRASES) {
    if (regex.test(cleaned)) {
      matchedPatterns.push(`Phrase (Contextual): ${regex.toString()}`);
      score += 0.4;
    }
  }

  const confidence = Math.min(1.0, Math.round(score * 100) / 100);
  const isScam = confidence >= minConfidence;

  return {
    isScam,
    matchedPatterns,
    confidence,
    isNoise: false
  };
}

module.exports = {
  analyzeText,
  isNoiseText,
  SUSPICIOUS_DOMAINS,
  HIGH_CONFIDENCE_PHRASES,
  CONTEXTUAL_PHRASES
};
