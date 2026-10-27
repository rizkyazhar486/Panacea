import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Pure canonical validation function using standard JavaScript parameter syntax
function validateCanonicalVisitOsContent(content) {
  const isReExport = content.includes("export * from './clinical/VisitOS'") && content.includes("export { default } from './clinical/VisitOS'");
  const isClinicalMount = content.includes('VisitCommandCenter') && content.includes('deriveEncounterOutcomeJob');
  const hasSyntheticStub = content.includes('Initialize Synthetic Encounter (PAT-SYNTH-001)');
  return (isReExport || isClinicalMount) && !hasSyntheticStub;
}

test('Production Canonical VisitOS: Actual file must satisfy canonical validation', () => {
  const productionContent = fs.readFileSync('src/pages/VisitOS.tsx', 'utf8');
  assert.strictEqual(
    validateCanonicalVisitOsContent(productionContent),
    true,
    'Production src/pages/VisitOS.tsx failed canonical validation'
  );
});

test('Pure Validator: Accepts authentic canonical re-export without synthetic stubs', () => {
  const validContent = "export * from './clinical/VisitOS'\nexport { default } from './clinical/VisitOS'\n";
  assert.strictEqual(validateCanonicalVisitOsContent(validContent), true);
});

test('Pure Validator: Rejects synthetic mock replacement stubs', () => {
  const mockStub = "export default function MockStub() { return <div>Initialize Synthetic Encounter (PAT-SYNTH-001)</div>; }";
  assert.strictEqual(validateCanonicalVisitOsContent(mockStub), false);
});
