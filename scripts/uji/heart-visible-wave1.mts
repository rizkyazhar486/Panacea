import assert from 'node:assert/strict';
import { CARDIO_PARTS } from '../../src/lib/cardioAtlas.gen.ts';
import {
  auditHeartVisibleCoverage,
  summarizeHeartVisibleCoverage,
} from '../../src/lib/anatomy/heartVisibleWave1.ts';

const report = summarizeHeartVisibleCoverage();
const byId = Object.fromEntries(auditHeartVisibleCoverage().map((item) => [item.id, item]));

assert.equal(report.sourcePartCount, CARDIO_PARTS.length);
assert.equal(report.verifiedCompleteClaimAllowed, false);
assert.ok(report.requirements >= 30);

// Current cardio.glb must retain its core source-derived heart/great-vessel coverage.
for (const id of [
  'ra-cavity',
  'la-cavity',
  'rv-cavity',
  'lv-cavity',
  'mitral',
  'tricuspid',
  'aortic',
  'pulmonary',
  'ascending-aorta',
  'aortic-arch',
  'pulmonary-trunk',
  'pulmonary-arteries',
  'vena-cavae',
  'coronary-trunks',
  'lad',
  'lcx',
  'coronary-sinus',
]) {
  assert.equal(byId[id]?.status, 'present', `${id} must remain exact-source present`);
  assert.ok((byId[id]?.matchedSourceNames.length ?? 0) > 0, `${id} must expose exact source names`);
  assert.ok((byId[id]?.triangleCount ?? 0) > 0, `${id} must retain source triangles`);
}

// These are known gaps of the current cardio generator. Guard them as gaps rather
// than allowing a UI or future refactor to silently imply that geometry exists.
for (const id of ['chordae', 'interatrial-septum', 'interventricular-septum', 'pericardium', 'endocardium', 'epicardium']) {
  assert.equal(byId[id]?.status, 'absent', `${id} must remain explicitly absent until exact source geometry is ingested`);
  assert.deepEqual(byId[id]?.matchedSourceNames, []);
}

for (const id of ['sa-node', 'av-node', 'his-purkinje']) {
  assert.equal(byId[id]?.status, 'conceptual-only');
  assert.deepEqual(byId[id]?.matchedSourceNames, []);
}

assert.equal(report.grossComplete, false);
assert.ok(report.missingGrossStructureIds.includes('chordae'));
assert.ok(report.missingGrossStructureIds.includes('interventricular-septum'));
assert.ok(report.missingGrossStructureIds.includes('pericardium'));

// No fuzzy names: every surfaced source name must be an exact entry from the generated atlas.
const exactNames = new Set(CARDIO_PARTS.map((part) => part.name));
for (const item of report.results) {
  for (const sourceName of item.matchedSourceNames) assert.ok(exactNames.has(sourceName));
}

console.log(
  `heart-visible-wave1: ${report.sourcePartCount} source parts; ` +
  `${report.counts.present} present, ${report.counts.partial} partial, ` +
  `${report.counts.absent} absent, ${report.counts['conceptual-only']} conceptual-only`,
);
