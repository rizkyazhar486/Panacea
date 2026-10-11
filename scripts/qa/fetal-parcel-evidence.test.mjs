import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateFetalParcelEvidence } from './fetal-parcel-evidence.mjs';
const read = (name) => JSON.parse(fs.readFileSync(new URL(`../../bodyexposure/qa_reports/${name}.json`, import.meta.url)));
const audit = read('fetal_parcels_audit');
const blender = read('fetal_parcels_blender');
test('nine anonymous source regions agree across Python and Blender', () => {
  assert.deepEqual(validateFetalParcelEvidence(audit, blender), {
    regions: 9, triangles: 115276, runtimeAdmission: 'blocked_label_identity_unresolved',
  });
});
for (const [name, mutate, error] of [
  ['clinical promotion', (a) => { a.clinical_validation = 'validated'; }, /pending boundary/],
  ['guessed anatomy name', (a) => { a.regions[0].anatomical_name = 'Superior lobe'; }, /anonymous/],
  ['lost source voxels', (a) => { a.regions[0].voxels += 1; }, /every source voxel/],
  ['duplicate region', (a) => { a.regions[1] = structuredClone(a.regions[0]); }, /unique anonymous/],
  ['missing source hash', (a) => { a.source_sha256 = {}; }, /provenance/],
  ['nonmanifold mesh', (a, b) => { b.regions[0].nonmanifold_edges = 1; }, /closed surfaces/],
  ['unit conversion error', (a, b) => { b.regions[0].volume_m3 *= 1000; }, /volume agreement/],
  ['missing region', (a) => { a.regions.pop(); }, /all nine/],
]) test(`rejects ${name}`, () => {
  const a = structuredClone(audit), b = structuredClone(blender);
  mutate(a, b);
  assert.throws(() => validateFetalParcelEvidence(a, b), error);
});
