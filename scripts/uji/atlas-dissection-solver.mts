import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  solveAtlasDissection,
  validateAtlasDissectionPlan,
  ATLAS_SEMANTIC_DISSECTION_ORDER,
} from '../../src/lib/anatomy/atlasDissectionSolver.ts'

assert.equal(ATLAS_SEMANTIC_DISSECTION_ORDER.length, 14)
assert.equal(new Set(ATLAS_SEMANTIC_DISSECTION_ORDER).size, 14)

const isolateHeart = solveAtlasDissection(COMPLETE_WHOLE_BODY_ATLAS, {
  mode: 'isolate-node',
  selectedNodeId: 'cv:heart',
  graphDepth: 1,
  contextOpacity: 0.15,
})
assert.ok(isolateHeart.visibleNodeIds.includes('cv:heart'))
assert.ok(isolateHeart.protectedNodeIds.includes('cv:heart'))
assert.ok(isolateHeart.ghostNodeIds.length > 0)
assert.equal(isolateHeart.decisions.find((decision) => decision.nodeId === 'cv:heart')?.opacity, 1)
assert.deepEqual(validateAtlasDissectionPlan(isolateHeart), [])

const respiratorySystem = solveAtlasDissection(COMPLETE_WHOLE_BODY_ATLAS, {
  mode: 'isolate-system',
  systems: ['respiratory'],
})
for (const decision of respiratorySystem.decisions) {
  if (decision.action === 'show') assert.equal(decision.system, 'respiratory')
}
assert.ok(respiratorySystem.visibleNodeIds.includes('resp:trachea'))
assert.ok(respiratorySystem.metadataOnlyNodeIds.includes('deep:alveolar-sac'))
assert.deepEqual(validateAtlasDissectionPlan(respiratorySystem), [])

const thoraxPeel = solveAtlasDissection(COMPLETE_WHOLE_BODY_ATLAS, {
  mode: 'regional-peel',
  regions: ['thorax'],
  semanticPeel01: 0.25,
  protectedNodeIds: ['cv:heart'],
})
assert.ok(thoraxPeel.protectedNodeIds.includes('cv:heart'))
assert.ok(thoraxPeel.visibleNodeIds.includes('cv:heart'))
assert.ok(thoraxPeel.ghostNodeIds.length > 0)
assert.ok(thoraxPeel.warnings.some((warning) => warning.includes('not a substitute for verified mesh depth')))
assert.deepEqual(validateAtlasDissectionPlan(thoraxPeel), [])

const sciatic = solveAtlasDissection(COMPLETE_WHOLE_BODY_ATLAS, {
  mode: 'transparent-context',
  selectedNodeId: 'deep:sciatic-nerve',
  regions: ['pelvis', 'lower-limb'],
})
const sciaticDecision = sciatic.decisions.find((decision) => decision.nodeId === 'deep:sciatic-nerve')
assert.ok(sciaticDecision)
assert.equal(sciaticDecision?.action, 'metadata-only')
assert.equal(sciaticDecision?.renderableGeometry, false)
assert.equal(sciaticDecision?.opacity, 0)
assert.deepEqual(validateAtlasDissectionPlan(sciatic), [])

const unknown = solveAtlasDissection(COMPLETE_WHOLE_BODY_ATLAS, {
  mode: 'relationship-exposure',
  selectedNodeId: 'not:real',
})
assert.ok(unknown.warnings.some((warning) => warning.includes('absent from manifest')))
assert.deepEqual(validateAtlasDissectionPlan(unknown), [])

console.log('Semantic whole-body dissection solver verified: isolate/system/peel/context modes remain source-bound and reference-only anatomy never becomes renderable.')
