import { seedDatabase } from './seed.js';

console.log('[Demo Reset] Resetting BloodConnect demo environment to baseline state...');
seedDatabase({ disconnectOnDone: true })
  .then(() => {
    console.log('[Demo Reset] Reset finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Demo Reset Error]', err);
    process.exit(1);
  });
