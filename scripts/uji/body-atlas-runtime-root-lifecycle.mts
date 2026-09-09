import assert from 'node:assert/strict'
import * as THREE from 'three'
import {
  bodyAtlasRuntimeRootCount,
  clearBodyAtlasRuntimeRoots,
  createBodyAtlasRuntimeRootOwner,
  getBodyAtlasRuntimeRoot,
} from '../../src/lib/bodyAtlasRuntimeRoots.ts'
import { createBodyAtlasRuntimeRootLifecycle } from '../../src/lib/bodyAtlasRuntimeRootLifecycle.ts'

const cleanupOwner = createBodyAtlasRuntimeRootOwner('test-cleanup')
clearBodyAtlasRuntimeRoots(cleanupOwner)

const first = createBodyAtlasRuntimeRootLifecycle('viewer-a')
const skeletal = new THREE.Group()
skeletal.name = 'skeletal-test-root'

assert.equal(first.active, true)
assert.equal(first.publish('skeletal.glb', skeletal), true)
assert.equal(getBodyAtlasRuntimeRoot('skeletal.glb'), skeletal)
assert.equal(bodyAtlasRuntimeRootCount(), 1)

assert.equal(first.dispose(), 1)
assert.equal(first.active, false)
assert.equal(getBodyAtlasRuntimeRoot('skeletal.glb'), null)
assert.equal(first.publish('skeletal.glb', skeletal), false)
assert.equal(first.clear('skeletal.glb'), false)
assert.equal(first.dispose(), 0)

const stale = createBodyAtlasRuntimeRootLifecycle('viewer-stale')
const current = createBodyAtlasRuntimeRootLifecycle('viewer-current')
const staleRoot = new THREE.Group()
const currentRoot = new THREE.Group()

assert.equal(stale.publish('muscular.glb', staleRoot), true)
assert.equal(current.publish('muscular.glb', currentRoot), true)
assert.equal(getBodyAtlasRuntimeRoot('muscular.glb'), currentRoot)

// A stale viewer may dispose its lifecycle, but it cannot clear a root that a
// newer viewer has replaced under a different opaque owner.
assert.equal(stale.dispose(), 0)
assert.equal(getBodyAtlasRuntimeRoot('muscular.glb'), currentRoot)
assert.equal(current.clear('muscular.glb'), true)
assert.equal(getBodyAtlasRuntimeRoot('muscular.glb'), null)
assert.equal(current.dispose(), 0)

const bounded = createBodyAtlasRuntimeRootLifecycle('viewer-bounded')
assert.equal(bounded.publish('not-shipped.glb', new THREE.Group()), false)
assert.equal(bodyAtlasRuntimeRootCount(), 0)
assert.equal(bounded.dispose(), 0)

console.log('body-atlas-runtime-root-lifecycle: ok (owner-scoped publish/clear/dispose; stale-owner safe; shipped files only)')
