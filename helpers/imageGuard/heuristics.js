/**
 * Heuristics and regex patterns for detecting Discord image scams (Nitro, Steam, Crypto, QR phishing).
 */

const SCAM_PHRASES = [
  /discord\s*(nitro)?\s*(for\s*free|free\s*nitro|3\s*months?|giveaway|gift|airdrop)/i,
  /free\s*discord\s*nitro/i,
  /claim\s*(your\s*)?(nitro|steam\s*gift|airdrop|reward|free)/i,
  /steam\s*(gift\s*card|\$50|\$100|wallet|trade\s*offer)/i,
  /\$100\s*steam/i,
  /\$50\s*steam/i,
  /qr\s*(code)?\s*.*(claim|login|verify|reward|nitro|gift)/i,
  /qr\s*(code)?\s*.*(discord|camera|phone|app)/i,
  /(scan|use)\s*(this\s*)?qr/i,
  /test\s*my\s*(new\s*)?game\s*(and\s*get|for|\$)/i,
  /who\s*wants\s*(free\s*)?nitro/i,
  /first\s*(one\s*)?to\s*claim\s*gets/i,
  /nitro\s*generator/i
];

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

/**
 * Analyzes extracted OCR text for scam indicators.
 * @param {string} text
 * @returns {{ isScam: boolean, matchedPatterns: string[], confidence: number }}
 */
function analyzeText(text) {
  if (!text || typeof text !== 'string') {
    return { isScam: false, matchedPatterns: [], confidence: 0 };
  }

  const cleaned = text.toLowerCase().replace(/\s+/g, ' ');
  const matchedPatterns = [];

  for (const regex of SCAM_PHRASES) {
    if (regex.test(cleaned)) {
      matchedPatterns.push(`Phrase: ${regex.toString()}`);
    }
  }

  for (const regex of SUSPICIOUS_DOMAINS) {
    if (regex.test(cleaned)) {
      matchedPatterns.push(`Domain: ${regex.toString()}`);
    }
  }

  const isScam = matchedPatterns.length > 0;
  const confidence = Math.min(1.0, matchedPatterns.length * 0.4);

  return {
    isScam,
    matchedPatterns,
    confidence
  };
}

module.exports = {
  analyzeText
};
