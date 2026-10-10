import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { lightingSettings } from '../../src/domains/body-exposure/engine/presentationLighting.ts'
import { createPresentationLighting } from '../../src/domains/body-exposure/adapters/studioLighting.ts'

// Matrix: accepted modes; type/finite/range rejection without writes; exact EV
// boundaries; default parity; camera/target transforms; disposal; no asset mutation.
test('standard defaults preserve original renderer settings', () => {
  assert.deepEqual(lightingSettings('standard', 0), { ok: true,
    settings: { mode: 'standard', exposureEV: 0 }, multiplier: 1, environmentIntensity: 0.55 })
})
test('studio EV is exactly power-of-two and bounded at both ends', () => {
  for (const [ev, expected] of [[-2, 0.25], [0, 1], [1, 2], [2, 4]]) {
    assert.deepEqual(lightingSettings('studio', ev), { ok: true,
      settings: { mode: 'studio', exposureEV: ev }, multiplier: expected, environmentIntensity: 0.25 })
  }
  for (const ev of [-3, 3, -2.001, 2.001]) assert.deepEqual(lightingSettings('studio', ev), { ok: false, reason: 'invalid-exposure' })
})
test('unknown modes fail closed, including prototype-like strings', () => {
  for (const mode of ['', 'cinematic', 'constructor', '__proto__', null, undefined, 0, {}, ['studio']]) {
    assert.deepEqual(lightingSettings(mode, 0), { ok: false, reason: 'invalid-mode' })
  }
})
test('invalid exposure types and nonfinite values fail closed', () => {
  for (const ev of ['', '1', null, undefined, {}, [], NaN, Infinity, -Infinity]) {
    assert.deepEqual(lightingSettings('standard', ev), { ok: false, reason: 'invalid-exposure' })
  }
})
function rig() {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera()
  const renderer = { toneMappingExposure: 1 }
  const lighting = createPresentationLighting(scene, camera, renderer)
  const standard = scene.getObjectByName('panacea-standard-lighting')
  const studio = scene.getObjectByName('panacea-studio-lighting')
  return { scene, camera, renderer, lighting, standard, studio }
}
test('standard rig retains original colors, powers and fixed positions', () => {
  const { standard, studio } = rig()
  assert.equal(standard.visible, true); assert.equal(studio.visible, false)
  const lights = standard.children.filter(o => o.isLight)
  assert.deepEqual(lights.map(l => l.intensity), [1.4, 2.2, 1.2])
  assert.deepEqual(lights.map(l => l.color.getHex()), [0xdfe8ff, 0xfff4ea, 0xcfe3ff])
  assert.deepEqual(lights.slice(1).map(l => l.position.toArray()), [[-2, 3, 3], [2, 2, -3]])
  assert.equal(studio.children.filter(o => o.isDirectionalLight).length, 2)
  assert.equal(studio.children.filter(o => o.isHemisphereLight).length, 1)
})
test('invalid adapter inputs cause no partial writes', () => {
  const { scene, renderer, lighting, standard, studio } = rig()
  assert.equal(lighting.apply('studio', 1), true)
  for (const [mode, ev] of [['invalid', 0], ['standard', NaN], ['standard', Infinity], ['standard', 3], ['standard', '0']]) {
    assert.equal(lighting.apply(mode, ev), false)
    assert.equal(renderer.toneMappingExposure, 2); assert.equal(scene.environmentIntensity, 0.25)
    assert.equal(standard.visible, false); assert.equal(studio.visible, true)
  }
  assert.equal(lighting.apply('standard', 0), true)
  assert.equal(renderer.toneMappingExposure, 1); assert.equal(scene.environmentIntensity, 0.55)
  assert.equal(standard.visible, true); assert.equal(studio.visible, false)
})
test('studio light and target follow the camera world orientation and orbit target', () => {
  const { scene, camera, lighting, studio } = rig()
  const parent = new THREE.Group(); parent.rotation.y = Math.PI / 2; parent.add(camera); scene.add(parent)
  const target = new THREE.Vector3(4, 5, 6)
  lighting.apply('studio', 0); lighting.update(target); scene.updateMatrixWorld(true)
  const key = studio.children.find(o => o.isDirectionalLight)
  const actual = key.getWorldPosition(new THREE.Vector3())
  const expected = new THREE.Vector3(-2, 2, 3).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion())).add(target)
  assert.ok(actual.distanceTo(expected) < 1e-12)
  assert.ok(key.target.getWorldPosition(new THREE.Vector3()).distanceTo(target) < 1e-12)
  for (const light of studio.children.filter(o => o.isLight)) assert.equal(light.castShadow, false)
  lighting.apply('standard', 0); lighting.update(new THREE.Vector3(99, 99, 99))
  assert.deepEqual(scene.getObjectByName('panacea-standard-lighting').position.toArray(), [0, 0, 0])
})
test('lighting cannot mutate anatomical identity or materials and cleanup is idempotent', () => {
  const { scene, lighting, renderer } = rig()
  const source = new THREE.Object3D(); source.userData = { panacea_structure_id: 'SOURCE.ID', review_status: 'review_required' }
  source.position.set(1, 2, 3); scene.add(source)
  const before = JSON.stringify(source.toJSON())
  lighting.apply('studio', -2); lighting.update(new THREE.Vector3(2, 3, 4))
  assert.equal(JSON.stringify(source.toJSON()), before)
  lighting.dispose(); lighting.dispose()
  assert.deepEqual(scene.children, [source])
  assert.equal(lighting.apply('standard', 0), false)
  assert.equal(renderer.toneMappingExposure, 0.25)
})
