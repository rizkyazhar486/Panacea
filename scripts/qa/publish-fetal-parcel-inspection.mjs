import { readFile, mkdir, copyFile, writeFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { surfaceHash } from '../../qa/reference-surface-hash.mjs'
import { parseFetalParcelDataset } from '../../src/domains/body-exposure/engine/fetalParcelInspection.ts'

const [prepared, output] = process.argv.slice(2)
if (!prepared || !output) throw new Error('Usage: node publish-fetal-parcel-inspection.mjs PREPARED NEW_OUTPUT')
try { await access(output); throw new Error('Output already exists; refusing to overwrite') } catch (error) { if (error.code !== 'ENOENT') throw error }
const manifest = JSON.parse(await readFile(path.join(prepared, 'manifest.json'), 'utf8'))
const raw = await readFile(path.join(prepared, 'regions.glb'))
const packed = await readFile(path.join(prepared, 'regions.meshopt.glb'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
if (hash(raw) !== '63505eedb8867bbd0a6f7abf646edbffc19357eaf5e622871b21604a8b62bb13' || hash(raw) !== manifest.source_glb_sha256) throw new Error('Pinned source QA GLB differs')
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
async function surfaces(bytes) {
  const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  gltf.scene.updateMatrixWorld(true)
  const rows = new Map()
  gltf.scene.traverse(mesh => {
    if (!mesh.isMesh) return
    let owner = mesh
    while (owner && owner.userData.source_label === undefined) owner = owner.parent
    const extra = owner?.userData, label = extra?.source_label
    if (!Number.isInteger(label) || label < 1 || label > 9 || rows.has(label)
        || extra.anatomical_identity !== 'unresolved' || extra.clinical_validation !== 'pending'
        || extra.runtime_admission !== manifest.runtime_admission || extra.license !== manifest.license) throw new Error('Source region identity/status differs')
    rows.set(label, { surface_sha256: surfaceHash(mesh), triangles: (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3 })
  })
  if (rows.size !== 9) throw new Error('All nine source regions required')
  return rows
}
const original = await surfaces(raw), exported = await surfaces(packed)
for (const region of manifest.regions) {
  const a = original.get(region.source_label), b = exported.get(region.source_label)
  if (a.surface_sha256 !== b.surface_sha256 || a.triangles !== b.triangles || b.triangles !== region.triangles) throw new Error('Source surface or winding changed during packing')
  region.surface_sha256 = a.surface_sha256
}
manifest.packed_glb_sha256 = hash(packed)
manifest.packed_glb_bytes = packed.byteLength
manifest.packing = { tool: 'gltfpack 1.3.0', args: ['-c', '-kn', '-km', '-ke', '-noq'], simplification: false, position_quantization: false,
  surface_comparison: 'World-space indexed triangle/winding SHA256 at one-micrometre rounding' }
parseFetalParcelDataset(manifest)
await mkdir(path.dirname(output), { recursive: true })
await mkdir(output, { recursive: false })
await copyFile(path.join(prepared, 'regions.meshopt.glb'), path.join(output, 'regions.glb'))
await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(`Published nine anonymous regions (${packed.byteLength} bytes); source surfaces retained; named-lobe admission unchanged`)
