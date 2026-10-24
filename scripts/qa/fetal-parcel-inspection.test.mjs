import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { surfaceHash } from '../../qa/reference-surface-hash.mjs'
import { auditSurface } from './fetal-surface-validation.mjs'
import { parseFetalParcelDataset, visibleParcelTriangles, wholeLungOverlap, FETAL_PARCEL_COLORS } from '../../src/domains/body-exposure/engine/fetalParcelInspection.ts'

const base = new URL('../../public/bodyexposure/dataset-inspection/fetal-parcels/', import.meta.url)
const dataset = JSON.parse(await readFile(new URL('manifest.json', base), 'utf8'))
const sourceAudit = JSON.parse(await readFile(new URL('../../bodyexposure/qa_reports/fetal_parcels_audit.json', import.meta.url), 'utf8'))
const bytes = await readFile(new URL('regions.glb', base))
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
gltf.scene.updateMatrixWorld(true)
const meshes = []; gltf.scene.traverse(mesh => { if (mesh.isMesh) meshes.push(mesh) })
const extras = mesh => { for (let owner = mesh; owner; owner = owner.parent) if (owner.userData.source_label !== undefined) return owner.userData; throw new Error('Source label missing') }

test('inspector retains source audit counts, hashes and unresolved identity outside canonical anatomy', async () => {
  assert.equal(parseFetalParcelDataset(dataset), dataset)
  assert.deepEqual(dataset.source_sha256, sourceAudit.source_sha256)
  assert.equal(dataset.source_revision, sourceAudit.source_repository_revision)
  assert.equal(dataset.source_glb_sha256, '63505eedb8867bbd0a6f7abf646edbffc19357eaf5e622871b21604a8b62bb13')
  for (const region of dataset.regions) for (const [key, value] of Object.entries(sourceAudit.regions.find(r => r.id === region.id))) assert.deepEqual(region[key], value, `${region.id} ${key}`)
  assert.equal(dataset.all_triangles, 115276)
  assert.equal(dataset.default_triangles, 71464)
  assert.equal(visibleParcelTriangles(dataset.regions, []), 0)
  assert.equal(visibleParcelTriangles(dataset.regions, [6,6]), 7730)
  assert.equal(wholeLungOverlap(dataset.regions[5]), 356 / 6698)
  assert.equal(new Set(FETAL_PARCEL_COLORS).size, 9)
  const matrix = JSON.parse(await readFile(new URL('../../public/bodyexposure/body_matrix.json', import.meta.url), 'utf8'))
  assert.ok(matrix.files.every(file => !/parcel/i.test(file)))
  const index = JSON.parse(await readFile(new URL('../../public/bodyexposure/fetus.index.json', import.meta.url), 'utf8'))
  assert.equal(index.length, 14)
  assert.ok(index.every(row => !/parcel|lobe/i.test(row.join(' '))))
})

test('all nine decoded surfaces retain geometry, winding, closed topology and source QA status', () => {
  assert.equal(meshes.length, 9)
  assert.deepEqual(new Set(meshes.map(mesh => extras(mesh).source_label)), new Set([1,2,3,4,5,6,7,8,9]))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), dataset.packed_glb_sha256)
  assert.ok(bytes.byteLength < 2086956)
  for (const mesh of meshes) {
    const meta = extras(mesh), region = dataset.regions.find(r => r.source_label === meta.source_label)
    assert.equal(meta.anatomical_identity, 'unresolved'); assert.equal(meta.clinical_validation, 'pending')
    assert.equal(meta.runtime_admission, 'blocked_label_identity_unresolved'); assert.equal(meta.license, 'CC0-1.0')
    assert.equal(surfaceHash(mesh), region.surface_sha256)
    const attributes = mesh.geometry.attributes.position, positions = [], point = new THREE.Vector3()
    for (let i = 0; i < attributes.count; i++) positions.push(...point.fromBufferAttribute(attributes, i).applyMatrix4(mesh.matrixWorld).toArray())
    const indices = mesh.geometry.index ? Array.from(mesh.geometry.index.array) : Array.from({ length: attributes.count }, (_, i) => i)
    const result = auditSurface(positions, indices)
    assert.equal(result.triangles, region.triangles)
    assert.ok(Math.abs(result.signedVolume * 1e9 - region.surface_volume_mm3) / region.surface_volume_mm3 < 1e-4)
  }
})

for (const [name, mutate] of [
  ['clinical promotion', data => { data.clinical_validation = 'validated' }],
  ['guessed lobe name', data => { data.regions[0].anatomical_name = 'Superior lobe' }],
  ['lost label', data => { data.regions.pop() }],
  ['duplicate label', data => { data.regions[1].source_label = 1 }],
  ['changed voxel accounting', data => { data.regions[0].voxels++ }],
  ['missing closure evidence', data => { delete data.regions[0].boundary_edges }],
  ['altered display defaults', data => { data.default_labels = [1,2,3,4,5,6,7,8,9] }],
  ['unsafe asset path', data => { data.asset = '../../patient.glb' }],
  ['changed source URL', data => { data.source = 'https://example.test/other-atlas' }],
  ['changed source revision', data => { data.source_revision = '0'.repeat(40) }],
  ['changed license', data => { data.license = 'CC-BY-4.0' }],
  ['changed coordinate frame', data => { data.coordinate_frame = '+X subject right; millimetres' }],
  ['missing source hashes', data => { delete data.source_sha256 }],
  ['changed region-mask hash', data => { data.source_sha256['reo-fetal-t2w-body-atlas-mask-lungs_multi-10.nii.gz'] = '0'.repeat(64) }],
  ['changed organ-mask hash', data => { data.source_sha256['reo-fetal-t2w-body-atlas-mask-body_organs-10.nii.gz'] = '0'.repeat(64) }],
  ['changed original surface hash', data => { data.source_glb_sha256 = '0'.repeat(64) }],
]) test(`rejects ${name}`, () => { const data = structuredClone(dataset); mutate(data); assert.throws(() => parseFetalParcelDataset(data)) })
