const fs = require('fs');
const { fork } = require('child_process');
const path = require('path');

const configPath = path.resolve(__dirname, '../config.json');
const exampleConfigPath = path.resolve(__dirname, '../config.example.json');
let tempConfigCreated = false;

function ensureConfigExists() {
  if (!fs.existsSync(configPath) && fs.existsSync(exampleConfigPath)) {
    fs.copyFileSync(exampleConfigPath, configPath);
    tempConfigCreated = true;
    console.log('ℹ️  Created temporary config.json from config.example.json for testing.');
  }
}

function cleanupTempConfig() {
  if (tempConfigCreated && fs.existsSync(configPath)) {
    try {
      fs.unlinkSync(configPath);
      console.log('ℹ️  Cleaned up temporary config.json.');
    } catch (_err) {
      // ignore
    }
    tempConfigCreated = false;
  }
}

process.on('exit', cleanupTempConfig);
process.on('SIGINT', () => { cleanupTempConfig(); process.exit(1); });
process.on('SIGTERM', () => { cleanupTempConfig(); process.exit(1); });

const testSuites = [
  { name: 'Image Guard Suite', path: 'imageGuard.test.js' },
  { name: 'Attachment Cache Suite', path: 'attachmentCache.test.js' },
  { name: 'Slash Commands Validation', path: 'commands.test.js' },
  { name: 'Event Handlers Validation', path: 'events.test.js' },
  { name: 'Config Template Validation', path: 'config.test.js' },
  { name: 'Helper Functions Suite', path: 'helpers.test.js' },
  { name: 'Staff Note System Suite', path: 'notes.test.js' }
];

async function runSuite(suite) {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(__dirname, suite.path);
    console.log(`\n========================================`);
    console.log(`RUNNING: ${suite.name} (${suite.path})`);
    console.log(`========================================`);

    const child = fork(fullPath, [], { stdio: 'inherit' });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Suite "${suite.name}" failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  ensureConfigExists();
  const startTime = Date.now();
  console.log(`\n========================================`);
  console.log(`Starting Sacarver Test Runner (${testSuites.length} suites)`);
  console.log(`========================================`);

  try {
    for (const suite of testSuites) {
      await runSuite(suite);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n========================================`);
    console.log(`🎉 All ${testSuites.length} test suites passed in ${duration}s!`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  } finally {
    cleanupTempConfig();
  }
}

main();
