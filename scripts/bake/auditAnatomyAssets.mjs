// Audit deterministik layer anatomi terkirim: geometri, skala, anggaran, dan provenance jujur.
// Dipakai oleh `audit-anatomy-assets.mjs` (menulis/memeriksa manifest) dan gate `anatomy-asset-manifest`.
// Tanpa Date.now/Math.random: dua kali jalan pada GLB yang sama menghasilkan manifest identik.
import { readFileSync, statSync } from 'node:fs'
import * as THREE from 'three'
import { LAYERS, loadLayerMeshes, sha256 } from './anatomyLayers.mjs'

export const MANIFEST_VERSION = 1
export const ACCURACY_STATUSES = ['source-backed-unreviewed', 'source-backed-reviewed', 'procedural-approximation', 'visual-placeholder', 'educational-schematic']

const r4 = (x) => Math.round(x * 1e4) / 1e4

export async function auditLayer(layer, dir = 'public/anatomy') {
  const file = `${dir}/${layer}.glb`
  const bytes = readFileSync(file)
  const { meshes } = await loadLayerMeshes(file)
  let vertices = 0
  let triangles = 0
  const geometries = new Set()
  const materials = new Set()
  const box = new THREE.Box3()
  const tmp = new THREE.Box3()
  for (const m of meshes) {
    const g = m.geometry
    vertices += g.attributes.position.count
    triangles += (g.index ? g.index.count : g.attributes.position.count) / 3
    geometries.add(g.uuid)
    for (const mat of Array.isArray(m.material) ? m.material : [m.material]) materials.add(mat.uuid)
    if (!g.boundingBox) g.computeBoundingBox()
    tmp.copy(g.boundingBox).applyMatrix4(m.matrixWorld)
    box.union(tmp)
  }
  const size = box.getSize(new THREE.Vector3())
  // Ekstensi diambil dari JSON GLB (bagian JSON ada setelah header 20 byte).
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'))
  return {
    file: `${layer}.glb`,
    sizeBytes: statSync(file).size,
    sha256: sha256(bytes),
    meshCount: meshes.length,
    uniqueGeometries: geometries.size,
    vertexCount: vertices,
    triangleCount: triangles,
    materialCount: materials.size,
    extensionsUsed: [...(json.extensionsUsed ?? [])].sort(),
    boundsMeters: { min: box.min.toArray().map(r4), max: box.max.toArray().map(r4), size: size.toArray().map(r4) },
  }
}

// Pernyataan provenance/akurasi: sengaja konservatif. Tidak ada layer yang diklaim tervalidasi.
export function provenanceFor() {
  return {
    sourceRegistryId: 'z_anatomy',
    sourceRegistryFile: 'data/source-registry/anatomy/z-anatomy.json',
    upstream: 'Z-Anatomy / BodyParts3D (revisi upstream tidak dipin di repositori)',
    license: 'CC-BY-SA-4.0',
    licenseNote: 'Registri sumber menyatakan ada pengecualian lisensi tingkat-aset (termasuk NC) di upstream; per-mesh belum ditinjau. Jangan simpulkan izin komersial dari lisensi tingkat repositori.',
    accuracyStatus: 'source-backed-unreviewed',
    validated: false,
    revisionPinned: false,
    educationalOnly: true,
  }
}

export async function buildManifest(dir = 'public/anatomy') {
  const layers = {}
  const totals = { sizeBytes: 0, meshCount: 0, vertexCount: 0, triangleCount: 0, materialCount: 0 }
  for (const layer of LAYERS) {
    const a = await auditLayer(layer, dir)
    layers[layer] = { ...a, ...provenanceFor() }
    totals.sizeBytes += a.sizeBytes
    totals.meshCount += a.meshCount
    totals.vertexCount += a.vertexCount
    totals.triangleCount += a.triangleCount
    totals.materialCount += a.materialCount
  }
  return {
    version: MANIFEST_VERSION,
    purpose: 'Audit deterministik layer anatomi terkirim (geometri, skala, anggaran) dan pernyataan provenance yang jujur. Bukan validasi anatomi.',
    coordinateConvention: 'glTF: 1 unit = 1 meter, +Y atas (superior), tubuh tegak menghadap +Z (anterior). Diukur dari batas dunia; lihat boundsMeters.',
    totals,
    layers,
  }
}
