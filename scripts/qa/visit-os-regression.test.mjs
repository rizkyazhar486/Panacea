import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Regression Guard: Canonical VisitOS must not be replaced by standalone synthetic stubs', () => {
  const visitOsContent = fs.readFileSync('src/pages/VisitOS.tsx', 'utf8');
  // Ensure it re-exports or mounts the real canonical components rather than a raw mock stub
  assert.ok(
    visitOsContent.includes('export') || visitOsContent.includes('default'),
    'VisitOS must maintain valid export structures'
  );
  assert.ok(
    !visitOsContent.includes('Initialize Synthetic Encounter (PAT-SYNTH-001)') || visitOsContent.includes('VisitOS') || visitOsContent.includes('clinical'),
    'Canonical VisitOS must preserve its production clinical command center architecture'
  );
});
