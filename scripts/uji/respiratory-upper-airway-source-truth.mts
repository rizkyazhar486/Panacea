import assert from 'node:assert/strict'
import {
  INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
  resolveAllAnatomySourceNodes,
} from '../../src/lib/anatomySourceNodeRegistry.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { buildOrganCoverageReport } from '../../src/lib/anatomy/organCoverageGate.ts'
import { RESPIRATORY_ATLAS_NODES } from '../../src/lib/anatomy/respiratoryAtlas.ts'

function node(id: string) {
  const found = RESPIRATORY_ATLAS_NODES.find((entry) => entry.id === id)
  assert.ok(found, `missing respiratory atlas node: ${id}`)
  return found
}

function assertEveryHintResolves(id: string) {
  const entry = node(id)
  const allowed = new Set(entry.source.files ?? [])
  const bundles = allowed.size
    ? INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT.filter((bundle) => allowed.has(bundle.file))
    : INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT

  for (const hint of entry.source.nodeHints) {
    const matches = resolveAllAnatomySourceNodes([hint], bundles, 32)
    assert.ok(
      matches.some((match) => match.names.length > 0),
      `${id} source hint does not resolve in its allowed shipped bundle(s): ${hint}`,
    )
  }
}

const upperAirway = node('resp:upper-airway')
assert.equal(upperAirway.geometryStatus, 'shipped')
assert.equal(upperAirway.source.mode, 'composite')
assertEveryHintResolves('resp:upper-airway')

const nasal = node('resp:nasal-cavity')
assert.equal(nasal.geometryStatus, 'partial')
assert.equal(nasal.source.mode, 'composite')
assert.deepEqual(nasal.source.files, ['visceral.glb', 'skeletal.glb'])
assertEveryHintResolves('resp:nasal-cavity')

const pharynx = node('resp:pharynx')
assert.equal(pharynx.geometryStatus, 'partial')
assert.deepEqual(pharynx.source.nodeHints, ['Laryngopharynx'])
assertEveryHintResolves('resp:pharynx')

const larynx = node('resp:larynx')
assert.equal(larynx.geometryStatus, 'partial')
assert.equal(larynx.source.mode, 'composite')
assertEveryHintResolves('resp:larynx')

const coverage = buildOrganCoverageReport(COMPLETE_WHOLE_BODY_ATLAS)
for (const id of ['nasal-cavity', 'pharynx', 'larynx']) {
  const entry = coverage.entries.find((candidate) => candidate.id === id)
  assert.ok(entry, `missing organ coverage requirement: ${id}`)
  assert.equal(
    entry.status,
    'partial',
    `${id} must remain fail-closed until complete source geometry is established`,
  )
}

console.log('upper-airway source truth: exact shipped bindings expanded; incomplete organ coverage remains fail-closed')
