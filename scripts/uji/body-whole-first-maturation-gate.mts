import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  BODY_MATURATION_ORDER,
  REQUIRED_MACRO_REGIONS,
  REQUIRED_WHOLE_BODY_SYSTEMS,
  buildBodyMaturationReport,
} from '../../src/lib/anatomy/bodyMaturationGate.ts'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'

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

// Synthetic gate-transition fixture only: give every system root one exact name
// from its already-declared same-frame source bundle. This proves the region
// stage can still open when engineering source admission truly succeeds; these
// synthetic assignments are not anatomical/publication evidence.
const syntheticSystemReady = structuredClone(COMPLETE_WHOLE_BODY_ATLAS)
const requiredSystemRootIds = new Set(REQUIRED_WHOLE_BODY_SYSTEMS.map((id) => `system:${id}`))
for (const node of syntheticSystemReady.nodes) {
  if (!requiredSystemRootIds.has(node.id)) continue
  const file = node.source.files?.find((candidate) =>
    INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT.some((bundle) => bundle.file === candidate),
  )
  assert.ok(file, `${node.id} must retain at least one indexed same-frame source bundle`)
  const exactName = INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT
    .find((bundle) => bundle.file === file)
    ?.names[0]
  assert.ok(exactName, `${file} must retain at least one exact generated source name`)
  Object.assign(node, {
    geometryStatus: 'shipped' as const,
    source: {
      mode: 'specific-fallback' as const,
      files: [file],
      nodeHints: [exactName],
    },
  })
}

const afterSystems = buildBodyMaturationReport(syntheticSystemReady)
assert.equal(afterSystems.activeStage, 'region')
const region = afterSystems.stages.find((stage) => stage.id === 'region')
assert.ok(region)
assert.equal(region.status, 'incomplete')
assert.ok(region.blockers.some((blocker) => blocker.requirement === 'region:hand' && blocker.code === 'missing-root'))
assert.ok(region.blockers.some((blocker) => blocker.requirement === 'region:foot' && blocker.code === 'missing-root'))

// `geometryStatus = shipped` is metadata, not source admission. Break one exact
// source hint while leaving every system marked shipped: maturation must fail
// closed at system rather than leapfrog into region/organ work.
const metadataOnly = structuredClone(syntheticSystemReady)
const surfaceRoot = metadataOnly.nodes.find((node) => node.id === 'system:surface')
assert.ok(surfaceRoot)
Object.assign(surfaceRoot, {
  geometryStatus: 'shipped' as const,
  source: {
    mode: 'composite' as const,
    files: ['surface.glb'],
    nodeHints: ['panacea definitely absent source node'],
  },
})
const sourceBlocked = buildBodyMaturationReport(metadataOnly)
assert.equal(sourceBlocked.activeStage, 'system')
assert.equal(sourceBlocked.wholeBodyComplete, false)
const sourceBlockedSystem = sourceBlocked.stages.find((stage) => stage.id === 'system')
assert.ok(sourceBlockedSystem)
assert.ok(sourceBlockedSystem.blockers.some((blocker) =>
  blocker.nodeId === 'system:surface'
  && blocker.code === 'source-admission-failed'
  && blocker.requirement === 'source-name-unresolved',
))
for (const stage of sourceBlocked.stages.slice(2)) {
  assert.equal(stage.status, 'locked')
  assert.equal(stage.authoringAllowed, false)
}

console.log(JSON.stringify({
  activeStage: report.activeStage,
  currentSystemBlockers: system.blockers.map((blocker) => ({
    code: blocker.code,
    nodeId: blocker.nodeId,
    requirement: blocker.requirement,
  })),
  sourceAdmissionGuard: sourceBlockedSystem.blockers
    .filter((blocker) => blocker.code === 'source-admission-failed')
    .map((blocker) => ({ nodeId: blocker.nodeId, requirement: blocker.requirement })),
  nextMacroRegionBlockers: region.blockers.map((blocker) => ({
    code: blocker.code,
    nodeId: blocker.nodeId,
    requirement: blocker.requirement,
  })),
}, null, 2))