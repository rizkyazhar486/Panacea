// Memuat layer GLB persis seperti viewer (GLTFLoader + meshopt) dan mengurutkan mesh
// dengan traverse() yang sama, supaya indeks mesh di berkas pendamping AO cocok 1:1.
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export const LAYERS = ['surface', 'skeletal', 'muscular', 'cardiovascular', 'nervous', 'visceral', 'lymphoid']

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

export async function loadLayerMeshes(glbPath) {
  await MeshoptDecoder.ready
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  const buf = readFileSync(glbPath)
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  const gltf = await loader.parseAsync(ab, '')
  gltf.scene.updateMatrixWorld(true)
  const meshes = []
  gltf.scene.traverse((o) => { if (o.isMesh) meshes.push(o) })
  return { meshes, sourceSha256: sha256(buf) }
}
