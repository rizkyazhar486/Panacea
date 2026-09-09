import assert from 'node:assert/strict';
import {
  EYE_ATLAS_WAVE1,
  EYE_WAVE1_REQUIRED_IDS,
  validateEyeAtlasWave1,
} from '../../src/lib/anatomy/eyeAtlasWave1.ts';

assert.deepEqual(validateEyeAtlasWave1(), []);
assert.ok(EYE_ATLAS_WAVE1.length >= 50, 'Wave 1 must be a real eye-system inventory, not a token organ card.');

const byId = new Map(EYE_ATLAS_WAVE1.map((item) => [item.id, item]));
for (const id of EYE_WAVE1_REQUIRED_IDS) assert.ok(byId.has(id), `missing required eye structure: ${id}`);

for (const item of EYE_ATLAS_WAVE1) {
  assert.equal(item.reviewStatus, 'academic-review-pending');
  assert.ok(item.evidenceAnchor.startsWith('NCBI:'), `unscoped evidence anchor: ${item.id}`);
}

for (const id of ['corneal-epithelium', 'corneal-stroma', 'corneal-endothelium', 'photoreceptors', 'rods', 'cones', 'bipolar-cells', 'horizontal-cells', 'amacrine-cells', 'ganglion-cells']) {
  const item = byId.get(id)!;
  assert.equal(item.geometryStatus, 'reference-only', `${id} must not pretend gross 3D source geometry exists`);
}

for (const id of ['macula', 'fovea', 'optic-disc', 'trabecular-meshwork', 'central-retinal-artery', 'central-retinal-vein']) {
  assert.equal(byId.get(id)?.geometryStatus, 'reference-only', `${id} needs exact provenance-bearing geometry before promotion`);
}

assert.equal(byId.get('pupil')?.notes, 'An aperture, not a tissue mesh.');
assert.equal(byId.get('optic-nerve')?.representation, 'neural-pathway');
assert.equal(byId.get('aqueous-humor')?.representation, 'fluid-flow');
assert.equal(byId.get('retinal-pigment-epithelium')?.representation, 'histology');

const bad = EYE_ATLAS_WAVE1.map((item) => ({ ...item }));
bad[0] = { ...bad[0], evidenceAnchor: '' };
assert.ok(validateEyeAtlasWave1(bad).includes(`evidence:${bad[0].id}`));

console.log(`eye-atlas-wave1: ok (${EYE_ATLAS_WAVE1.length} structures)`);
