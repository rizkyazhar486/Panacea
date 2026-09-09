import assert from 'node:assert/strict'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'
import { buildRespiratoryHdReadiness } from '../../src/lib/anatomy/respiratoryHdReadiness.ts'

const readiness = buildRespiratoryHdReadiness(INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT)

assert.deepEqual(readiness.mandatoryReferenceUrls.sort(), [
  'https://breath-atlas.thebuggeddev.chatgpt.site/',
  'https://github.com/thebuggeddev/anatomy',
].sort())
assert.equal(readiness.requiredStructures, 17)
assert.equal(readiness.sourceNodePresent, 8)
assert.equal(readiness.sourceNodeMissing, 7)
assert.equal(readiness.referenceOnly, 2)
assert.equal(readiness.licensedAcquisitionCandidateCount, 4)
assert.deepEqual(readiness.renderProfileIds, ['mobile-safe', 'desktop-balanced', 'desktop-hd'])
assert.equal(readiness.referenceDataset.license, 'CC BY 4.0')
assert.equal(readiness.segmentationTool.license, 'Apache-2.0')

const actionCounts = Object.fromEntries(
  [...new Set(readiness.entries.map((entry) => entry.nextAction))]
    .map((action) => [action, readiness.entries.filter((entry) => entry.nextAction === action).length]),
)
assert.equal(actionCounts['review-existing-source-node'], 8)
assert.equal(actionCounts['acquire-licensed-source'], 4)
assert.equal(actionCounts['derive-reference-from-lobe-masks'], 3)
assert.equal(actionCounts['keep-reference-only'], 2)
assert.equal(actionCounts['source-research-required'] ?? 0, 0)

assert.deepEqual(readiness.unresolvedDirectProductionSourceIds, [
  'right-horizontal-fissure',
  'right-oblique-fissure',
  'left-oblique-fissure',
])
assert.deepEqual(readiness.derivedFissureReferenceIds.sort(), [
  'left-oblique-fissure',
  'right-horizontal-fissure',
  'right-oblique-fissure',
].sort())

for (const entry of readiness.entries) {
  assert.equal(entry.verifiedRenderingReady, false, `${entry.structureId} must remain fail-closed until asset-level provenance and review exist.`)
  if (entry.nextAction === 'review-existing-source-node') assert.ok(entry.exactSourceNames.length > 0)
  if (entry.nextAction === 'derive-reference-from-lobe-masks') assert.equal(entry.derivedReferenceAvailable, true)
}

console.log(JSON.stringify({ respiratoryHdReadiness: {
  requiredStructures: readiness.requiredStructures,
  sourceNodePresent: readiness.sourceNodePresent,
  sourceNodeMissing: readiness.sourceNodeMissing,
  referenceOnly: readiness.referenceOnly,
  actionCounts,
  unresolvedDirectProductionSourceIds: readiness.unresolvedDirectProductionSourceIds,
  derivedFissureReferenceIds: readiness.derivedFissureReferenceIds,
} }, null, 2))
