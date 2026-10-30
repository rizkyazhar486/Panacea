import fs from 'node:fs';
import { execSync } from 'node:child_process';

try {
  const prsJson = execSync('gh pr list --state open --json number,title,headRefName,state,headRefOid', { encoding: 'utf8' });
  fs.writeFileSync('governance/OPEN_PR_TRIAGE.json', prsJson);
  console.log('Successfully updated governance/OPEN_PR_TRIAGE.json from live GitHub state.');
} catch (err) {
  console.error('Failed to update triage JSON:', err);
  process.exit(1);
}
