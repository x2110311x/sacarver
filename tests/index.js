const { fork } = require('child_process');
const path = require('path');

const testSuites = [
  { name: 'Image Guard Suite', path: 'imageGuard.test.js' },
  { name: 'Attachment Cache Suite', path: 'attachmentCache.test.js' },
  { name: 'Slash Commands Validation', path: 'commands.test.js' },
  { name: 'Event Handlers Validation', path: 'events.test.js' },
  { name: 'Config Template Validation', path: 'config.test.js' },
  { name: 'Helper Functions Suite', path: 'helpers.test.js' }
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
  const startTime = Date.now();
  console.log(`\n========================================`);
  console.log(`Starting Sacarver Test Runner (${testSuites.length} suites)`);
  console.log(`========================================`);

  for (const suite of testSuites) {
    try {
      await runSuite(suite);
    } catch (err) {
      console.error(`\n❌ ${err.message}`);
      process.exit(1);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n========================================`);
  console.log(`🎉 All ${testSuites.length} test suites passed in ${duration}s!`);
  console.log(`========================================\n`);
}

main();
