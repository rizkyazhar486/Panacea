import assert from 'node:assert/strict'
import { WHOLE_BODY_ATLAS } from '../../src/lib/anatomyWholeBodyManifest.ts'
import { prepareAnatomyAtlasRuntime } from '../../src/lib/anatomyAtlasRuntime.ts'

const sources = [
  { name: 'Heart', uuid: 'heart' },
  { name: 'Trachea', uuid: 'trachea' },
  { name: 'Right lung', uuid: 'right-lung' },
  { name: 'Left lung', uuid: 'left-lung' },
  { name: 'Right upper lobe', uuid: 'rul' },
  { name: 'Right middle lobe', uuid: 'rml' },
  { name: 'Right lower lobe', uuid: 'rll' },
  { name: 'Left upper lobe', uuid: 'lul' },
  { name: 'Left lower lobe', uuid: 'lll' },
  { name: 'Pleura', uuid: 'pleura' },
  { name: 'Diaphragm', uuid: 'diaphragm' },
]

const permissiveEngineeringPolicy = prepareAnatomyAtlasRuntime(WHOLE_BODY_ATLAS, {
  sourceNodes: sources,
  maxBudgetUnits: 40,
  activeSystems: ['respiratory'],
  activeRegions: ['thorax'],
  focusNodeIds: ['right-upper-lobe'],
  policy: { maxAmbiguities: 0 },
})
assert.equal(permissiveEngineeringPolicy.readyForRender, true)
assert.ok(permissiveEngineeringPolicy.pendingAcademicReviewNodeIds.length > 0)
assert.equal(permissiveEngineeringPolicy.streaming.overBudget, false)

const academicGate = prepareAnatomyAtlasRuntime(WHOLE_BODY_ATLAS, {
  sourceNodes: sources,
  maxBudgetUnits: 40,
  policy: { requireRecordedAcademicReview: true },
})
assert.equal(academicGate.readyForRender, false)
assert.ok(academicGate.reasons.some((reason) => reason.includes('pending academic review')))

const impossibleBudget = prepareAnatomyAtlasRuntime(WHOLE_BODY_ATLAS, {
  sourceNodes: sources,
  maxBudgetUnits: 5,
  focusNodeIds: ['right-upper-lobe'],
})
assert.equal(impossibleBudget.readyForRender, false)
assert.ok(impossibleBudget.reasons.some((reason) => reason.includes('Mandatory focus/ancestor residency requires 11')))

const impossibleCoverage = prepareAnatomyAtlasRuntime(WHOLE_BODY_ATLAS, {
  sourceNodes: sources,
  maxBudgetUnits: 40,
  policy: { minWeightedCoverage: 1 },
})
assert.equal(impossibleCoverage.readyForRender, false)
assert.ok(impossibleCoverage.reasons.some((reason) => reason.includes('Weighted scene coverage')))

assert.throws(() => prepareAnatomyAtlasRuntime(WHOLE_BODY_ATLAS, {
  sourceNodes: sources,
  maxBudgetUnits: 40,
  policy: { minWeightedCoverage: 1.1 },
}), /between 0 and 1/)

console.log('Atlas runtime admission: graph, ambiguity, coverage, residency budget, and academic-review gates remain explicit and fail-closed.')
