import assert from 'node:assert/strict'
import {
  anatomySourceNameMatchesHint,
  anatomySourceNodeOrigin,
  clearAllAnatomySourceNodes,
  getEffectiveAnatomySourceNodeSnapshot,
  publishAnatomySourceNodes,
  resolveAnatomySourceNodes,
} from '../../src/lib/anatomySourceNodeRegistry.ts'

clearAllAnatomySourceNodes()

const indexed = getEffectiveAnatomySourceNodeSnapshot()
assert.ok(indexed.length >= 7, 'generated GLB index should cover the shipped whole-body layer families')

const skeletal = indexed.find((bundle) => bundle.file === 'skeletal.glb')
const muscular = indexed.find((bundle) => bundle.file === 'muscular.glb')
assert.ok(skeletal, 'skeletal GLB must be represented in the generated source-node index')
assert.ok(muscular, 'muscular GLB must remain available as an indexed fallback')
assert.ok(skeletal.names.includes('Femur.l'), 'generated source index must preserve exact left-femur GLTF name')
assert.ok(skeletal.names.includes('Femur.r'), 'generated source index must preserve exact right-femur GLTF name')
assert.equal(anatomySourceNodeOrigin('skeletal.glb'), 'generated-index')

assert.equal(anatomySourceNameMatchesHint('Femur.r', 'femur'), true)
assert.equal(anatomySourceNameMatchesHint('Hip joint', 'hip'), true)
assert.equal(anatomySourceNameMatchesHint('Hippocampus.r', 'hip'), false, 'short anatomy hints must not match unrelated longer words')

const femurMatches = resolveAnatomySourceNodes(['femur'], [skeletal], 32)
assert.ok(femurMatches.length > 0)
assert.ok(femurMatches.flatMap((match) => match.names).includes('Femur.l'))
assert.ok(femurMatches.flatMap((match) => match.names).includes('Femur.r'))

publishAnatomySourceNodes('skeletal.glb', ['Femur.r', 'Femur.l', 'Femur.r'])
const withRuntime = getEffectiveAnatomySourceNodeSnapshot()
const runtimeSkeletal = withRuntime.find((bundle) => bundle.file === 'skeletal.glb')
const fallbackMuscular = withRuntime.find((bundle) => bundle.file === 'muscular.glb')
assert.deepEqual(runtimeSkeletal?.names, ['Femur.l', 'Femur.r'], 'runtime bundle should replace only the corresponding file and remain deduplicated/sorted')
assert.equal(anatomySourceNodeOrigin('skeletal.glb'), 'runtime')
assert.equal(fallbackMuscular?.names.length, muscular.names.length, 'runtime publication for one layer must not erase indexed fallback for other layers')

clearAllAnatomySourceNodes()
const restored = getEffectiveAnatomySourceNodeSnapshot().find((bundle) => bundle.file === 'skeletal.glb')
assert.equal(anatomySourceNodeOrigin('skeletal.glb'), 'generated-index')
assert.ok((restored?.names.length ?? 0) > 2, 'clearing runtime data should restore the generated GLB index')

console.log('Z-Anatomy source-node resolver preserves exact GLB provenance and conservative matching.')
