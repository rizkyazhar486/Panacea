import * as THREE from 'three'
import { matchBakedAo, aoToVertexColors, type AoLayerEntry } from '../engine/bakedAo'

// Batas I/O: mengambil berkas pendamping AO dan memasangnya ke mesh layer.
// Kegagalan apa pun (berkas tidak ada, tak cocok, hash salah) berarti layer tampil
// tanpa AO — tidak pernah memblokir atau merusak render.

// Kekuatan pemasangan: hasil bake (rata-rata otot ~0.68) terlalu menggelapkan bila dipakai penuh.
const AO_STRENGTH = 0.6

interface AoManifest {
  version: number
  layers: Record<string, AoLayerEntry & { binFile: string; binSha256: string }>
}

const manifestCache = new Map<string, Promise<AoManifest | null>>()
const binCache = new Map<string, Promise<Uint8Array | null>>()

function baseUrl(): string {
  return `${import.meta.env.BASE_URL}anatomy/ao/`
}

function loadManifest(): Promise<AoManifest | null> {
  let p = manifestCache.get('m')
  if (!p) {
    p = fetch(`${baseUrl()}manifest.json`)
      .then((r) => (r.ok ? (r.json() as Promise<AoManifest>) : null))
      .catch(() => null)
    manifestCache.set('m', p)
  }
  return p
}

async function sha256Hex(bytes: Uint8Array): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return null
  const digest = await subtle.digest('SHA-256', bytes as unknown as BufferSource)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function loadBin(file: string, expectedSha: string): Promise<Uint8Array | null> {
  let p = binCache.get(file)
  if (!p) {
    p = fetch(`${baseUrl()}${file}`)
      .then(async (r) => {
        if (!r.ok) return null
        const bytes = new Uint8Array(await r.arrayBuffer())
        const sha = await sha256Hex(bytes) // tidak tersedia di konteks tak aman: lewati hash, cocokkan struktur saja
        return sha !== null && sha !== expectedSha ? null : bytes
      })
      .catch(() => null)
    binCache.set(file, p)
  }
  return p
}

/** @returns true bila AO terpasang pada layer ini. */
export async function applyBakedAoToLayer(layerKey: string, root: THREE.Object3D): Promise<boolean> {
  const manifest = await loadManifest()
  const entry = manifest?.layers?.[layerKey]
  if (!manifest || !entry) return false
  const bin = await loadBin(entry.binFile, entry.binSha256)
  if (!bin) return false

  const meshes: THREE.Mesh[] = []
  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh) })
  const info = meshes.map((m) => ({ name: m.name, vertexCount: m.geometry.attributes.position.count }))
  if (!matchBakedAo(entry, info, bin.length).ok) return false

  meshes.forEach((m, k) => {
    const g = m.geometry
    if (!g.attributes.color) {
      const { offset, vertexCount } = entry.meshes[k]
      g.setAttribute('color', new THREE.BufferAttribute(aoToVertexColors(bin, offset, vertexCount, AO_STRENGTH), 3, true))
    }
  })
  const owned = (root.userData.body3dOwnedMaterials ?? []) as THREE.Material[]
  for (const material of owned) {
    ;(material as THREE.MeshStandardMaterial).vertexColors = true
    material.needsUpdate = true
  }
  return true
}
