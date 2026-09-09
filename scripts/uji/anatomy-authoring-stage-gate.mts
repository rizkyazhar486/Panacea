import assert from 'node:assert/strict'
import { compileAtlasAgainstSource, type CompiledAtlas } from '../../src/lib/anatomy/atlasCompiler.ts'
import {
  canAuthorBodyStage,
  evaluateBodyAuthoringStageGate,
  REQUIRED_WHOLE_BODY_SYSTEMS,
  type BodyAuthoringStageEvidence,
} from '../../src/lib/anatomy/authoringStageGate.ts'
import { WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/wholeBodyAtlas.ts'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'

const compiled = compileAtlasAgainstSource(WHOLE_BODY_ATLAS, INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT)
const currentGate = evaluateBodyAuthoringStageGate(compiled)

assert.equal(REQUIRED_WHOLE_BODY_SYSTEMS.length, 14, 'gate must cover every canonical whole-body system root')
assert.equal(currentGate.activeStage, 'system', 'current partial whole-body systems must keep authoring at system stage')
assert.equal(currentGate.systemReady, false)
assert.ok(currentGate.blockers.includes('articular:geometry-partial'), 'articular partial geometry must block organ authoring')
assert.ok(currentGate.blockers.includes('fascial:geometry-partial'), 'fascial partial geometry must block organ authoring')
assert.equal(canAuthorBodyStage(currentGate, 'system'), true)
assert.equal(canAuthorBodyStage(currentGate, 'organ'), false)
assert.equal(canAuthorBodyStage(currentGate, 'dna'), false)
assert.equal(canAuthorBodyStage(currentGate, 'specialty'), false, 'unknown or specialty stages must fail closed')

function promoteSystemRoots(input: CompiledAtlas): CompiledAtlas {
  return {
    ...input,
    nodes: input.nodes.map((entry) => {
      if (entry.node.scale !== 'organism' || !entry.node.id.startsWith('system:')) return entry
      const fallbackFile = entry.node.source.files?.[0] ?? 'skeletal.glb'
      return {
        ...entry,
        node: { ...entry.node, geometryStatus: 'shipped' as const },
        resolution: 'resolved-shipped' as const,
        footprint: {
          ...entry.footprint,
          sourceFiles: entry.footprint.sourceFiles.length ? entry.footprint.sourceFiles : [fallbackFile],
          sourceNodeNames: entry.footprint.sourceNodeNames.length ? entry.footprint.sourceNodeNames : [`proof:${entry.node.id}`],
          sourceNodeCount: Math.max(1, entry.footprint.sourceNodeCount),
        },
      }
    }),
  }
}

const fullySourceBackedSystems = promoteSystemRoots(compiled)
const organGate = evaluateBodyAuthoringStageGate(fullySourceBackedSystems)
assert.equal(organGate.systemReady, true, 'all 14 shipped + resolved source roots should unlock organ stage')
assert.equal(organGate.activeStage, 'organ')
assert.equal(canAuthorBodyStage(organGate, 'organ'), true)
assert.equal(canAuthorBodyStage(organGate, 'tissue'), false)

const downstreamEvidence: readonly BodyAuthoringStageEvidence[] = [
  { stage: 'organ', complete: true, sourceBacked: true },
  { stage: 'tissue', complete: true, sourceBacked: true },
  { stage: 'cell', complete: true, sourceBacked: true },
  { stage: 'molecular', complete: true, sourceBacked: true },
]
const dnaGate = evaluateBodyAuthoringStageGate(fullySourceBackedSystems, downstreamEvidence)
assert.equal(dnaGate.activeStage, 'dna', 'deeper stages unlock only after each preceding source-backed completion proof')
assert.equal(canAuthorBodyStage(dnaGate, 'dna'), true)

const incompleteOrganGate = evaluateBodyAuthoringStageGate(fullySourceBackedSystems, [
  { stage: 'organ', complete: true, sourceBacked: false },
])
assert.equal(incompleteOrganGate.activeStage, 'organ', 'semantic completion without source backing must not unlock tissue')
assert.equal(canAuthorBodyStage(incompleteOrganGate, 'tissue'), false)

const specialtyImposter = { ...fullySourceBackedSystems, manifestId: 'panacea-specialty-atlas' }
const specialtyGate = evaluateBodyAuthoringStageGate(specialtyImposter)
assert.equal(specialtyGate.activeStage, 'system', 'specialty atlas geometry must never substitute for whole-body system proof')
assert.equal(specialtyGate.systemReady, false)
assert.ok(specialtyGate.blockers.some((blocker) => blocker.includes('not-whole-body')))

console.log('Body authoring stays system-first and fails closed until all canonical whole-body system roots are shipped and source-backed.')
