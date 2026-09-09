import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  BODY_MATURATION_ORDER,
  REQUIRED_MACRO_REGIONS,
  REQUIRED_WHOLE_BODY_SYSTEMS,
  buildBodyMaturationReport,
} from '../../src/lib/anatomy/bodyMaturationGate.ts'

assert.deepEqual(BODY_MATURATION_ORDER, [
  'whole-body',
  'system',
  'region',
  'organ',
  'suborgan',
  'tissue',
  'microstructure',
  'cell',
  'organelle',
  'molecular',
  'dna',
])
assert.equal(new Set(REQUIRED_WHOLE_BODY_SYSTEMS).size, 14)
assert.equal(new Set(REQUIRED_MACRO_REGIONS).size, 10)

const report = buildBodyMaturationReport(COMPLETE_WHOLE_BODY_ATLAS)
assert.equal(report.activeStage, 'system')
assert.equal(report.wholeBodyComplete, false)
assert.equal(report.mayAdvancePastActiveStage, false)

const system = report.stages.find((stage) => stage.id === 'system')
assert.ok(system)
assert.equal(system.status, 'incomplete')
assert.equal(system.authoringAllowed, true)
assert.ok(system.blockers.some((blocker) => blocker.nodeId === 'system:articular' && blocker.code === 'geometry-not-shipped'))
assert.ok(system.blockers.some((blocker) => blocker.nodeId === 'system:fascial' && blocker.code === 'geometry-not-shipped'))

for (const stage of report.stages.slice(2)) {
  assert.equal(stage.status, 'locked', `${stage.id} must remain locked while whole-body system coverage is incomplete`)
  assert.equal(stage.authoringAllowed, false, `${stage.id} authoring must not leapfrog the active larger scale`)
  assert.ok(stage.blockers.some((blocker) => blocker.code === 'upstream-incomplete'))
}

const fabricated = structuredClone(COMPLETE_WHOLE_BODY_ATLAS)
for (const node of fabricated.nodes) {
  if (node.id === 'system:articular' || node.id === 'system:fascial') {
    ;(node as { geometryStatus: string }).geometryStatus = 'shipped'
  }
}
const afterSystems = buildBodyMaturationReport(fabricated)
assert.equal(afterSystems.activeStage, 'region')
const region = afterSystems.stages.find((stage) => stage.id === 'region')
assert.ok(region)
assert.equal(region.status, 'incomplete')
assert.ok(region.blockers.some((blocker) => blocker.requirement === 'region:hand' && blocker.code === 'missing-root'))
assert.ok(region.blockers.some((blocker) => blocker.requirement === 'region:foot' && blocker.code === 'missing-root'))

console.log(JSON.stringify({
  activeStage: report.activeStage,
  currentSystemBlockers: system.blockers.map((blocker) => ({
    code: blocker.code,
    nodeId: blocker.nodeId,
    requirement: blocker.requirement,
  })),
  nextMacroRegionBlockers: region.blockers.map((blocker) => ({
    code: blocker.code,
    nodeId: blocker.nodeId,
    requirement: blocker.requirement,
  })),
}, null, 2))
