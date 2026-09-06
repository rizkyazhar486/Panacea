// Membangun INDEKS setiap struktur bernama di model tubuh utuh.
//
// Model Z-Anatomy di /public/anatomy memuat ribuan node bernama, tetapi sampai
// sekarang tidak ada satu pun daftar yang bisa dicari: pengguna hanya bisa
// menemukan struktur dengan mengetuknya di layar, yang berarti struktur di
// dalam tubuh — justru yang paling ingin dicari orang — praktis tidak dapat
// ditemukan sama sekali.
//
// Berkas ini menelusuri ketujuh lapisan, mencatat tiap node bernama beserta
// lapisan, sisi tubuh, titik pusat, tinggi ternormalkan dan wilayahnya, lalu
// menulis src/lib/bodyIndex.gen.ts. Yang dicatat hanyalah apa yang benar-benar
// ADA di dalam berkas; tidak ada nama yang ditambahkan dari daftar lain.

import { readFileSync, writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const LAPISAN = [
  ['surface', 'surface.glb'],
  ['skeletal', 'skeletal.glb'],
  ['muscular', 'muscular.glb'],
  ['cardiovascular', 'cardiovascular.glb'],
  ['nervous', 'nervous.glb'],
  ['visceral', 'visceral.glb'],
  ['lymphoid', 'lymphoid.glb'],
]

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)

function muat(berkas) {
  const buf = readFileSync(`public/anatomy/${berkas}`)
  return new Promise((res, rej) => {
    loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '',
      (gltf) => {
        // Nama asli diselamatkan sebelum GLTFLoader menyanitasinya.
        const nodes = gltf.parser.json.nodes ?? []
        gltf.scene.traverse((o) => {
          const a = gltf.parser.associations.get(o)
          if (a?.nodes !== undefined && nodes[a.nodes]?.name) o.userData.namaAsli = nodes[a.nodes].name
        })
        res(gltf.scene)
      }, rej)
  })
}

/** "Rectus femoris muscle.l" -> sisi kiri. */
function sisiDari(nama) {
  if (/\.l$/i.test(nama)) return 'kiri'
  if (/\.r$/i.test(nama)) return 'kanan'
  return 'tengah'
}
const bersih = (n) => n.replace(/\.(l|r)$/i, '').trim()

const WILAYAH = [
  ['kepala', 0.88, 1], ['leher', 0.82, 0.89], ['toraks', 0.66, 0.83],
  ['abdomen', 0.55, 0.67], ['pelvis', 0.46, 0.56], ['paha', 0.28, 0.5], ['tungkai', 0, 0.3],
]
function wilayahDari(yNorm, radial) {
  // Lengan berbagi ketinggian dengan toraks; yang membedakan jaraknya dari sumbu.
  if (radial > 0.16 && yNorm >= 0.6 && yNorm <= 0.85) return 'bahu-lengan'
  if (radial > 0.2 && yNorm >= 0.4 && yNorm < 0.62) return 'tangan'
  for (const [k, a, b] of WILAYAH) if (yNorm >= a && yNorm <= b) return k
  return 'lainnya'
}

const semua = []
const kotakTubuh = new THREE.Box3()

for (const [kunci, berkas] of LAPISAN) {
  const scene = await muat(berkas)
  scene.updateMatrixWorld(true)
  kotakTubuh.expandByObject(scene)
  const terlihat = []
  scene.traverse((o) => {
    const nama = o.userData.namaAsli
    if (!nama || nama.startsWith('HOW TO')) return
    // Beberapa node di berkas sumber bernama hanya "?" atau "?x" — geometrinya
    // nyata, tetapi labelnya tidak pernah diisi. Menampilkannya sebagai hasil
    // pencarian akan memberi pengguna baris "????????" yang tidak berarti
    // apa-apa; lebih jujur mengakui bahwa struktur itu tidak bernama di
    // dalam sumbernya.
    if (!/[A-Za-z]/.test(nama)) return
    // Hanya node yang benar-benar membawa geometri; node pengelompok tanpa
    // mesh tidak bisa disorot maupun ditunjuk, jadi mencatatnya hanya akan
    // menghasilkan hasil pencarian yang tidak menuju ke mana-mana.
    let punyaMesh = false
    o.traverse((c) => { if (c.isMesh) punyaMesh = true })
    if (!punyaMesh) return
    const kotak = new THREE.Box3().setFromObject(o)
    if (kotak.isEmpty()) return
    const p = kotak.getCenter(new THREE.Vector3())
    let segitiga = 0
    o.traverse((c) => { if (c.isMesh && c.geometry?.index) segitiga += c.geometry.index.count / 3 })
    terlihat.push({ nama, lapisan: kunci, p, segitiga: Math.round(segitiga) })
  })
  // Node bersarang: kalau induk dan anaknya sama-sama bernama, keduanya sah
  // sebagai struktur — tetapi nama yang persis sama tidak boleh muncul dua kali.
  const unik = new Map()
  for (const t of terlihat) if (!unik.has(t.nama)) unik.set(t.nama, t)
  semua.push(...unik.values())
  console.log(`${kunci}: ${unik.size} struktur bernama`)
}

const min = kotakTubuh.min, maks = kotakTubuh.max
const tinggi = maks.y - min.y
const lebar = Math.max(maks.x - min.x, maks.z - min.z) / 2

const baris = semua.map((s) => {
  const yNorm = (s.p.y - min.y) / tinggi
  const pusatX = (min.x + maks.x) / 2, pusatZ = (min.z + maks.z) / 2
  const radial = Math.hypot(s.p.x - pusatX, s.p.z - pusatZ) / lebar
  return {
    n: s.nama,
    b: bersih(s.nama),
    l: s.lapisan,
    s: sisiDari(s.nama),
    y: Number(yNorm.toFixed(4)),
    r: Number(radial.toFixed(4)),
    w: wilayahDari(yNorm, radial),
    t: s.segitiga,
  }
}).sort((a, b) => a.b.localeCompare(b.b) || a.n.localeCompare(b.n))

const isi = `// DIBANGKITKAN oleh scripts/indeksTubuh.mjs — jangan disunting tangan.
//
// Setiap struktur bernama yang BENAR-BENAR ADA di /public/anatomy/*.glb
// (Z-Anatomy, CC BY-SA 4.0 — lihat public/anatomy/CREDITS.txt). Tidak ada nama
// yang ditambahkan dari daftar lain: kalau sebuah struktur ada di sini, ia bisa
// disorot di model, dan kalau tidak ada, ia memang tidak ada di dalam berkasnya.
//
// n = nama persis di berkas (dipakai untuk menyorot)
// b = nama tanpa akhiran sisi, untuk pencarian
// l = lapisan, s = sisi, y = tinggi ternormalkan 0..1, r = jarak dari sumbu,
// w = wilayah tubuh, t = jumlah segitiga
export interface StrukturTubuh {
  n: string; b: string
  l: 'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid'
  s: 'kiri' | 'kanan' | 'tengah'
  y: number; r: number; w: string; t: number
}

export const INDEKS_TUBUH: StrukturTubuh[] = ${JSON.stringify(baris)}
`
writeFileSync('src/lib/bodyIndex.gen.ts', isi)
console.log(`\nTOTAL ${baris.length} struktur bernama ditulis ke src/lib/bodyIndex.gen.ts`)
