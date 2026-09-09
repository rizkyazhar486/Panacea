import assert from 'node:assert/strict'
import {
  bindAnatomyNodesToSourceSnapshot,
  normalizeExactAnatomyName,
  type AnatomyBindingNode,
} from '../../src/lib/anatomy/sourceBinding.ts'

const nodes: AnatomyBindingNode[] = [
  { id: 'heart', label: 'Heart', aliases: ['cardiac organ'], sourceNodeAliases: ['Heart'] },
  { id: 'aorta', label: 'Aorta', aliases: ['aortic tree'], sourceNodeAliases: ['Aorta'] },
  { id: 'right-main-bronchus', label: 'Right main bronchus', aliases: ['right mainstem bronchus'], sourceNodeAliases: ['Right_Main_Bronchus'] },
]

const report = bindAnatomyNodesToSourceSnapshot(nodes, [
  { file: 'cardiovascular.glb', names: ['Aorta', 'Heart', 'Heartburn'] },
  { file: 'visceral.glb', names: ['Right_Main_Bronchus', 'Right_Main_Bronchus_extra'] },
])

assert.equal(report.ambiguous.length, 0)
assert.deepEqual(report.unboundNodeIds, [])
assert.deepEqual(report.bindings.map((binding) => `${binding.nodeId}:${binding.sourceName}`), [
  'aorta:Aorta',
  'heart:Heart',
  'right-main-bronchus:Right_Main_Bronchus',
])
assert.ok(!report.bindings.some((binding) => binding.sourceName === 'Heartburn'))
assert.ok(!report.bindings.some((binding) => binding.sourceName.endsWith('_extra')))
assert.equal(normalizeExactAnatomyName('Right_Main-Bronchus'), 'right main bronchus')

const ambiguous = bindAnatomyNodesToSourceSnapshot([
  { id: 'node-a', label: 'Node A', aliases: ['shared mesh'], sourceNodeAliases: [] },
  { id: 'node-b', label: 'Node B', aliases: ['shared-mesh'], sourceNodeAliases: [] },
], [{ file: 'test.glb', names: ['shared mesh'] }])
assert.equal(ambiguous.bindings.length, 0)
assert.deepEqual(ambiguous.ambiguous[0]?.claimantNodeIds, ['node-a', 'node-b'])
assert.deepEqual(ambiguous.unboundNodeIds, ['node-a', 'node-b'])

assert.throws(
  () => bindAnatomyNodesToSourceSnapshot([...nodes, { ...nodes[0] }], []),
  /Duplicate anatomy binding node id/,
)

const deterministicA = bindAnatomyNodesToSourceSnapshot(nodes, [
  { file: 'visceral.glb', names: ['Right_Main_Bronchus'] },
  { file: 'cardiovascular.glb', names: ['Heart', 'Aorta'] },
])
const deterministicB = bindAnatomyNodesToSourceSnapshot([...nodes].reverse(), [
  { file: 'cardiovascular.glb', names: ['Aorta', 'Heart'] },
  { file: 'visceral.glb', names: ['Right_Main_Bronchus'] },
])
assert.deepEqual(deterministicA, deterministicB)

console.log('Anatomy source binding verified: exact-only mesh identity, ambiguity fail-close, collision safety, and deterministic source snapshots.')
