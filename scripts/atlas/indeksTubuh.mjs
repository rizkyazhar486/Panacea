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
// Ambang LATERAL (|x| dari sumbu, dibagi setengah lebar kotak tubuh), diukur dari berkas ini:
// - pita dada (0,6–0,85): isi rongga paling lateral adalah limpa 0,249 dan ginjal 0,18; humerus 0,578, a. aksilaris
//   0,604. Lengan berbagi ketinggian dengan toraks, tetapi hanya jarak KE SAMPING yang membedakannya. Dulu jaraknya
//   radial (ikut kedalaman), sehingga struktur anterior — prosesus xifoideus, kantung empedu, lambung, ginjal —
//   tercatat "bahu-lengan".
// - pita pinggul (0,4–0,62): tidak satu pun struktur lengan di bawah 0,40; tangan dan lengan bawah di atas 0,45.
//   Dulu ambang radial 0,2 menamai gluteus medius, tensor fasciae latae dan regio paha "tangan".
const LATERAL_LENGAN = 0.25
const LATERAL_TANGAN = 0.4
function wilayahDari(yNorm, lateral, lapisan, diBawahDiafragma) {
  // Isi perut atas (hati, lambung, limpa, kantung empedu, adrenal) setinggi toraks bawah; yang memisahkannya dari
  // toraks adalah diafragma, bukan ketinggian.
  if (diBawahDiafragma) return 'abdomen'
  // Organ visceral selalu di rongga tubuh, tidak pernah di ekstremitas: paru lateral bisa sejauh dinding dada.
  const bisaEkstremitas = lapisan !== 'visceral'
  if (bisaEkstremitas && lateral > LATERAL_LENGAN && yNorm >= 0.6 && yNorm <= 0.85) return 'bahu-lengan'
  if (bisaEkstremitas && lateral > LATERAL_TANGAN && yNorm >= 0.4 && yNorm < 0.62) return 'tangan'
  for (const [k, a, b] of WILAYAH) if (yNorm >= a && yNorm <= b) return k
  return 'lainnya'
}

// Isi rongga yang diuji terhadap diafragma; tulang, otot, saraf dan kulit tetap dipetakan menurut ketinggian.
const LAPISAN_ISI_RONGGA = new Set(['visceral', 'lymphoid', 'cardiovascular'])

const semua = []
const kotakTubuh = new THREE.Box3()
let diafragma = null

for (const [kunci, berkas] of LAPISAN) {
  const scene = await muat(berkas)
  scene.updateMatrixWorld(true)
  kotakTubuh.expandByObject(scene)
  const terlihat = []
  scene.traverse((o) => {
    const nama = o.userData.namaAsli
    if (kunci === 'muscular' && nama === 'Diaphragm') diafragma = o
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
    terlihat.push({ nama, lapisan: kunci, p, segitiga: Math.round(segitiga), objek: o })
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

// Peta ketinggian permukaan BAWAH diafragma per sel x–z (5 mm). Sebuah struktur termasuk perut bila sebagian besar
// verteksnya yang berada di bawah bentangan diafragma terletak di bawah permukaan itu. Pusat kotak saja terlalu kasar
// untuk organ cekung: ia menaruh lobus bawah paru (yang duduk DI ATAS kubah) ke perut.
if (!diafragma) throw new Error('Diaphragm tidak ditemukan di muscular.glb: wilayah perut atas tidak bisa ditentukan')
const SEL = 0.005
const kotakDiafragma = new THREE.Box3().setFromObject(diafragma)
const bawahDiafragma = new Map()
const kunciSel = (x, z) => `${Math.floor(x / SEL)}:${Math.floor(z / SEL)}`
function verteksDunia(objek, langkahMaks) {
  const titik = []
  objek.traverse((c) => {
    if (!c.isMesh || !c.geometry?.attributes?.position) return
    const pos = c.geometry.attributes.position
    const langkah = Math.max(1, Math.floor(pos.count / langkahMaks))
    for (let i = 0; i < pos.count; i += langkah) titik.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(c.matrixWorld))
  })
  return titik
}
diafragma.traverse((c) => {
  if (!c.isMesh || !c.geometry?.attributes?.position) return
  const g = c.geometry, pos = g.attributes.position, idx = g.index
  const n = idx ? idx.count : pos.count
  const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), q = new THREE.Vector3()
  for (let i = 0; i < n; i += 3) {
    const ia = idx ? idx.getX(i) : i, ib = idx ? idx.getX(i + 1) : i + 1, id = idx ? idx.getX(i + 2) : i + 2
    a.fromBufferAttribute(pos, ia).applyMatrix4(c.matrixWorld)
    b.fromBufferAttribute(pos, ib).applyMatrix4(c.matrixWorld)
    d.fromBufferAttribute(pos, id).applyMatrix4(c.matrixWorld)
    // Titik sampel di dalam segitiga, rapat menurut ukurannya, supaya sel tidak berlubang.
    const sisi = Math.max(a.distanceTo(b), b.distanceTo(d), d.distanceTo(a))
    const k = Math.max(1, Math.ceil(sisi / SEL))
    for (let u = 0; u <= k; u += 1) for (let v = 0; u + v <= k; v += 1) {
      q.copy(a).multiplyScalar(1 - (u + v) / k).addScaledVector(b, u / k).addScaledVector(d, v / k)
      const key = kunciSel(q.x, q.z)
      const ada = bawahDiafragma.get(key)
      if (ada === undefined || q.y < ada) bawahDiafragma.set(key, q.y)
    }
  }
})
function diBawahDiafragma(s) {
  if (!LAPISAN_ISI_RONGGA.has(s.lapisan)) return false
  if (s.p.y < kotakDiafragma.min.y || s.p.y > kotakDiafragma.max.y) return false
  let bawah = 0, terhitung = 0
  for (const v of verteksDunia(s.objek, 600)) {
    const batas = bawahDiafragma.get(kunciSel(v.x, v.z))
    if (batas === undefined) continue
    terhitung += 1
    if (v.y < batas) bawah += 1
  }
  return terhitung > 0 && bawah / terhitung > 0.5
}

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
    w: wilayahDari(yNorm, Math.abs(s.p.x - pusatX) / lebar, s.lapisan, diBawahDiafragma(s)),
    t: s.segitiga,
  }
}).sort((a, b) => a.b.localeCompare(b.b) || a.n.localeCompare(b.n))

const isi = `// DIBANGKITKAN oleh scripts/atlas/indeksTubuh.mjs — jangan disunting tangan.
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
// INDEKS_TUBUH_OUT dipakai uji kesegaran (scripts/uji/body-index-regions.mts) untuk membangkitkan ke berkas sementara.
const KELUAR = process.env.INDEKS_TUBUH_OUT || 'src/lib/bodyIndex.gen.ts'
writeFileSync(KELUAR, isi)
console.log(`\nTOTAL ${baris.length} struktur bernama ditulis ke ${KELUAR}`)
