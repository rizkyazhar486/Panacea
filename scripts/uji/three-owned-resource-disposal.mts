import assert from 'node:assert/strict'
import * as THREE from 'three'
import { disposeOwnedObject3DResources } from '../../src/lib/threeOwnedResourceDisposal.ts'

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

console.log('owned Three resource disposal: ok')
