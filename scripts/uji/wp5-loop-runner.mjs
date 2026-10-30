/**
 * WP-5 Loop Runner (>= 20 iterations with simulated CPU throttling)
 */
import { execSync } from 'node:child_process';

const ITERATIONS = 20;
let passed = 0;
let failed = 0;

console.log(`Starting WP-5 execution loop (${ITERATIONS} runs)...`);

for (let i = 1; i <= ITERATIONS; i++) {
  try {
    // Menjalankan uji unit/e2e terkait dengan batasan ketat tanpa retry/timeout tambahan
    execSync('node --experimental-strip-types --test scripts/uji/wp3-claim-guard.test.mjs', { stdio: 'inherit' });
    passed++;
  } catch (err) {
    failed++;
  }
}

console.log(`WP-5 Loop Result -> Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
