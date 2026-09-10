import assert from 'node:assert/strict'
import type { AtlasManifest, AtlasNode } from '../../src/lib/anatomy/atlasKernel.ts'
import {
  BODY_ORGAN_COMPLETION_BOUNDARY,
  buildBodyOrganCompletionReport,
  type RequiredOrganInventory,
} from '../../src/lib/anatomy/bodyOrganCompletionGate.ts'

const syntheticOrgan = (id: string, reviewStatus: AtlasNode['provenance']['reviewStatus'] = 'academic-reviewed'): AtlasNode => ({
  id,
  label: id,
  system: 'digestive',
  regions: ['abdomen'],
  laterality: 'not-applicable',
  scale: 'organ',
  source: {
    mode: 'specific-fallback',
    files: ['synthetic-fixture.glb'],
    nodeHints: ['Synthetic Fixture Organ'],
  },
  provenance: {
    sourceId: 'repo:synthetic-organ-fixture',
    sourceRevision: 'fixture-2026-09-10',
    license: 'fixture-only',
    sourceLocator: 'scripts/uji/body-organ-completion-gate.mts',
    reviewStatus,
    reviewerScope: 'synthetic deterministic test fixture only',
  },
  geometryStatus: 'shipped',
  educationalPriority: 1,
})

const manifest = (nodes: readonly AtlasNode[]): AtlasManifest => ({
  id: 'fixture:whole-body-organ-completion',
  revision: 'fixture-2026-09-10',
  nodes,
})

const reviewedInventory: RequiredOrganInventory = {
  id: 'fixture:reviewed-organ-inventory',
  revision: 'fixture-2026-09-10',
  provenance: {
    sourceId: 'repo:synthetic-reviewed-inventory',
    sourceRevision: 'fixture-2026-09-10',
    sourceLocator: 'scripts/uji/body-organ-completion-gate.mts',
    license: 'fixture-only',
    reviewStatus: 'academic-reviewed',
  },
  organs: [{ id: 'organ:fixture-a', system: 'digestive', regions: ['abdomen'] }],
}

// Synthetic positive fixture proves only gate mechanics. It is not a real organ
// inventory, anatomy source, license review, or qualified academic approval.
const ready = buildBodyOrganCompletionReport(
  manifest([syntheticOrgan('organ:fixture-a')]),
  reviewedInventory,
  new Set(['organ:fixture-a']),
)
assert.equal(ready.complete, true)
assert.equal(ready.requiredOrganCount, 1)
assert.equal(ready.completeOrganCount, 1)
assert.equal(ready.mayAdvanceToPhysiology, true)
assert.equal(ready.mayAdvanceToSurgery, false)
assert.deepEqual(ready.blockers, [])

const noSourceAdmission = buildBodyOrganCompletionReport(
  manifest([syntheticOrgan('organ:fixture-a')]),
  reviewedInventory,
  new Set(),
)
assert.equal(noSourceAdmission.complete, false)
assert.equal(noSourceAdmission.mayAdvanceToPhysiology, false)
assert.ok(noSourceAdmission.blockers.some((blocker) => blocker.code === 'source-not-admitted'))

const pendingReview = buildBodyOrganCompletionReport(
  manifest([syntheticOrgan('organ:fixture-a', 'academic-review-required')]),
  reviewedInventory,
  new Set(['organ:fixture-a']),
)
assert.equal(pendingReview.complete, false)
assert.ok(pendingReview.blockers.some((blocker) => blocker.code === 'node-not-academic-reviewed'))

const unreviewedInventory = buildBodyOrganCompletionReport(
  manifest([syntheticOrgan('organ:fixture-a')]),
  {
    ...reviewedInventory,
    provenance: { ...reviewedInventory.provenance, reviewStatus: 'academic-review-required' },
  },
  new Set(['organ:fixture-a']),
)
assert.equal(unreviewedInventory.complete, false)
assert.ok(unreviewedInventory.blockers.some((blocker) => blocker.code === 'inventory-not-academic-reviewed'))

const missingOrgan = buildBodyOrganCompletionReport(manifest([]), reviewedInventory, new Set())
assert.equal(missingOrgan.complete, false)
assert.ok(missingOrgan.blockers.some((blocker) => blocker.code === 'missing-organ'))

const duplicateRequirement = buildBodyOrganCompletionReport(
  manifest([syntheticOrgan('organ:fixture-a')]),
  { ...reviewedInventory, organs: [...reviewedInventory.organs, ...reviewedInventory.organs] },
  new Set(['organ:fixture-a']),
)
assert.equal(duplicateRequirement.complete, false)
assert.ok(duplicateRequirement.blockers.some((blocker) => blocker.code === 'duplicate-required-organ'))

assert.match(BODY_ORGAN_COMPLETION_BOUNDARY, /never invents missing organs/)
assert.match(BODY_ORGAN_COMPLETION_BOUNDARY, /never.*opens surgery directly/)

console.log('body-organ-completion-gate: fail-closed anatomy-first sequencing verified')
