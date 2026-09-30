import assert from 'node:assert/strict'
import {
  INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
  resolveAllAnatomySourceNodes,
} from '../../src/lib/anatomySourceNodeRegistry.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { buildOrganCoverageReport } from '../../src/lib/anatomy/organCoverageGate.ts'
import { WHOLE_BODY_ATLAS_BASE_NODES } from '../../src/lib/anatomy/wholeBodyAtlas.ts'

function atlasNode(id: string) {
  const found = WHOLE_BODY_ATLAS_BASE_NODES.find((entry) => entry.id === id)
  assert.ok(found, `missing atlas node: ${id}`)
  return found
}

function assertEveryHintResolves(id: string) {
  const entry = atlasNode(id)
  const allowed = new Set(entry.source.files ?? [])
  const bundles = allowed.size
    ? INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT.filter((bundle) => allowed.has(bundle.file))
    : INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT

  for (const hint of entry.source.nodeHints) {
    const matches = resolveAllAnatomySourceNodes([hint], bundles, 64)
    assert.ok(
      matches.some((match) => match.names.length > 0),
      `${id} source hint does not resolve in its allowed shipped bundle(s): ${hint}`,
    )
  }
}

const oral = atlasNode('gi:oral-cavity')
assert.equal(oral.geometryStatus, 'partial')
assert.equal(oral.source.mode, 'composite')
assert.deepEqual(oral.source.files, ['visceral.glb', 'skeletal.glb'])
for (const required of ['Gingiva', 'Palatine bone', 'Upper medial incisor', 'Lower first molar tooth']) {
  assert.ok(oral.source.nodeHints.includes(required), `oral cavity must bind shipped source: ${required}`)
}
assertEveryHintResolves('gi:oral-cavity')

const ears = atlasNode('sensory:ears')
assert.equal(ears.geometryStatus, 'partial')
assert.equal(ears.source.mode, 'composite')
assert.deepEqual(ears.source.files, ['skeletal.glb', 'nervous.glb'])
for (const required of ['Tympanic membrane', 'Auditory tube', 'Cochlea', 'Vestibule']) {
  assert.ok(ears.source.nodeHints.includes(required), `ear atlas must bind shipped source: ${required}`)
}
assertEveryHintResolves('sensory:ears')

const coverage = buildOrganCoverageReport(COMPLETE_WHOLE_BODY_ATLAS)
for (const id of ['oral-cavity', 'ears']) {
  const entry = coverage.entries.find((candidate) => candidate.id === id)
  assert.ok(entry, `missing organ coverage requirement: ${id}`)
  assert.equal(
    entry.status,
    'partial',
    `${id} must remain fail-closed until complete source geometry is established`,
  )
}

console.log('head source truth: oral/ear shipped bindings expanded while incomplete organ coverage remains partial')
