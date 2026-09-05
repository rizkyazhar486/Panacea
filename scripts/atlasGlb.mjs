// Pembaca human-atlas dan penulis GLB, dipakai bersama oleh pemotong organ
// (atlasOrgan.mjs) dan pemotong kardiovaskular (atlasCardio.mjs).
//
// Susunan berkas sumbernya: atlas.json memuat daftar bagian, tiap bagian
// menunjuk potongan biner lewat offset byte absolut — posisi Float32, normal
// Int16 ternormalisasi, indeks Uint32. Tidak ada GLB di sumbernya; berkas GLB
// justru yang kita tulis di sini.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function bacaAtlas(sumber) {
  const atlas = JSON.parse(readFileSync(join(sumber, 'public/models/atlas.json'), 'utf8'))
  const potongan = atlas.chunks.map((c) => readFileSync(join(sumber, 'public', c.url)))
  return { atlas, potongan }
}

export function ambilBagian(potongan, p) {
  const b = potongan[p.chunk]
  const pos = new Float32Array(b.buffer.slice(b.byteOffset + p.positions, b.byteOffset + p.positions + p.vertexCount * 12))
  const nor16 = new Int16Array(b.buffer.slice(b.byteOffset + p.normals, b.byteOffset + p.normals + p.vertexCount * 6))
  const idx = new Uint32Array(b.buffer.slice(b.byteOffset + p.indices, b.byteOffset + p.indices + p.indexCount * 4))
  const nor = new Float32Array(nor16.length)
  for (let i = 0; i < nor16.length; i++) nor[i] = Math.max(-1, nor16[i] / 32767)
  return { nama: p.name, pos, nor, idx }
}

export function pusat(d) {
  let n = 0
  const c = [0, 0, 0]
  for (let i = 0; i < d.pos.length; i += 3) { c[0] += d.pos[i]; c[1] += d.pos[i + 1]; c[2] += d.pos[i + 2]; n++ }
  return c.map((v) => Number((v / n).toFixed(4)))
}

/**
 * Garis tengah satu pembuluh, dipakai untuk menganimasikan aliran darah.
 *
 * Satu pembuluh adalah tabung: titik pusatnya saja tidak cukup, karena aliran
 * harus bergerak SEPANJANG pembuluh, bukan berkedip di tengahnya. Sumbu
 * terpanjang dicari dengan iterasi pangkat pada matriks kovarians (arah dengan
 * sebaran terbesar), lalu titik dibagi ke dalam beberapa laci sepanjang sumbu
 * itu dan tiap laci diwakili titik pusatnya sendiri. Hasilnya mengikuti
 * lengkungan pembuluh — arkus aorta melengkung, bukan memotong lurus.
 */
export function garisTengah(d, jumlah = 8) {
  const c = pusat(d)
  const n = d.pos.length / 3
  // Kovarians 3x3.
  const cov = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  for (let i = 0; i < d.pos.length; i += 3) {
    const x = d.pos[i] - c[0], y = d.pos[i + 1] - c[1], z = d.pos[i + 2] - c[2]
    cov[0] += x * x; cov[1] += x * y; cov[2] += x * z
    cov[4] += y * y; cov[5] += y * z; cov[8] += z * z
  }
  cov[3] = cov[1]; cov[6] = cov[2]; cov[7] = cov[5]
  let v = [1, 1, 1]
  for (let it = 0; it < 32; it++) {
    const w = [
      cov[0] * v[0] + cov[1] * v[1] + cov[2] * v[2],
      cov[3] * v[0] + cov[4] * v[1] + cov[5] * v[2],
      cov[6] * v[0] + cov[7] * v[1] + cov[8] * v[2],
    ]
    const p = Math.hypot(w[0], w[1], w[2])
    if (p < 1e-12) break
    v = [w[0] / p, w[1] / p, w[2] / p]
  }
  // Proyeksikan tiap titik ke sumbu, lalu rata-ratakan per laci.
  let tMin = Infinity, tMax = -Infinity
  const t = new Float32Array(n)
  for (let i = 0, k = 0; i < d.pos.length; i += 3, k++) {
    t[k] = (d.pos[i] - c[0]) * v[0] + (d.pos[i + 1] - c[1]) * v[1] + (d.pos[i + 2] - c[2]) * v[2]
    if (t[k] < tMin) tMin = t[k]
    if (t[k] > tMax) tMax = t[k]
  }
  const lebar = (tMax - tMin) / jumlah || 1
  const jml = new Array(jumlah).fill(0)
  const sum = Array.from({ length: jumlah }, () => [0, 0, 0])
  for (let i = 0, k = 0; i < d.pos.length; i += 3, k++) {
    const b = Math.min(jumlah - 1, Math.max(0, Math.floor((t[k] - tMin) / lebar)))
    sum[b][0] += d.pos[i]; sum[b][1] += d.pos[i + 1]; sum[b][2] += d.pos[i + 2]; jml[b]++
  }
  const garis = []
  for (let b = 0; b < jumlah; b++) {
    if (!jml[b]) continue
    garis.push(sum[b].map((s) => Number((s / jml[b]).toFixed(4))))
  }
  return garis
}

const HEX = (h) => [1, 3, 5].map((i) => Math.pow(parseInt(h.slice(i, i + 2), 16) / 255, 2.2))

/**
 * Tulis satu GLB berisi banyak mesh bernama, satu bahan per mesh.
 * `bagian` = [{ nama, pos, nor, idx, warna }]. Nama mesh dipertahankan supaya
 * struktur bisa dikenali lewat raycast, bukan cuma lewat titik penanda.
 */
export function tulisGlb(berkas, bagian, catatanHakCipta) {
  const buf = [], views = [], accs = [], meshes = [], nodes = [], bahan = []
  let ofs = 0
  const tambah = (ta, target) => {
    const pad = (4 - (ofs % 4)) % 4
    if (pad) { buf.push(Buffer.alloc(pad)); ofs += pad }
    const b = Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength)
    buf.push(b); views.push({ buffer: 0, byteOffset: ofs, byteLength: b.length, target })
    ofs += b.length
    return views.length - 1
  }
  const minMax = (a, n) => {
    const mn = new Array(n).fill(Infinity), mx = new Array(n).fill(-Infinity)
    for (let i = 0; i < a.length; i += n) for (let k = 0; k < n; k++) {
      if (a[i + k] < mn[k]) mn[k] = a[i + k]
      if (a[i + k] > mx[k]) mx[k] = a[i + k]
    }
    return [mn, mx]
  }
  for (const { nama, pos, nor, idx, warna } of bagian) {
    const [pmin, pmax] = minMax(pos, 3)
    const aPos = accs.push({ bufferView: tambah(pos, 34962), componentType: 5126, count: pos.length / 3, type: 'VEC3', min: pmin, max: pmax }) - 1
    const aNor = accs.push({ bufferView: tambah(nor, 34962), componentType: 5126, count: nor.length / 3, type: 'VEC3' }) - 1
    const aIdx = accs.push({ bufferView: tambah(idx, 34963), componentType: 5125, count: idx.length, type: 'SCALAR' }) - 1
    meshes.push({ name: nama, primitives: [{ attributes: { POSITION: aPos, NORMAL: aNor }, indices: aIdx, material: bahan.length }] })
    nodes.push({ name: nama, mesh: meshes.length - 1 })
    const w = HEX(warna ?? '#c98a80')
    bahan.push({ name: nama, pbrMetallicRoughness: { baseColorFactor: [...w, 1], metallicFactor: 0.05, roughnessFactor: 0.72 }, doubleSided: true })
  }
  const bin = Buffer.concat(buf)
  const json = {
    asset: { version: '2.0', generator: 'panacea atlasGlb', copyright: catatanHakCipta },
    scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes,
    accessors: accs, bufferViews: views, buffers: [{ byteLength: bin.length }], materials: bahan,
  }
  let jb = Buffer.from(JSON.stringify(json), 'utf8')
  if (jb.length % 4) jb = Buffer.concat([jb, Buffer.alloc(4 - (jb.length % 4), 0x20)])
  const bb = bin.length % 4 ? Buffer.concat([bin, Buffer.alloc(4 - (bin.length % 4))]) : bin
  const kepala = Buffer.alloc(12)
  kepala.writeUInt32LE(0x46546c67, 0); kepala.writeUInt32LE(2, 4)
  kepala.writeUInt32LE(12 + 8 + jb.length + 8 + bb.length, 8)
  const cj = Buffer.alloc(8); cj.writeUInt32LE(jb.length, 0); cj.writeUInt32LE(0x4e4f534a, 4)
  const cb = Buffer.alloc(8); cb.writeUInt32LE(bb.length, 0); cb.writeUInt32LE(0x004e4942, 4)
  const out = Buffer.concat([kepala, cj, jb, cb, bb])
  writeFileSync(berkas, out)
  return out.length
}

export const HAK_CIPTA =
  'BodyParts3D, (c) The Database Center for Life Science, CC BY 4.0'
