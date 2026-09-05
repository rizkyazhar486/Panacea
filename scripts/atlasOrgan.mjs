// Pemotong organ dari human-atlas (BodyParts3D 4.0).
//
// human-atlas menyimpan 2.234 mesh bernama dalam potongan biner mentah:
// posisi Float32, normal Int16 ternormalisasi, indeks Uint32, dengan offset
// byte absolut per bagian di dalam atlas.json. Skrip ini memilih sekumpulan
// bagian menurut namanya, memusatkannya pada titik asal, lalu menulis satu
// berkas GLB kecil per organ — geometri manusia sungguhan, bukan model
// buatan AI, sehingga tampilan dekat organ bisa dipercaya untuk belajar.
//
// Jalankan:  node scripts/atlasOrgan.mjs <folder-human-atlas>

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { bacaAtlas, ambilBagian, pusat, tulisGlb, HAK_CIPTA } from './atlasGlb.mjs'

const WARNA = ['#ee7c6a', '#f2a33b', '#6393d8', '#d89bc4', '#7fa88a', '#c69a5e', '#7294b9', '#b86858']

const SUMBER = process.argv[2] ?? '/home/user/ashemag/human-atlas'
const KELUAR = new URL('../public/organs-atlas/', import.meta.url).pathname

// Nama bagian dicocokkan dengan regex agar sisi kiri/kanan ikut terbawa.
const ORGAN = {
  eye: [/^(left|right) (cornea|iris|lens|sclera|choroid|vitreous body|corona ciliaris)$/,
        /^optic part of (left|right) retina$/, /^anterior chamber of (left|right) eyeball$/,
        /^(left|right) optic nerve$/, /^suspensory ligament of (left|right) lens$/],
  'optic-pathway': [/optic nerve$/, /^optic chiasm$/, /optic tract$/, /^optic part of (left|right) retina$/],
  spleen: [/^spleen$/],
  stomach: [/^stomach$/],
  gallbladder: [/^gallbladder$/, /^cystic duct$/],
  bladder: [/^urinary bladder$/, /^urethra$/, /^(left|right) ureter$/],
  prostate: [/^prostate$/, /seminal vesicle$/, /deferent duct$/],
  testis: [/testis$/, /epididymis$/],
  adrenal: [/adrenal gland$/],
  pituitary: [/^pituitary gland$/, /^pineal body$/],
  larynx: [/cartilage$/, /^epiglottis$/, /vocal/, /aryepiglott/, /cricothyroid/, /^(left|right) thyro-?arytenoid/],
  'nasal-septum': [/nasal cartilage$/, /nasal concha$/, /^vomer$/, /nasal bone$/],
  pharynx: [/pharyng/, /^epiglottis$/, /^soft palate$/, /^uvula$/],
}
// Larynx memakai pola "cartilage$" yang terlalu luas bila diambil mentah, jadi
// dibatasi pada tulang rawan laring saja.
const BATAS = {
  larynx: (n) => !/nasal|alar|costal|articular|tracheal|auricular/.test(n),
  pharynx: (n) => !/muscle of pharynx of/.test(n) || true,
}

const { atlas, potongan } = bacaAtlas(SUMBER)


// Sebutan yang tampil di titik penanda. Nama BodyParts3D memakai bahasa
// Inggris; sisi kiri/kanan dipertahankan karena itulah yang dilihat pembaca.

function sejajarkan(dipilih) {
  // Pusatkan pada titik asal dan skalakan ke tinggi 2 satuan, sama seperti
  // model organ yang sudah ada agar kamera Body3D tidak perlu diubah.
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (const d of dipilih) for (let i = 0; i < d.pos.length; i += 3)
    for (let a = 0; a < 3; a++) { const v = d.pos[i + a]; if (v < min[a]) min[a] = v; if (v > max[a]) max[a] = v }
  const rentang = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1
  const s = 2 / rentang
  const c = [0, 1, 2].map((a) => (min[a] + max[a]) / 2)
  for (const d of dipilih) for (let i = 0; i < d.pos.length; i += 3)
    for (let a = 0; a < 3; a++) d.pos[i + a] = (d.pos[i + a] - c[a]) * s
}


mkdirSync(KELUAR, { recursive: true })
// Sebutan di layar ditulis bahasa Inggris (bahasa dasar aplikasi) dengan
// nama Latin Terminologia Anatomica-nya, yang sama di semua bahasa.
const SEBUTAN = {
  eye: ['Eye', 'Oculus'],
  'optic-pathway': ['Optic pathway', 'Via optica'],
  spleen: ['Spleen', 'Splen'],
  stomach: ['Stomach', 'Gaster'],
  gallbladder: ['Gallbladder', 'Vesica biliaris'],
  bladder: ['Bladder & ureters', 'Vesica urinaria'],
  prostate: ['Prostate & seminal tract', 'Prostata'],
  testis: ['Testis & epididymis', 'Testis'],
  adrenal: ['Adrenal glands', 'Glandula suprarenalis'],
  pituitary: ['Pituitary & pineal', 'Hypophysis'],
  larynx: ['Larynx', 'Larynx'],
  'nasal-septum': ['Nasal septum & conchae', 'Septum nasi'],
  pharynx: ['Pharynx', 'Pharynx'],
}

const ringkas = []
const modelTs = []
for (const [kunci, pola] of Object.entries(ORGAN)) {
  const saring = BATAS[kunci] ?? (() => true)
  // Satu bagian bisa cocok dengan lebih dari satu pola; ambil sekali saja.
  const terlihat = new Set()
  const cocok = atlas.parts.filter((p) => {
    const n = p.name.toLowerCase()
    if (!pola.some((r) => r.test(n)) || !saring(n) || terlihat.has(p.id)) return false
    terlihat.add(p.id)
    return true
  })
  if (!cocok.length) { console.warn(`lewat ${kunci}: tidak ada bagian cocok`); continue }
  const data = cocok.map((p) => ambilBagian(potongan, p))
  sejajarkan(data)
  // Tiap mesh diberi warnanya sendiri. Dengan satu warna untuk semuanya, organ
  // bermesh banyak seperti mata terbaca sebagai gumpalan tunggal — sklera,
  // kornea, iris, dan saraf optik tidak bisa dibedakan, padahal justru itu
  // yang ingin dipelajari. Warnanya sama dengan warna titik penandanya.
  const bytes = tulisGlb(
    join(KELUAR, `${kunci}.glb`),
    data.map((d, i) => ({ ...d, warna: WARNA[i % WARNA.length] })),
    HAK_CIPTA,
  )
  // Titik penanda diambil dari bagian TERBESAR: pada organ dengan puluhan
  // mesh, menandai semuanya membuat layar penuh label yang saling tumpuk.
  // Warnanya diambil dari urutan mesh di dalam berkas, bukan dari urutan
  // titik: dengan begitu titik penanda berwarna sama persis dengan struktur
  // yang ia namai, bukan sekadar berbeda satu sama lain.
  const besar = data
    .map((d, i) => ({ d, tri: cocok[i].indexCount / 3, warna: WARNA[i % WARNA.length] }))
    .sort((a, b) => b.tri - a.tri)
    .slice(0, 8)
  modelTs.push({
    kunci,
    bagian: cocok.length,
    hotspots: besar.map(({ d, warna }) => ({
      id: d.nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      ta: d.nama,
      position: pusat(d),
      color: warna,
    })),
  })
  const tri = cocok.reduce((s, p) => s + p.indexCount / 3, 0)
  ringkas.push({ kunci, bagian: cocok.length, tri, kb: Math.round(bytes / 1024) })
}
console.table(ringkas)

// Berkas TS ditulis dari data, bukan diketik ulang: nama bagian dan titik
// pusatnya berasal langsung dari geometri yang baru saja ditulis, sehingga
// penanda tidak akan pernah bergeser dari mesh-nya.
const isi = `// DIBANGKITKAN oleh scripts/atlasOrgan.mjs — jangan disunting tangan.
//
// Geometri organ diambil dari BodyParts3D 4.0 (Database Center for Life
// Science, CC BY 4.0) lewat kemasan ashemag/human-atlas. Berbeda dengan model
// di /public/organs/ yang dibuat AI, yang ini geometri manusia rujukan yang
// sesungguhnya, dan tiap mesh membawa nama anatomisnya sendiri.
import type { OrganModel } from './organModels'

export const ORGAN_ATLAS: OrganModel[] = ${JSON.stringify(
  modelTs.map((m) => ({
    id: m.kunci, focusKey: m.kunci,
    label: SEBUTAN[m.kunci][0], scientificName: SEBUTAN[m.kunci][1],
    accent: m.hotspots[0]?.color ?? '#ee7c6a', illustrated: false,
    sumber: 'bodyparts3d', jumlahBagian: m.bagian, hotspots: m.hotspots,
  })),
  null, 2,
)}
`
writeFileSync(new URL('../src/lib/organAtlas.gen.ts', import.meta.url).pathname, isi)
