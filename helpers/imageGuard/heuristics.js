/**
 * Heuristics and regex patterns for detecting Discord image scams (Nitro, Steam, Crypto, QR phishing).
 */

const SCAM_PHRASES = [
  // Discord Nitro scams
  /discord\s*(nitro)?\s*(for\s*free|free\s*nitro|3\s*months?|giveaway|gift|airdrop)/i,
  /free\s*discord\s*nitro/i,
  /who\s*wants\s*(free\s*)?nitro/i,
  /first\s*(one\s*)?to\s*claim\s*gets/i,
  /nitro\s*generator/i,

  // Steam gift card scams
  /steam\s*(gift\s*card|\$50|\$100|wallet|trade\s*offer)/i,
  /\$100\s*steam/i,
  /\$50\s*steam/i,

  // QR Code phishing
  /qr\s*(code)?\s*.*(claim|login|verify|reward|nitro|gift)/i,
  /qr\s*(code)?\s*.*(discord|camera|phone|app)/i,
  /(scan|use)\s*(this\s*)?qr/i,

  // Crypto Casino & Influencer Giveaways (e.g. MrBeast casino scam)
  /crypto(currency)?\s*casino/i,
  /giving\s*a?wa[y|v]\s*\$[0-9,]+/i,
  /giving\s*away/i,
  /with?draw\s*(the\s*)?bonus/i,
  /play\s*or\s*with?draw/i,
  /receive\s*(your\s*)?\$[0-9,]+/i,
  /\$[0-9,]+\s*bonus/i,
  /promo\s*c[oa0]de/i,
  /claim\s*(your\s*)?(reward|bonus|nitro|crypto|funds|gift|steam)/i,
  /deleted\s*(one|1)\s*hour\s*after/i,
  /only\s*the\s*fastest/i,
  /mrbeast.*(casino|giveaway|\$[0-9,]+|bonus|promo|reward)/i,
  /ruakax\.[a-z]{2,}/i,

  // Game testing scams
  /test\s*my\s*(new\s*)?game\s*(and\s*get|for|\$)/i
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
