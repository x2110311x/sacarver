# Sacarver

[![Node.js CI](https://github.com/x2110311x/sacarver/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/x2110311x/sacarver/actions/workflows/pr-checks.yml)
[![Node Version](https://img.shields.io/badge/node-lts-brightgreen.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)](https://discord.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Custom Discord bot written for the **[r/twentyonepilots](https://reddit.com/r/twentyonepilots)** Discord community ([discordclique.com](https://discordclique.com)), providing automated scam defense, honeypot protection, media/message caching, moderation audit logging, and community utilities.

---

## 🌟 Key Features

### 🛡️ ImageGuard (Automated Scam Image Detection)
- **2D DCT Perceptual Hashing (pHash)**: Converts images into 64-bit perceptual hashes invariant to resizing, recompression, and minor watermarking. Compares incoming images against verified scam hashes using bitwise Hamming Distance.
- **OCR Heuristic Analysis**: Integrates with a local OCR microservice to extract and evaluate image text against known scam patterns (fake Discord Nitro gifts, Steam wallet giveaways, compromised casino promotions, QR phishing).
- **Automated Moderation & Quarantine**: Supports automated banning on exact pHash matches (distance = 0) and staff review escalation (`scamLog` / `chatModeration`) for close matches and flagged keywords.

### 🍯 Honeypot Channel Protection
- Monitors decoy channels to immediately intercept and eliminate automated scam bots.
- Downloads and preserves scam image buffers **before** triggering message deletion.
- Sends an informative ban DM to the offender with ban appeal instructions.
- Purges message history, bans the account, logs audit notes to the database, and syncs honeypot ban counters in the channel topic.

### 📦 Redis-Backed Attachment & Message Caching
- Stores raw binary buffers and message metadata in Redis with configurable TTL.
- Solves Discord's ephemeral CDN URL expiration (`ex`, `is`, `hm` query parameters) by serving cached attachment buffers directly when rendering deletion logs.
- Preserves deleted message content, authors, timestamps, and media for audit trails.

### 📝 Comprehensive Audit & Moderation Logging
- Detailed logging embeds for message deletions, bulk deletions, message edits, ban events, voice channel movements, member nickname updates, and join/leave events.
- Direct-message forwarding workflow: prompts users sending DMs to the bot with interactive button/text confirmation before forwarding messages to staff channels.

### ⚡ Slash Commands (`/fun`, `/staff`, `/utility`)
- Modular slash command suites built with Discord.js builders.
- Staff commands for moderation (`/staff ban`, `/staff note`, `/staff scamimage`, `/staff sethoneybans`, `/staff pfp`).
- Utility commands (`/utility ping`, `/utility color`, `/utility uptime`, `/utility info`).
- Fun community interactions (`/fun 8ball`, `/fun fitcheck`, `/fun hackerman`, `/fun mock`, `/fun roll`).

---

## 🏗️ Architecture & Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | Node.js (LTS) | Core asynchronous bot execution |
| **Framework** | Discord.js (v14) | Discord API gateway, events, and slash commands |
| **Database** | MariaDB + Sequelize ORM | Persistent storage for notes, scam hashes, and bans |
| **Cache** | Redis 6.2 | Fast in-memory message and binary attachment caching |
| **OCR Service** | `otiai10/ocrserver` | Tesseract-based OCR microservice for image text extraction |
| **Logging** | Winston + Winston-Loki | Structured application logging with daily rotation |
| **Containerization** | Docker & Docker Compose | Multi-container stack (`bot`, `db`, `redis`, `ocr`, `adminer`) |

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/) (recommended), OR
- [Node.js LTS](https://nodejs.org/) (v18 or v20+)
- MariaDB / MySQL server
- Redis server

### 1. Clone & Configure

```bash
git clone https://github.com/x2110311x/sacarver.git
cd sacarver_js
```

Copy the example configuration files:
```bash
cp config.example.json config.json
cp .env.example .env
```

Edit `config.json` with your Discord credentials, guild ID, role IDs, channel IDs, and database settings:
```json
{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "guildID": "YOUR_GUILD_ID",
  "clientID": "YOUR_CLIENT_APP_ID",
  "roles": {
    "staff": "ROLE_ID",
    "newMember": "ROLE_ID",
    "vc": "ROLE_ID"
  },
  "channels": {
    "deleteLog": "CHANNEL_ID",
    "scamLog": "CHANNEL_ID",
    "honeypot": "CHANNEL_ID",
    "banLog": "CHANNEL_ID"
  },
  "imageGuard": {
    "enabled": true,
    "mode": "review",
    "ocrUrl": "http://ocr:8080/file",
    "hammingThreshold": 8,
    "autoBanExactMatch": true,
    "banAppealUrl": "https://bans.discordclique.com"
  }
}
```

Edit `.env` for database credentials and container variables:
```env
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=sacarver
MYSQL_USER=sacarver
MYSQL_PASSWORD=your_password
MYSQL_HOST=db
MYSQL_PORT=3306
```

### 2. Running with Docker Compose

Launch the complete stack (bot, MariaDB, Redis, OCR server, Adminer):
```bash
docker compose up -d
```

View live logs:
```bash
docker compose logs -f bot
```

> [!NOTE]
> **Automatic Command Deployment**: Slash commands are automatically registered and synchronized with Discord on bot startup (during `clientReady`). You do not need to run a deployment script beforehand.

### 3. Running Locally for Development

```bash
# 1. Install system dependencies for node-canvas (Ubuntu/Debian)
sudo apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# 2. Install npm dependencies
npm install

# 3. Run test suite
npm test

# 4. Start the bot
npm start
```

---

## 🛠️ Available Scripts

| Command | Script Path | Description |
| :--- | :--- | :--- |
| `npm test` | `node tests/index.js` | Runs all automated test suites (pHash, cache, commands, events, config, helpers) |
| `npm run lint` | `eslint . --ext .js` | Runs ESLint static analysis across the codebase |
| `npm run deploy` | `node scripts/deploy.js` | *(Debugging)* Manually forces slash command registration to Discord without starting the bot |
| `npm run remove` | `node scripts/remove.js` | *(Debugging)* Clears registered slash commands from Discord |
| `npm run update` | `source ./scripts/update.sh` | Pulls latest git commits, regenerates models, and rebuilds containers |
| `npm run generateDB` | `source ./scripts/generateDBModels.sh` | Regenerates Sequelize models from the active database schema |

---

## 🧪 Testing & CI Checks

Pull requests are automatically tested via GitHub Actions (`.github/workflows/pr-checks.yml`).

Before submitting a PR, verify that your changes pass linting and unit tests:
```bash
# Run linting check
npm run lint

# Run all test suites
npm test
```

### Test Suites Included:
- **`tests/imageGuard.test.js`**: Perceptual hash calculation, hex/binary conversions, Hamming distance accuracy, and OCR regex heuristics.
- **`tests/attachmentCache.test.js`**: Redis binary buffer caching fidelity, TTL enforcement, error recovery, and attachment retrieval.
- **`tests/commands.test.js`**: Validates slash command data schemas, subcommands, and Discord API JSON serialization.
- **`tests/events.test.js`**: Validates event handler exports and Discord event bindings.
- **`tests/config.test.js`**: Validates example configuration templates and prevents credential leakage.
- **`tests/helpers.test.js`**: Validates bot status updates, version detection, and heuristic edge cases.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
