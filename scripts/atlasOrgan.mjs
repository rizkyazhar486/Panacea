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
import { bacaAtlas, ambilBagian, tulisGlb, HAK_CIPTA } from './atlasGlb.mjs'

const WARNA = ['#ee7c6a', '#f2a33b', '#6393d8', '#d89bc4', '#7fa88a', '#c69a5e', '#7294b9', '#b86858']

const SUMBER = process.argv[2] ?? '/home/user/ashemag/human-atlas'
const KELUAR = new URL('../public/organs-atlas/', import.meta.url).pathname

// Nama bagian dicocokkan dengan regex agar sisi kiri/kanan ikut terbawa.
// Pola baru di bawah berasal dari scripts/atlasDiscover.mjs yang membaca tepat
// 2.234 nama sumber BodyParts3D; pola dibuat konservatif supaya ventrikel otak,
// arteri suprarenal, atau struktur bernama mirip tidak terseret ke organ salah.
const ORGAN = {
  heart: [
    /^cavity of (left|right) atrium$/,
    /^cavity of (left|right) ventricle$/,
    /^wall of (left|right) atrium$/,
    /^wall of ventricle$/,
    /papillary muscle of (left|right) ventricle$/,
    /cusp of aortic valve$/,
    /cusp of pulmonary valve$/,
    /^pulmonary trunk$/,
    /^(superior|inferior) vena cava$/,
  ],
  kidneys: [
    /^(left|right) kidney$/,
    / renal artery$/,
    / renal vein$/,
    /^(left|right) ureter$/,
  ],
  'small-intestine': [
    /^duodenum$/,
    /part of jejunum$/,
    /part of ileum$/,
    /^ileocecal junction$/,
  ],
  'large-intestine': [
    /^(ascending|transverse|descending) colon$/,
    /^rectum$/,
  ],
  pancreas: [
    /^pancreas$/,
    /^parenchyma of pancreas$/,
    /^pancreatic duct$/,
    /^pancreatic duct tree$/,
    /pancreatic artery$/,
    /pancreaticoduodenal (artery|vein)$/,
  ],
  brain: [
    /gyrus$/,
    /^cerebellum$/,
    /^corpus callosum$/,
    /^hypothalamus$/,
    /amygdala$/,
    /hippocampus$/,
    /thalamus$/,
    /^medulla oblongata$/,
    /^midbrain$/,
    /^pons$/,
  ],
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

/**
 * BodyParts3D may split one semantic structure into several geometry fragments
 * with the same anatomical name. Those are multiple meshes, not multiple
 * anatomical structures. Aggregate them before computing counts/hotspots so
 * “56 meshes of jejunum/ileum” cannot be presented as 56 distinct structures.
 */
function semanticParts(data, sourceParts) {
  const byName = new Map()
  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    let item = byName.get(d.nama)
    if (!item) {
      item = {
        nama: d.nama,
        warna: WARNA[byName.size % WARNA.length],
        tri: 0,
        vertexCount: 0,
        sum: [0, 0, 0],
      }
      byName.set(d.nama, item)
    }
    item.tri += sourceParts[i].indexCount / 3
    for (let p = 0; p < d.pos.length; p += 3) {
      item.sum[0] += d.pos[p]
      item.sum[1] += d.pos[p + 1]
      item.sum[2] += d.pos[p + 2]
      item.vertexCount++
    }
  }
  return [...byName.values()].map((item) => ({
    ...item,
    position: item.vertexCount
      ? item.sum.map((value) => Number((value / item.vertexCount).toFixed(4)))
      : [0, 0, 0],
  }))
}

mkdirSync(KELUAR, { recursive: true })
// Sebutan di layar ditulis bahasa Inggris (bahasa dasar aplikasi) dengan
// nama Latin Terminologia Anatomica-nya, yang sama di semua bahasa.
const SEBUTAN = {
  heart: ['Heart', 'Cor'],
  kidneys: ['Kidneys & renal vessels', 'Renes'],
  'small-intestine': ['Small intestine', 'Intestinum tenue'],
  'large-intestine': ['Large intestine', 'Intestinum crassum'],
  pancreas: ['Pancreas', 'Pancreas'],
  brain: ['Brain', 'Encephalon'],
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
  // Satu source object bisa cocok dengan lebih dari satu pola; ambil sekali
  // berdasarkan source id. Nama yang sama boleh muncul pada beberapa object,
  // karena itu adalah fragmen geometri yang sah dan tetap disimpan di GLB.
  const terlihat = new Set()
  const cocok = atlas.parts.filter((p) => {
    const n = p.name.toLowerCase()
    if (!pola.some((rx) => rx.test(n)) || !saring(n) || terlihat.has(p.id)) return false
    terlihat.add(p.id)
    return true
  })
  if (!cocok.length) { console.warn(`lewat ${kunci}: tidak ada bagian cocok`); continue }
  const data = cocok.map((p) => ambilBagian(potongan, p))
  sejajarkan(data)

  const semantic = semanticParts(data, cocok)
  const warnaByName = new Map(semantic.map((part) => [part.nama, part.warna]))

  // Fragmen yang memiliki nama anatomi sama diberi warna sama, sehingga satu
  // konsep tidak tampak seolah beberapa struktur berbeda hanya karena atlas
  // menyimpannya sebagai beberapa source meshes.
  const bytes = tulisGlb(
    join(KELUAR, `${kunci}.glb`),
    data.map((d) => ({ ...d, warna: warnaByName.get(d.nama) ?? WARNA[0] })),
    HAK_CIPTA,
  )

  // Hotspot juga satu per istilah anatomi unik. Posisinya adalah centroid
  // berbobot vertex dari seluruh fragmen dengan nama itu, bukan salah satu
  // fragmen arbitrer; ID React/DOM dengan demikian selalu unik.
  const besar = [...semantic].sort((a, b) => b.tri - a.tri).slice(0, 8)
  modelTs.push({
    kunci,
    bagian: semantic.length,
    mesh: cocok.length,
    hotspots: besar.map((part) => ({
      id: part.nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      ta: part.nama,
      position: part.position,
      color: part.warna,
    })),
  })
  const tri = cocok.reduce((s, p) => s + p.indexCount / 3, 0)
  ringkas.push({ kunci, bagian: semantic.length, mesh: cocok.length, tri, kb: Math.round(bytes / 1024) })
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
    sumber: 'bodyparts3d', jumlahBagian: m.bagian, jumlahMesh: m.mesh, hotspots: m.hotspots,
  })),
  null, 2,
)}
`
writeFileSync(new URL('../src/lib/organAtlas.gen.ts', import.meta.url).pathname, isi)
