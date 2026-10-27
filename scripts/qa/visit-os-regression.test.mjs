import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Strict Regression Guard: Canonical VisitOS must re-export clinical VisitOS', () => {
  const content = fs.readFileSync('src/pages/VisitOS.tsx', 'utf8');
  const isReExport = content.includes("export * from './clinical/VisitOS'") && content.includes("export { default } from './clinical/VisitOS'");
  const isClinicalMount = content.includes('VisitCommandCenter') && content.includes('deriveEncounterOutcomeJob');
  
  assert.ok(
    isReExport || isClinicalMount,
    'Canonical VisitOS.tsx has been illegally replaced with a synthetic demonstration stub!'
  );
  
  assert.strictEqual(
    content.includes('Initialize Synthetic Encounter (PAT-SYNTH-001)'),
    false,
    'Synthetic mock buttons are forbidden in the canonical VisitOS entry point.'
  );
});

test('Negative Mutation Guard: Replacing VisitOS with a mock stub fails the regression check', () => {
  const original = fs.readFileSync('src/pages/VisitOS.tsx', 'utf8');
  try {
    // Mutate temporarily to simulate stub replacement regression
    fs.writeFileSync('src/pages/VisitOS.tsx', 'export default function MockStub() { return <div>Mock</div>; }');
    const mutated = fs.readFileSync('src/pages/VisitOS.tsx', 'utf8');
    const isValid = (mutated.includes("export * from './clinical/VisitOS'") && mutated.includes("export { default } from './clinical/VisitOS'")) || (mutated.includes('VisitCommandCenter') && mutated.includes('deriveEncounterOutcomeJob'));
    assert.strictEqual(isValid, false, 'Mutated mock stub must fail canonical VisitOS validation');
  } finally {
    // Restore original canonical re-export immediately
    fs.writeFileSync('src/pages/VisitOS.tsx', original);
  }
});
