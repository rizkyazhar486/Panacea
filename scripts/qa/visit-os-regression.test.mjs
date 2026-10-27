import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Strict Regression Guard: Canonical VisitOS must re-export clinical VisitOS without synthetic stubs', () => {
  const content = fs.readFileSync('src/pages/VisitOS.tsx', 'utf8');
  
  // Must be clean re-export or mount the true clinical module
  const isReExport = content.includes("export * from './clinical/VisitOS'") && content.includes("export { default } from './clinical/VisitOS'");
  const isClinicalMount = content.includes('VisitCommandCenter') && content.includes('deriveEncounterOutcomeJob');
  
  assert.ok(
    isReExport || isClinicalMount,
    'Canonical VisitOS.tsx has been illegally replaced with a synthetic demonstration stub!'
  );
  
  // Must fail if synthetic arrival/mock buttons are present in canonical entry
  assert.strictEqual(
    content.includes('Initialize Synthetic Encounter (PAT-SYNTH-001)'),
    false,
    'Synthetic mock buttons are forbidden in the canonical VisitOS entry point.'
  );
});
