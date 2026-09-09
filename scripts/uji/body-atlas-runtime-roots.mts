import assert from 'node:assert/strict'
import * as THREE from 'three'
import {
  bodyAtlasRuntimeRootCount,
  clearBodyAtlasRuntimeRoot,
  clearBodyAtlasRuntimeRoots,
  createBodyAtlasRuntimeRootOwner,
  getBodyAtlasRuntimeRoot,
  getBodyAtlasRuntimeSourceRoots,
  isBodyAtlasRuntimeRootLoaded,
  publishBodyAtlasRuntimeRoot,
} from '../../src/lib/bodyAtlasRuntimeRoots.ts'

const oldViewer = createBodyAtlasRuntimeRootOwner('old-viewer')
const newViewer = createBodyAtlasRuntimeRootOwner('new-viewer')
const skeletalOld = new THREE.Group()
skeletalOld.name = 'skeletal-old'
const skeletalNew = new THREE.Group()
skeletalNew.name = 'skeletal-new'
const muscularNew = new THREE.Group()
muscularNew.name = 'muscular-new'

assert.equal(bodyAtlasRuntimeRootCount(), 0)
assert.equal(publishBodyAtlasRuntimeRoot(oldViewer, 'skeletal.glb', skeletalOld), true)
assert.strictEqual(getBodyAtlasRuntimeRoot('skeletal.glb'), skeletalOld, 'registry must preserve exact Object3D identity')
assert.equal(isBodyAtlasRuntimeRootLoaded('skeletal.glb'), true)

assert.equal(publishBodyAtlasRuntimeRoot(newViewer, 'skeletal.glb', skeletalNew), true)
assert.strictEqual(getBodyAtlasRuntimeRoot('skeletal.glb'), skeletalNew, 'new mounted owner may replace the same source file')
assert.equal(clearBodyAtlasRuntimeRoot(oldViewer, 'skeletal.glb'), false, 'stale owner must not clear a newer viewer root')
assert.strictEqual(getBodyAtlasRuntimeRoot('skeletal.glb'), skeletalNew)

assert.equal(publishBodyAtlasRuntimeRoot(newViewer, 'muscular.glb', muscularNew), true)
assert.equal(bodyAtlasRuntimeRootCount(), 2)
const snapshot = getBodyAtlasRuntimeSourceRoots()
assert.deepEqual(snapshot.map((entry) => entry.file), ['muscular.glb', 'skeletal.glb'])
assert.strictEqual(snapshot.find((entry) => entry.file === 'skeletal.glb')?.root, skeletalNew)
assert.strictEqual(snapshot.find((entry) => entry.file === 'muscular.glb')?.root, muscularNew)

assert.equal(publishBodyAtlasRuntimeRoot(newViewer, 'not-a-shipped-layer.glb', new THREE.Group()), false, 'unmanifested files fail closed')
assert.equal(bodyAtlasRuntimeRootCount(), 2)

const beforePosition = skeletalNew.position.clone()
const beforeChildren = skeletalNew.children.length
void getBodyAtlasRuntimeSourceRoots()
assert.ok(skeletalNew.position.equals(beforePosition), 'snapshot must not transform source roots')
assert.equal(skeletalNew.children.length, beforeChildren, 'snapshot must not mutate source geometry hierarchy')

assert.equal(clearBodyAtlasRuntimeRoots(oldViewer), 0, 'stale owner cleanup must not affect current roots')
assert.equal(bodyAtlasRuntimeRootCount(), 2)
assert.equal(clearBodyAtlasRuntimeRoots(newViewer), 2)
assert.equal(bodyAtlasRuntimeRootCount(), 0)
assert.equal(getBodyAtlasRuntimeRoot('skeletal.glb'), null)

console.log('body-atlas-runtime-roots: owner-safe exact Object3D lifecycle verified without loading, cloning, geometry mutation, or stale-owner clearing')
