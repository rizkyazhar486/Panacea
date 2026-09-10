import assert from 'node:assert/strict';
import {
  discoverHeartGapCandidates,
  summarizeHeartGapDiscovery,
} from '../../src/lib/anatomy/heartSourceGapDiscovery.ts';

const sourceNames = [
  'Chordae tendineae',
  'Interatrial septum',
  'Interventricular septum',
  'Fibrous pericardium',
  'Endocardium',
  'Epicardium',
  'possible chordae tendineae fragment',
  'SA node approximation',
];

const report = summarizeHeartGapDiscovery(sourceNames);
const byId = Object.fromEntries(discoverHeartGapCandidates(sourceNames).map((item) => [item.id, item]));

assert.deepEqual(report.candidateFoundIds.sort(), [
  'chordae',
  'endocardium',
  'epicardium',
  'interatrial-septum',
  'interventricular-septum',
  'pericardium',
].sort());

assert.equal(byId.chordae?.candidateCount, 1);
assert.deepEqual(byId.chordae?.candidateSourceNames, ['Chordae tendineae']);
assert.equal(byId['interatrial-septum']?.candidateCount, 1);
assert.equal(byId['interventricular-septum']?.candidateCount, 1);
assert.equal(byId.pericardium?.candidateCount, 1);

for (const id of ['sa-node', 'av-node', 'his-purkinje']) {
  assert.equal(byId[id]?.status, 'conceptual-only');
  assert.equal(byId[id]?.candidateCount, 0);
  assert.equal(byId[id]?.ingestionAllowed, false);
  assert.equal(byId[id]?.verifiedRenderAllowed, false);
}

for (const item of report.results) {
  assert.equal(item.ingestionAllowed, false);
  assert.equal(item.verifiedRenderAllowed, false);
}

// Discovery is exact-pattern only: fuzzy descriptive strings must never promote.
const fuzzyOnly = discoverHeartGapCandidates([
  'possible chordae tendineae fragment',
  'interventricular septum candidate mesh',
  'pericardial tissue',
]);
for (const item of fuzzyOnly.filter((entry) => entry.status !== 'conceptual-only')) {
  assert.equal(item.status, 'candidate-not-found');
  assert.deepEqual(item.candidateSourceNames, []);
}

console.log('heart-source-gap-discovery: exact candidates only; ingestion remains fail-closed');
