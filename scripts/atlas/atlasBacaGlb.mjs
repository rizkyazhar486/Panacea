// Pembaca GLB untuk pemotong atlas.
//
// Dua sumber geometri yang sudah ada di proyek ini TIDAK datang sebagai
// potongan biner human-atlas, melainkan sebagai berkas GLB biasa:
//
//   - Z-Anatomy (CC BY-SA 4.0) di /public/anatomy — figur tubuh utuh, yang
//     memuat struktur yang TIDAK ADA di BodyParts3D versi human-atlas:
//     kelenjar tiroid, lobus paru dan pleura, serta tulang pendengaran.
//   - HuBMAP Human Reference Atlas (CC BY 4.0) — rujukan PEREMPUAN, satu-
//     satunya sumber untuk rahim, ovarium, tuba, vagina, dan plasenta.
//
// Berkas ini membaca keduanya dan mengembalikan mesh bernama dalam bentuk yang
// sama dengan ambilBagian() di atlasGlb.mjs, sehingga pemotong modul tidak
// perlu tahu dari mana geometrinya berasal.

import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'


/**
 * Salin atribut menjadi Float32 SEBELUM matriks dunia diterapkan.
 *
 * Berkas Z-Anatomy memakai Meshopt dengan kuantisasi, sehingga posisi disimpan
 * sebagai bilangan bulat ternormalisasi. `applyMatrix4` menulis balik hasilnya
 * ke dalam larik bilangan bulat itu juga, jadi seluruh organ dibulatkan menjadi
 * nol — geometrinya runtuh ke titik asal tanpa satu pun galat. Karena itu
 * atribut dibaca lewat getX/getY/getZ, yang menghormati kuantisasinya, lalu
 * disalin ke Float32 baru.
 */
function keFloat(geometry) {
  const g = new THREE.BufferGeometry()
  const p = geometry.getAttribute('position')
  const pos = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) { pos[i * 3] = p.getX(i); pos[i * 3 + 1] = p.getY(i); pos[i * 3 + 2] = p.getZ(i) }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const n = geometry.getAttribute('normal')
  if (n) {
    const nor = new Float32Array(n.count * 3)
    for (let i = 0; i < n.count; i++) { nor[i * 3] = n.getX(i); nor[i * 3 + 1] = n.getY(i); nor[i * 3 + 2] = n.getZ(i) }
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  }
  const idx = geometry.getIndex()
  if (idx) g.setIndex(Array.from(idx.array))
  return g
}

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)

/**
 * Baca satu GLB dan kembalikan mesh-nya dalam KOORDINAT DUNIA.
 *
 * Koordinat dunia, bukan lokal: di berkas Z-Anatomy tiap organ duduk di dalam
 * rantai simpul induk yang membawa penempatannya. Memakai posisi lokal apa
 * adanya akan menumpuk semua organ di titik asal — terlihat seperti gagal
 * memuat, padahal geometrinya benar.
 */
export async function bacaGlb(berkas) {
  const b = readFileSync(berkas)
  const gltf = await new Promise((res, rej) =>
    loader.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length), '', res, rej))
  gltf.scene.updateWorldMatrix(true, true)

  const keluar = []
  gltf.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return
    const nama = o.userData?.originalName ?? o.name
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld)
    const pos = g.getAttribute('position')
    const nor = g.getAttribute('normal')
    if (!pos) return
    const idx = g.getIndex()
    keluar.push({
      nama,
      pos: new Float32Array(pos.array.buffer.slice(pos.array.byteOffset, pos.array.byteOffset + pos.array.byteLength)),
      nor: nor
        ? new Float32Array(nor.array.buffer.slice(nor.array.byteOffset, nor.array.byteOffset + nor.array.byteLength))
        : new Float32Array(pos.count * 3),
      idx: idx
        ? Uint32Array.from(idx.array)
        : Uint32Array.from({ length: pos.count }, (_, i) => i),
    })
    g.dispose()
  })
  return keluar
}

/**
 * Ambil organ menurut NAMA SIMPUL, bukan nama mesh.
 *
 * Di Z-Anatomy satu organ sering berupa simpul induk yang berisi banyak mesh
 * anak — "Superior_lobe_of_left_lung" memuat tiap segmen bronkopulmonalnya
 * sendiri-sendiri, dan "Thyroid_gland" memuat kedua lobus beserta ismusnya.
 * Mencari mesh saja akan melewatkan semuanya. Jadi yang dicocokkan adalah nama
 * simpul, lalu SELURUH mesh keturunannya digabung menjadi satu organ.
 */
export async function bacaOrganGlb(berkas, pola) {
  const b = readFileSync(berkas)
  const gltf = await new Promise((res, rej) =>
    loader.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length), '', res, rej))
  gltf.scene.updateWorldMatrix(true, true)

  const keluar = []
  const sudah = new Set()
  gltf.scene.traverse((simpul) => {
    const nama = simpul.userData?.originalName ?? simpul.name
    if (!nama || sudah.has(nama) || !pola.test(nama)) return
    const potongan = []
    simpul.traverse((o) => {
      if (!o.isMesh || !o.geometry) return
      if (!o.geometry.getAttribute('position')) return
      const g = keFloat(o.geometry).applyMatrix4(o.matrixWorld)
      const pos = g.getAttribute('position')
      const nor = g.getAttribute('normal')
      const idx = g.getIndex()
      potongan.push({
        nama,
        pos: new Float32Array(pos.array.buffer.slice(pos.array.byteOffset, pos.array.byteOffset + pos.array.byteLength)),
        nor: nor
          ? new Float32Array(nor.array.buffer.slice(nor.array.byteOffset, nor.array.byteOffset + nor.array.byteLength))
          : new Float32Array(pos.count * 3),
        idx: idx ? Uint32Array.from(idx.array) : Uint32Array.from({ length: pos.count }, (_, i) => i),
      })
      g.dispose()
    })
    if (!potongan.length) return
    sudah.add(nama)
    keluar.push(potongan.length === 1 ? potongan[0] : gabung(nama, potongan))
  })
  return keluar
}

/** Gabungkan beberapa mesh menjadi satu, dipakai saat satu organ terpecah. */
export function gabung(nama, potongan) {
  const totalV = potongan.reduce((s, p) => s + p.pos.length, 0)
  const totalI = potongan.reduce((s, p) => s + p.idx.length, 0)
  const pos = new Float32Array(totalV)
  const nor = new Float32Array(totalV)
  const idx = new Uint32Array(totalI)
  let vo = 0, io = 0
  for (const p of potongan) {
    pos.set(p.pos, vo)
    nor.set(p.nor, vo)
    for (let i = 0; i < p.idx.length; i++) idx[io + i] = p.idx[i] + vo / 3
    vo += p.pos.length
    io += p.idx.length
  }
  return { nama, pos, nor, idx }
}

/**
 * Sederhanakan mesh dengan PENGELOMPOKAN TITIK pada kisi.
 *
 * Membuang segitiga satu per satu akan melubangi permukaan. Pengelompokan
 * titik tidak: setiap titik yang jatuh di sel kisi yang sama dilebur menjadi
 * satu, segitiga yang menjadi kempis dibuang, dan permukaannya tetap tertutup —
 * hanya lebih kasar. Ukuran sel dinyatakan dalam satuan model (meter untuk
 * berkas HRA), jadi 0,002 berarti wajah organ dibulatkan ke 2 mm.
 */
export function klaster(mesh, ukuranSel) {
  if (!ukuranSel) return mesh
  const peta = new Map()
  const pos = [], nor = []
  const baru = new Uint32Array(mesh.pos.length / 3)
  for (let i = 0, v = 0; i < mesh.pos.length; i += 3, v++) {
    const kx = Math.round(mesh.pos[i] / ukuranSel)
    const ky = Math.round(mesh.pos[i + 1] / ukuranSel)
    const kz = Math.round(mesh.pos[i + 2] / ukuranSel)
    const kunci = `${kx},${ky},${kz}`
    let n = peta.get(kunci)
    if (n === undefined) {
      n = pos.length / 3
      peta.set(kunci, n)
      pos.push(kx * ukuranSel, ky * ukuranSel, kz * ukuranSel)
      nor.push(mesh.nor[i], mesh.nor[i + 1], mesh.nor[i + 2])
    }
    baru[v] = n
  }
  const idx = []
  for (let t = 0; t < mesh.idx.length; t += 3) {
    const a = baru[mesh.idx[t]], b = baru[mesh.idx[t + 1]], c = baru[mesh.idx[t + 2]]
    if (a === b || b === c || a === c) continue     // segitiga kempis
    idx.push(a, b, c)
  }
  return {
    ...mesh,
    pos: Float32Array.from(pos),
    nor: Float32Array.from(nor),
    idx: Uint32Array.from(idx),
  }
}
