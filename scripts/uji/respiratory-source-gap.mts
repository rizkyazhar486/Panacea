import assert from 'node:assert/strict'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'
import {
  RESPIRATORY_SOURCE_LOOKUPS,
  assessRespiratorySourceCoverage,
  respiratoryMissingStructureIds,
} from '../../src/lib/anatomy/respiratoryAtlasGap.ts'
import { RESPIRATORY_ATLAS_STRUCTURES } from '../../src/lib/anatomy/respiratoryAtlasContract.ts'

const report = assessRespiratorySourceCoverage(INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT)

assert.equal(report.total, RESPIRATORY_ATLAS_STRUCTURES.length)
assert.equal(report.present + report.missing + report.referenceOnly, report.total)
assert.equal(new Set(RESPIRATORY_SOURCE_LOOKUPS.map((lookup) => lookup.structureId)).size, RESPIRATORY_SOURCE_LOOKUPS.length)

for (const entry of report.entries) {
  if (entry.coverage === 'source-node-present') {
    assert.ok(entry.exactSourceNames.length > 0, `${entry.structureId} cannot be present without exact source-node names.`)
    assert.ok(entry.matches.length > 0, `${entry.structureId} cannot be present without resolver evidence.`)
  }

  if (entry.coverage === 'source-node-missing') {
    assert.deepEqual(entry.exactSourceNames, [], `${entry.structureId} missing status must not retain fabricated source names.`)
    assert.match(entry.reason, /No matching source node|No reviewed source-node lookup/i)
  }

  if (entry.coverage === 'reference-only') {
    assert.deepEqual(entry.exactSourceNames, [])
    assert.equal(entry.expectedFile, null)
  }
}


const bronchialSourceReport = assessRespiratorySourceCoverage([{
  file: 'visceral.glb',
  names: [
    'Right main bronchus',
    'Left main bronchus',
    'Right superior lobar bronchus',
    'Left inferior lobar bronchus',
    'Anterior segmental bronchus of left lung (BIII)',
  ],
}])
for (const [id, expectedName] of [
  ['right-main-bronchus', 'Right main bronchus'],
  ['left-main-bronchus', 'Left main bronchus'],
] as const) {
  const entry = bronchialSourceReport.entries.find((candidate) => candidate.structureId === id)
  assert.equal(entry?.coverage, 'source-node-present', `${id} must resolve from an explicitly sided main bronchus`)
  assert.deepEqual(entry?.exactSourceNames, [expectedName], `${id} must not absorb contralateral or segmental geometry`)
}
for (const [onlyName, missingId] of [
  ['Left main bronchus', 'right-main-bronchus'],
  ['Right main bronchus', 'left-main-bronchus'],
] as const) {
  const unilateralReport = assessRespiratorySourceCoverage([{ file: 'visceral.glb', names: [onlyName] }])
  assert.equal(unilateralReport.entries.find((entry) => entry.structureId === missingId)?.coverage, 'source-node-missing',
    `${missingId} must fail closed when only the opposite main bronchus exists`)
}

const canonicalLobeSources = new Map([
  ['right-upper-lobe', 'Superior lobe of right lung'],
  ['right-middle-lobe', 'Middle lobe of right lung'],
  ['right-lower-lobe', 'Inferior lobe of right lung'],
  ['left-upper-lobe', 'Superior lobe of left lung'],
  ['left-lower-lobe', 'Inferior lobe of left lung'],
] as const)
for (const [structureId, sourceName] of canonicalLobeSources) {
  const entry = report.entries.find((candidate) => candidate.structureId === structureId)
  assert.equal(entry?.coverage, 'source-node-present', `${structureId} must resolve from the shipped visceral source catalogue.`)
  assert.ok(entry?.exactSourceNames.includes(sourceName), `${structureId} must retain its exact canonical source name: ${sourceName}`)
}


const leftOnlyReport = assessRespiratorySourceCoverage([{
  file: 'visceral.glb',
  names: ['Upper lobe of left lung', 'Lower lobe of left lung', 'Superior lobe of left lung', 'Inferior lobe of left lung'],
}])
for (const id of ['right-upper-lobe', 'right-lower-lobe', 'right-middle-lobe']) {
  assert.equal(leftOnlyReport.entries.find((entry) => entry.structureId === id)?.coverage, 'source-node-missing', `${id} must not resolve contralateral lung geometry`)
}
for (const id of ['left-upper-lobe', 'left-lower-lobe']) {
  assert.equal(leftOnlyReport.entries.find((entry) => entry.structureId === id)?.coverage, 'source-node-present', `${id} must resolve the corresponding left lung geometry`)
}
const rightOnlyReport = assessRespiratorySourceCoverage([{
  file: 'visceral.glb',
  names: ['Upper lobe of right lung', 'Lower lobe of right lung', 'Superior lobe of right lung', 'Inferior lobe of right lung', 'Middle lobe of right lung'],
}])
for (const id of ['left-upper-lobe', 'left-lower-lobe']) {
  assert.equal(rightOnlyReport.entries.find((entry) => entry.structureId === id)?.coverage, 'source-node-missing', `${id} must not resolve contralateral lung geometry`)
}
for (const id of ['right-upper-lobe', 'right-middle-lobe', 'right-lower-lobe']) {
  assert.equal(rightOnlyReport.entries.find((entry) => entry.structureId === id)?.coverage, 'source-node-present', `${id} must resolve the corresponding right lung geometry`)
}

for (const id of ['visceral-pleura', 'parietal-pleura']) {
  const entry = report.entries.find((candidate) => candidate.structureId === id)
  assert.equal(entry?.coverage, 'source-node-missing', `${id} must not resolve from generic Pleura geometry`)
  assert.deepEqual(entry?.exactSourceNames, [])
}
const genericPleura = assessRespiratorySourceCoverage([{ file: 'visceral.glb', names: ['Pleura'] }])
for (const id of ['visceral-pleura', 'parietal-pleura']) {
  assert.equal(genericPleura.entries.find((entry) => entry.structureId === id)?.coverage, 'source-node-missing', `${id} must fail closed for generic Pleura`)
}
const distinctPleura = assessRespiratorySourceCoverage([{ file: 'visceral.glb', names: ['Visceral pleura', 'Parietal pleura'] }])
for (const [id, sourceName] of [['visceral-pleura', 'Visceral pleura'], ['parietal-pleura', 'Parietal pleura']] as const) {
  const entry = distinctPleura.entries.find((candidate) => candidate.structureId === id)
  assert.equal(entry?.coverage, 'source-node-present')
  assert.deepEqual(entry?.exactSourceNames, [sourceName])
}

const missing = respiratoryMissingStructureIds(report)
assert.deepEqual(missing, [
  'right-horizontal-fissure',
  'right-oblique-fissure',
  'left-oblique-fissure',
  'visceral-pleura',
  'parietal-pleura',
], 'only three fissures and two distinct pleural layers remain absent from the shipped source-node catalogue')
assert.deepEqual(missing, [...missing].sort((a, b) => {
  const ai = report.entries.findIndex((entry) => entry.structureId === a)
  const bi = report.entries.findIndex((entry) => entry.structureId === b)
  return ai - bi
}))

console.log(JSON.stringify({
  respiratoryAtlasSourceGap: {
    present: report.present,
    missing: report.missing,
    referenceOnly: report.referenceOnly,
    total: report.total,
    missingStructureIds: missing,
  },
}, null, 2))
