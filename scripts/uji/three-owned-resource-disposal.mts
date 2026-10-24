import assert from 'node:assert/strict'
import * as THREE from 'three'
import { disposeOwnedObject3DResources } from '../../src/lib/bodyExposure/threeOwnedResourceDisposal.ts'

const root = new THREE.Group()
const sharedGeometry = new THREE.BoxGeometry(1, 1, 1)
const sharedTexture = new THREE.Texture()
const sharedMaterial = new THREE.MeshStandardMaterial({ map: sharedTexture })
root.add(new THREE.Mesh(sharedGeometry, sharedMaterial))
root.add(new THREE.Mesh(sharedGeometry, sharedMaterial))

let geometryDisposeEvents = 0
let materialDisposeEvents = 0
let textureDisposeEvents = 0
sharedGeometry.addEventListener('dispose', () => { geometryDisposeEvents += 1 })
sharedMaterial.addEventListener('dispose', () => { materialDisposeEvents += 1 })
sharedTexture.addEventListener('dispose', () => { textureDisposeEvents += 1 })

const report = disposeOwnedObject3DResources(root)
assert.deepEqual(report, { geometries: 1, materials: 1, textures: 1 })
assert.equal(geometryDisposeEvents, 1)
assert.equal(materialDisposeEvents, 1)
assert.equal(textureDisposeEvents, 1)

const arrayRoot = new THREE.Group()
const geometry = new THREE.SphereGeometry(1, 8, 6)
const texture = new THREE.Texture()
const materialA = new THREE.MeshBasicMaterial({ map: texture })
const materialB = new THREE.MeshBasicMaterial({ alphaMap: texture })
const mesh = new THREE.Mesh(geometry, [materialA, materialB])
arrayRoot.add(mesh)

const arrayReport = disposeOwnedObject3DResources(arrayRoot)
assert.deepEqual(arrayReport, { geometries: 1, materials: 2, textures: 1 })

const emptyReport = disposeOwnedObject3DResources(new THREE.Group())
assert.deepEqual(emptyReport, { geometries: 0, materials: 0, textures: 0 })

// Lines and points also own GPU resources, including material arrays and maps.
for (const kind of ['line', 'segments', 'points'] as const) {
  const geometry = new THREE.BufferGeometry()
  const texture = new THREE.Texture()
  const material = kind === 'points'
    ? new THREE.PointsMaterial({ map: texture })
    : new THREE.LineBasicMaterial({ map: texture })
  const secondMaterial = material.clone()
  const renderable = kind === 'points'
    ? new THREE.Points(geometry, [material, secondMaterial])
    : kind === 'segments'
      ? new THREE.LineSegments(geometry, [material, secondMaterial])
      : new THREE.Line(geometry, [material, secondMaterial])
  const nestedRoot = new THREE.Group()
  const nestedGroup = new THREE.Group()
  nestedRoot.add(nestedGroup)
  nestedGroup.add(renderable)
  const events = { geometry: 0, material: 0, texture: 0 }
  geometry.addEventListener('dispose', () => { events.geometry += 1 })
  material.addEventListener('dispose', () => { events.material += 1 })
  secondMaterial.addEventListener('dispose', () => { events.material += 1 })
  texture.addEventListener('dispose', () => { events.texture += 1 })
  assert.deepEqual(disposeOwnedObject3DResources(nestedRoot),
    { geometries: 1, materials: 2, textures: 1 }, kind)
  assert.deepEqual(events, { geometry: 1, material: 2, texture: 1 }, kind)
}

// Shared resources across different renderable kinds must still dispose once.
const mixedRoot = new THREE.Group()
const mixedGeometry = new THREE.BufferGeometry()
const mixedTexture = new THREE.Texture()
const mixedMaterial = new THREE.MeshBasicMaterial({ map: mixedTexture })
mixedRoot.add(new THREE.Mesh(mixedGeometry, mixedMaterial))
mixedRoot.add(new THREE.Line(mixedGeometry, mixedMaterial))
mixedRoot.add(new THREE.Points(mixedGeometry, mixedMaterial))
const mixedEvents = { geometry: 0, material: 0, texture: 0 }
mixedGeometry.addEventListener('dispose', () => { mixedEvents.geometry += 1 })
mixedMaterial.addEventListener('dispose', () => { mixedEvents.material += 1 })
mixedTexture.addEventListener('dispose', () => { mixedEvents.texture += 1 })
assert.deepEqual(disposeOwnedObject3DResources(mixedRoot),
  { geometries: 1, materials: 1, textures: 1 })
assert.deepEqual(mixedEvents, { geometry: 1, material: 1, texture: 1 })

console.log('owned Three resource disposal: ok')
