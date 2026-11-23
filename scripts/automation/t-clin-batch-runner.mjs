import { execSync } from 'node:child_process';
import fs from 'node:fs';

console.log('🚀 PanaceaMed T-CLIN Batch Runner (T-CLIN-131..140) Initialized');
try {
  const branch = 'feat/t-clin-131-140-batch';
  console.log(`🌿 Ensuring branch ${branch}...`);
  execSync(`git checkout -b ${branch} 2>/dev/null || git checkout ${branch}`, { stdio: 'inherit' });
  console.log('✅ Branch ready. Ready to generate and commit T-CLIN modules.');
} catch (e) {
  console.error('❌ Runner error:', e.message);
  process.exit(1);
}
