import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as THREE from 'three'
import { isAnatomyPickable, scaleAnatomyAtCenter } from '../../src/lib/anatomyMotion'

test('organ contraction preserves its center even when geometry is far from origin', () => {
  const organ = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 1).translate(10, 20, 30))
  organ.position.set(2, 3, 4); organ.rotation.z = .3; organ.scale.set(2, 1, 3)
  const center = new THREE.Box3().setFromObject(organ).getCenter(new THREE.Vector3())
  for (const factor of [.93, 1.01, 1, .93, 1]) {
    scaleAnatomyAtCenter(organ, factor)
    const after = new THREE.Box3().setFromObject(organ).getCenter(new THREE.Vector3())
    assert(after.distanceTo(center) < 1e-8)
  }
  assert(organ.position.distanceTo(new THREE.Vector3(2, 3, 4)) < 1e-8)
  assert(organ.scale.distanceTo(new THREE.Vector3(2, 1, 3)) < 1e-8)
})
test('repeated frames do not accumulate deformation and invalid factors are ignored', () => {
  const organ = new THREE.Mesh(new THREE.SphereGeometry(1).translate(5, 2, 0))
  scaleAnatomyAtCenter(organ, .95)
  const position = organ.position.clone()
  for (let i = 0; i < 1000; i++) scaleAnatomyAtCenter(organ, .95)
  assert(organ.position.distanceTo(position) < 1e-10)
  for (const factor of [NaN, Infinity, -1, 0]) scaleAnatomyAtCenter(organ, factor)
  assert(organ.position.distanceTo(position) < 1e-10)
  scaleAnatomyAtCenter(organ, 1)
  assert(organ.position.length() < 1e-8)
})

test('anisotropic breathing keeps the center fixed and still restores the original pose', () => {
  const organ = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 1).translate(10, 20, 30))
  organ.rotation.set(.1, .4, .3)
  const center = new THREE.Box3().setFromObject(organ).getCenter(new THREE.Vector3())
  scaleAnatomyAtCenter(organ, 1.004, 1.013, 1.009)
  assert(new THREE.Box3().setFromObject(organ).getCenter(new THREE.Vector3()).distanceTo(center) < 1e-8)
  scaleAnatomyAtCenter(organ, 1)
  assert(organ.position.length() < 1e-8)
})
test('hidden ancestors, faded tissue and clipped surfaces do not intercept anatomy picking', () => {
  const material = new THREE.MeshBasicMaterial()
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material)
  const parent = new THREE.Group()
  parent.add(mesh)
  const point = new THREE.Vector3(0, 0, 0)
  assert.equal(isAnatomyPickable(mesh, point), true)
  parent.visible = false
  assert.equal(isAnatomyPickable(mesh, point), false)
  parent.visible = true
  material.opacity = .1
  assert.equal(isAnatomyPickable(mesh, point), false)
  material.opacity = 1
  material.clippingPlanes = [new THREE.Plane(new THREE.Vector3(1, 0, 0), -1)]
  assert.equal(isAnatomyPickable(mesh, point), false)
})
