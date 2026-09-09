import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  ATLAS_SCALE_ORDER,
  REQUIRED_SYSTEM_ROOTS,
  buildAtlasCompletionReport,
} from '../../src/lib/anatomy/atlasCompletionGate.ts'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'

const report = buildAtlasCompletionReport(
  COMPLETE_WHOLE_BODY_ATLAS,
  INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
)

assert.deepEqual(ATLAS_SCALE_ORDER, [
  'organism',
  'region',
  'organ',
  'suborgan',
  'tissue',
  'microstructure',
])

assert.equal(new Set(REQUIRED_SYSTEM_ROOTS).size, 14, 'all 14 major whole-body systems must be explicit roots')
assert.equal(report.mayAuthorSmallerThanActiveScale, false)

const organism = report.stages.find((stage) => stage.scale === 'organism')
assert.ok(organism)
assert.equal(organism.explicitlyAudited, true)
assert.equal(organism.status, 'incomplete', 'current macro atlas must remain fail-closed until partial roots are complete')
assert.equal(organism.authoringAllowed, true)
assert.equal(report.activeScale, 'organism')
assert.equal(report.organismComplete, false)

const articularBlock = organism.blockers.find((blocker) =>
  blocker.nodeId === 'system:articular' && blocker.code === 'geometry-not-shipped')
const fascialBlock = organism.blockers.find((blocker) =>
  blocker.nodeId === 'system:fascial' && blocker.code === 'geometry-not-shipped')
assert.ok(articularBlock, 'articular whole-body layer must remain an explicit macro blocker while geometryStatus is partial')
assert.ok(fascialBlock, 'fascial whole-body layer must remain an explicit macro blocker while geometryStatus is partial')

for (const stage of report.stages.filter((stage) => stage.scale !== 'organism')) {
  assert.equal(stage.status, 'locked', `${stage.scale} must stay locked while organism/system coverage is incomplete`)
  assert.equal(stage.authoringAllowed, false, `${stage.scale} authoring must not advance ahead of the macro layer`)
  assert.ok(
    stage.blockers.some((blocker) => blocker.code === 'upstream-scale-incomplete'),
    `${stage.scale} must explain that an upstream scale blocks it`,
  )
}

const region = report.stages.find((stage) => stage.scale === 'region')
assert.ok(region)
assert.ok(
  region.blockers.some((blocker) => blocker.requirement === 'region:hand'),
  'hand must be an explicit macro-region requirement rather than hidden inside upper-limb aggregation',
)
assert.ok(
  region.blockers.some((blocker) => blocker.requirement === 'region:foot'),
  'foot must be an explicit macro-region requirement rather than hidden inside lower-limb aggregation',
)

console.log(JSON.stringify({
  activeScale: report.activeScale,
  organismBlockers: organism.blockers.map((blocker) => ({
    code: blocker.code,
    nodeId: blocker.nodeId,
    requirement: blocker.requirement,
  })),
  nextRegionBlockers: region.blockers
    .filter((blocker) => blocker.code !== 'upstream-scale-incomplete')
    .map((blocker) => ({ code: blocker.code, requirement: blocker.requirement, nodeId: blocker.nodeId })),
}, null, 2))
