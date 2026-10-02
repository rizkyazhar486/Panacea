// Pencocokan berkas pendamping ambient occlusion (AO) dengan mesh yang sedang dimuat.
// AO dihitung dari geometri sumber oleh scripts/bake (lihat manifest.json) dan hanya boleh
// dipakai bila SETIAP mesh cocok persis; selain itu layer dirender tanpa AO (fail closed).
// Kenapa semua-atau-tidak: material layer dipakai bersama; mesh tanpa atribut warna pada
// material ber-vertexColors akan tampil hitam.

export interface AoMeshInfo {
  i: number
  name: string
  vertexCount: number
  offset: number
}

export interface AoLayerEntry {
  vertexTotal: number
  meshes: readonly AoMeshInfo[]
}

export interface LoadedMeshInfo {
  name: string
  vertexCount: number
}

export type AoMatch =
  | { ok: true }
  | { ok: false; reason: 'bin-size' | 'mesh-count' | 'mesh-index' | 'mesh-name' | 'vertex-count' | 'offset' | 'total' }

export function matchBakedAo(entry: AoLayerEntry, meshes: readonly LoadedMeshInfo[], binLength: number): AoMatch {
  if (entry.meshes.length !== meshes.length) return { ok: false, reason: 'mesh-count' }
  let expectedOffset = 0
  for (let k = 0; k < meshes.length; k += 1) {
    const info = entry.meshes[k]
    if (info.i !== k) return { ok: false, reason: 'mesh-index' }
    if (info.name !== meshes[k].name) return { ok: false, reason: 'mesh-name' }
    if (info.vertexCount !== meshes[k].vertexCount) return { ok: false, reason: 'vertex-count' }
    if (info.offset !== expectedOffset) return { ok: false, reason: 'offset' }
    expectedOffset += info.vertexCount
  }
  if (expectedOffset !== entry.vertexTotal) return { ok: false, reason: 'total' }
  if (binLength !== entry.vertexTotal) return { ok: false, reason: 'bin-size' }
  return { ok: true }
}

/**
 * Perluas AO 1-byte per titik menjadi RGB abu-abu (atribut warna normalized Uint8, itemSize 3).
 * `strength` 0..1 meredam efek saat dipakai (1 = persis hasil bake, 0 = tanpa AO); otot yang rapat
 * membuat rata-rata AO rendah, jadi pemasangan memakai < 1 agar eksposur keseluruhan terjaga.
 */
export function aoToVertexColors(ao: Uint8Array, offset: number, count: number, strength = 1): Uint8Array {
  if (!Number.isInteger(offset) || !Number.isInteger(count) || offset < 0 || count < 0 || offset + count > ao.length) {
    throw new RangeError('AO slice is outside the sidecar')
  }
  if (!(strength >= 0 && strength <= 1)) throw new RangeError('AO strength must be within [0, 1]')
  const out = new Uint8Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const v = Math.round(255 - strength * (255 - ao[offset + i]))
    out[i * 3] = v
    out[i * 3 + 1] = v
    out[i * 3 + 2] = v
  }
  return out
}
