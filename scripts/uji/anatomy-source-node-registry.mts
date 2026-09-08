import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  anatomySourceNameMatchesHint,
  anatomySourceNodeOrigin,
  clearAllAnatomySourceNodes,
  getEffectiveAnatomySourceNodeSnapshot,
  publishAnatomySourceNodes,
  resolveAllAnatomySourceNodes,
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
assert.equal(anatomySourceNameMatchesHint('Main bronchus.l', 'bronch'), true, 'reviewed stems of five or more characters may resolve source tokens')
assert.equal(anatomySourceNameMatchesHint('Gluteus medius muscle.r', 'glute'), true, 'long catalogue stems should resolve their full anatomical source token')

const femurMatches = resolveAnatomySourceNodes(['femur'], [skeletal], 32)
assert.ok(femurMatches.length > 0)
assert.ok(femurMatches.flatMap((match) => match.names).includes('Femur.l'))
assert.ok(femurMatches.flatMap((match) => match.names).includes('Femur.r'))

const specificFirst = resolveAnatomySourceNodes(
  ['carotid', 'artery'],
  [{
    file: 'cardiovascular.glb',
    names: ['Common carotid artery', 'Femoral artery'],
  }],
  8,
)
assert.deepEqual(
  specificFirst.map((match) => match.hint),
  ['carotid'],
  'specific-first resolution must stop at the first reviewed hint that yields source nodes',
)
assert.deepEqual(
  specificFirst.flatMap((match) => match.names),
  ['Common carotid artery'],
  'a generic fallback must not broaden a successful specific anatomy match',
)

const grouped = resolveAllAnatomySourceNodes(
  ['heart', 'aorta', 'vena cava'],
  [{
    file: 'cardiovascular.glb',
    names: ['Heart', 'Aorta', 'Superior vena cava', 'Hippocampus.r'],
  }],
  8,
)
assert.deepEqual(
  grouped.map((match) => match.hint),
  ['heart', 'aorta', 'vena cava'],
  'each reviewed component hint should be allowed to contribute exact source nodes',
)
assert.deepEqual(
  grouped.flatMap((match) => match.names),
  ['Heart', 'Aorta', 'Superior vena cava'],
  'multi-structure atlas targets must resolve every reviewed component through the composite resolver',
)

const deduplicated = resolveAllAnatomySourceNodes(
  ['aorta', 'aorta'],
  [{ file: 'cardiovascular.glb', names: ['Aorta'] }],
)
assert.equal(deduplicated.flatMap((match) => match.names).length, 1, 'the same source node must not be emitted twice across overlapping composite hints')

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

const body3dSource = readFileSync(new URL('../../src/components/Body3D.tsx', import.meta.url), 'utf8')
assert.match(
  body3dSource,
  /publishAnatomySourceNodes\(def\.file, sourceNodeNames\)/,
  'Body3D must publish original GLTF node names after a layer is loaded',
)
assert.match(
  body3dSource,
  /clearAnatomySourceNodes\(def\.file\)/,
  'Body3D must clear runtime node provenance when a layer is unloaded or the viewer unmounts',
)
assert.ok(
  body3dSource.indexOf('const sourceNodeNames: string[] = []') > body3dSource.indexOf('const clone = group.clone(true)'),
  'runtime node collection should happen on the loaded clone, not in the render loop',
)

console.log('Z-Anatomy source-node resolver preserves exact GLB provenance, separates specific-first fallback from composite resolution, and publishes runtime renderer nodes.')
