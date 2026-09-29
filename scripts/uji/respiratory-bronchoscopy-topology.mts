import assert from 'node:assert/strict'
import { atlasNodeById } from '../../src/lib/anatomy/atlasKernel.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  BRONCHOPULMONARY_SEGMENT_RUNTIME,
  type BronchopulmonarySegmentRuntime,
  respiratorySegmentRuntime,
  validateRespiratoryHighEndRuntime,
} from '../../src/lib/anatomy/respiratoryHighEndRuntime.ts'

const validation = validateRespiratoryHighEndRuntime(COMPLETE_WHOLE_BODY_ATLAS)
assert.deepEqual(validation, [], validation.join('\n'))

const reparentedLobarManifest = {
  ...COMPLETE_WHOLE_BODY_ATLAS,
  nodes: COMPLETE_WHOLE_BODY_ATLAS.nodes.map((node) =>
    node.id === 'resp:right-upper-lobar-bronchus'
      ? { ...node, parentId: 'resp:carina' }
      : node,
  ),
}
const reparentedLobarIssues = validateRespiratoryHighEndRuntime(reparentedLobarManifest)
assert.ok(
  reparentedLobarIssues.some((issue) => issue.includes('Airway hierarchy mismatch: resp:right-upper-lobar-bronchus')),
  'validator must reject a lobar bronchus whose manifest parent disagrees with the canonical airway route',
)

const disconnectedSegmentManifest = {
  ...COMPLETE_WHOLE_BODY_ATLAS,
  nodes: COMPLETE_WHOLE_BODY_ATLAS.nodes.map((node) =>
    node.id === 'resp:segment:r-s1'
      ? {
          ...node,
          relations: node.relations?.map((relation) =>
            relation.kind === 'continuous-with'
              ? { ...relation, targetId: 'resp:right-main-bronchus' }
              : relation,
          ),
        }
      : node,
  ),
}
const disconnectedSegmentIssues = validateRespiratoryHighEndRuntime(disconnectedSegmentManifest)
assert.ok(
  disconnectedSegmentIssues.some((issue) => issue.includes('Segment airway continuity mismatch: R-S1')),
  'validator must reject a segment whose continuous-with relation disagrees with its terminal lobar bronchus',
)

const mutableRuntimeSegment = BRONCHOPULMONARY_SEGMENT_RUNTIME[0] as BronchopulmonarySegmentRuntime & {
  bronchoscopicRoute: readonly string[]
}
const originalRoute = mutableRuntimeSegment.bronchoscopicRoute
try {
  mutableRuntimeSegment.bronchoscopicRoute = [...originalRoute, 'resp:trachea']
  const malformedRouteIssues = validateRespiratoryHighEndRuntime(COMPLETE_WHOLE_BODY_ATLAS)
  assert.ok(
    malformedRouteIssues.some((issue) => issue.includes('Bronchoscopic route does not terminate at its segment: R-S1')),
    'validator must reject routes with extra trailing nodes after the target segment',
  )
} finally {
  mutableRuntimeSegment.bronchoscopicRoute = originalRoute
}

const parenchymalLobes = new Set([
  'resp:right-upper-lobe',
  'resp:right-middle-lobe',
  'resp:right-lower-lobe',
  'resp:left-upper-lobe',
  'resp:left-lower-lobe',
])

for (const segment of BRONCHOPULMONARY_SEGMENT_RUNTIME) {
  assert.equal(
    segment.bronchoscopicRoute.some((nodeId) => parenchymalLobes.has(nodeId)),
    false,
    `${segment.code}: bronchoscopy route must traverse airway lumen, not a lung-lobe parenchyma node`,
  )
}

const cases = [
  ['resp:segment:r-s1', ['resp:right-main-bronchus', 'resp:right-upper-lobar-bronchus']],
  ['resp:segment:r-s4', ['resp:right-main-bronchus', 'resp:bronchus-intermedius', 'resp:right-middle-lobar-bronchus']],
  ['resp:segment:r-s8', ['resp:right-main-bronchus', 'resp:bronchus-intermedius', 'resp:right-lower-lobar-bronchus']],
  ['resp:segment:l-s4', ['resp:left-main-bronchus', 'resp:left-upper-lobar-bronchus']],
  ['resp:segment:l-s9', ['resp:left-main-bronchus', 'resp:left-lower-lobar-bronchus']],
] as const

for (const [segmentId, airwayNodes] of cases) {
  const segment = respiratorySegmentRuntime(segmentId)
  assert.ok(segment, `missing runtime segment ${segmentId}`)
  for (const airwayNode of airwayNodes) {
    assert.ok(segment.bronchoscopicRoute.includes(airwayNode), `${segmentId} must traverse ${airwayNode}`)
  }
}

const sourceBackedLobarBronchi = new Map([
  ['resp:right-upper-lobar-bronchus', 'Right superior lobar bronchus'],
  ['resp:right-middle-lobar-bronchus', 'Middle lobar bronchus.r'],
  ['resp:right-lower-lobar-bronchus', 'Right inferior lobar bronchus'],
  ['resp:left-upper-lobar-bronchus', 'Left superior lobar bronchus'],
  ['resp:left-lower-lobar-bronchus', 'Left inferior lobar bronchus'],
])

for (const [nodeId, exactSourceName] of sourceBackedLobarBronchi) {
  const node = atlasNodeById(COMPLETE_WHOLE_BODY_ATLAS, nodeId)
  assert.ok(node, `missing lobar bronchus node ${nodeId}`)
  assert.equal(node.geometryStatus, 'shipped')
  assert.ok(node.source.files?.includes('visceral.glb'))
  assert.ok(node.source.nodeHints.includes(exactSourceName), `${nodeId} must retain exact shipped source-node hint`)
}

const intermedius = atlasNodeById(COMPLETE_WHOLE_BODY_ATLAS, 'resp:bronchus-intermedius')
assert.ok(intermedius)
assert.equal(intermedius.geometryStatus, 'reference-only')
assert.deepEqual(intermedius.source.files ?? [], [])
assert.deepEqual(intermedius.source.nodeHints, [])

console.log('Respiratory bronchoscopy topology: main -> lobar airway -> segment is explicit; parenchymal lobes are excluded from airway routes and bronchus intermedius fails closed without fabricated geometry.')
