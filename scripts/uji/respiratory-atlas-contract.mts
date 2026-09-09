import assert from 'node:assert/strict'
import { findAnatomyPath, validateAnatomySpatialGraph } from '../../src/lib/anatomySpatialGraph.ts'
import {
  RESPIRATORY_ATLAS_GRAPH,
  RESPIRATORY_ATLAS_METADATA,
  RESPIRATORY_VARIANTS,
  respiratoryTerminalSegmentIds,
} from '../../src/lib/respiratoryAtlasContract.ts'

const validation = validateAnatomySpatialGraph(RESPIRATORY_ATLAS_GRAPH)
assert.equal(validation.valid, true, validation.errors.join('\n'))
assert.equal(RESPIRATORY_ATLAS_METADATA.clinicalReview, 'pending')
assert.equal(RESPIRATORY_ATLAS_METADATA.educationalOnly, true)
assert.equal(RESPIRATORY_ATLAS_METADATA.nomenclatureVariant, 'variant-sensitive')

const terminals = respiratoryTerminalSegmentIds()
assert.equal(terminals.length, 18)
for (const expected of [
  'r-s1-apical', 'r-s2-posterior', 'r-s3-anterior', 'r-s4-lateral', 'r-s5-medial',
  'r-s6-superior', 'r-s7-medial-basal', 'r-s8-anterior-basal', 'r-s9-lateral-basal', 'r-s10-posterior-basal',
  'l-s1-2-apicoposterior', 'l-s3-anterior', 'l-s4-superior-lingular', 'l-s5-inferior-lingular',
  'l-s6-superior', 'l-s7-8-anteromedial-basal', 'l-s9-lateral-basal', 'l-s10-posterior-basal',
]) assert.ok(terminals.includes(expected), `Missing respiratory terminal ${expected}`)

for (const terminal of terminals) {
  const path = findAnatomyPath(RESPIRATORY_ATLAS_GRAPH, 'trachea', terminal, ['airwayTo'])
  assert.ok(path, `No airway path from trachea to ${terminal}`)
  assert.equal(path?.[0], 'trachea')
  assert.equal(path?.at(-1), terminal)
  assert.ok((path?.length ?? 0) >= 5)
}

const right = terminals.filter((id) => id.startsWith('r-'))
const left = terminals.filter((id) => id.startsWith('l-'))
assert.equal(right.length, 10)
assert.equal(left.length, 8)

assert.deepEqual(
  RESPIRATORY_VARIANTS.map((variant) => variant.canonicalGroupedId).sort(),
  ['l-s1-2-apicoposterior', 'l-s7-8-anteromedial-basal'],
)
assert.ok(RESPIRATORY_VARIANTS.every((variant) => variant.reviewStatus === 'pending'))

const reviewedNodes = RESPIRATORY_ATLAS_GRAPH.nodes.filter((node) => node.reviewStatus === 'recorded')
assert.equal(reviewedNodes.length, 0, 'No respiratory node may imply completed academic review before review metadata is actually recorded.')

console.log(`Respiratory atlas topology verified: ${RESPIRATORY_ATLAS_GRAPH.nodes.length} nodes, ${terminals.length} terminal segment representations, bilateral airway continuity, explicit left-sided nomenclature variants, and pending-review safety.`)
