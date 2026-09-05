// Pemotong kardiovaskular dari human-atlas (BodyParts3D 4.0).
//
// Kenapa terpisah dari cardiovascular.glb yang sudah ada: berkas Z-Anatomy itu
// 12 MB dan memuat seluruh percabangan sampai ranting terkecil, sehingga tidak
// bisa dipakai untuk mengajarkan satu jalur. Yang dibutuhkan pembelajaran
// patologi justru sebaliknya — sekumpulan pembuluh BERNAMA yang terbatas, tiap
// satu bisa disorot sendiri, dengan GARIS TENGAH tiap pembuluh supaya darah
// bisa dianimasikan mengalir sepanjangnya, bukan sekadar berkelip.
//
// Jalankan:  node scripts/atlasCardio.mjs <folder-human-atlas>

import { mkdirSync, writeFileSync } from 'node:fs'
import { bacaAtlas, ambilBagian, garisTengah, pusat, tulisGlb, HAK_CIPTA } from './atlasGlb.mjs'

const SUMBER = process.argv[2] ?? '/home/user/ashemag/human-atlas'
const KELUAR = new URL('../public/cardio/', import.meta.url).pathname

// Warna mengikuti KANDUNGAN OKSIGEN, bukan sekadar "arteri merah, vena biru".
// Arteri pulmonalis membawa darah miskin oksigen dan vena pulmonalis membawa
// darah kaya oksigen — dan justru itu yang paling sering tertukar saat belajar,
// jadi warnanya di sini mengatakan yang sebenarnya.
const MERAH = '#d2453f'   // kaya oksigen
const BIRU = '#3f6fb5'    // miskin oksigen
const OTOT = '#b06a63'    // dinding & otot jantung
const KATUP = '#e8d8c8'   // katup
const RONGGA = '#8f4a52'  // rongga (ruang jantung)

/** kind dipakai UI untuk menyaring; wilayah dipakai untuk mengelompokkan. */
const PILIH = [
  // ── Jantung ────────────────────────────────────────────────────────────────
  [/^cavity of (left|right) (atrium|ventricle)$/, 'chamber', 'heart', RONGGA],
  [/^wall of (left atrium|right atrium|ventricle)$/, 'chamber', 'heart', OTOT],
  [/(leaflet of (mitral|tricuspid) valve|cusp of (aortic|pulmonary) valve)$/, 'valve', 'heart', KATUP],
  [/papillary muscle of (left|right) ventricle$/, 'chamber', 'heart', OTOT],
  // ── Koroner ────────────────────────────────────────────────────────────────
  // Batang koroner di sumber diberi awalan "Trunk of"; tanpa itu yang terambil
  // hanya cabang-cabangnya, dan LAD — pembuluh yang paling sering tersumbat
  // pada infark anterior — justru hilang.
  [/^trunk of (left|right) coronary artery$/, 'coronary', 'coronary', MERAH],
  [/^trunk of anterior interventricular branch of left coronary artery$/, 'coronary', 'coronary', MERAH],
  [/(first|second|third) (right anterior )?branch of anterior interventricular branch of left coronary artery$/, 'coronary', 'coronary', MERAH],
  [/^conus branch of anterior interventricular branch of left coronary artery$/, 'coronary', 'coronary', MERAH],
  [/^(first) (anterior|posterior) ventricular branch of right coronary artery$/, 'coronary', 'coronary', MERAH],
  [/^circumflex branch of left coronary artery$/, 'coronary', 'coronary', MERAH],
  [/^posterior interventricular branch of right coronary artery$/, 'coronary', 'coronary', MERAH],
  [/^marginal branch of right coronary artery$/, 'coronary', 'coronary', MERAH],
  [/^diagonal branch of anterior descending branch of left coronary artery$/, 'coronary', 'coronary', MERAH],
  [/^coronary sinus$/, 'vein', 'coronary', BIRU],
  // ── Pembuluh besar ─────────────────────────────────────────────────────────
  [/^ascending aorta$/, 'artery', 'great', MERAH],
  [/^arch of aorta$/, 'artery', 'great', MERAH],
  [/^descending aorta$/, 'artery', 'great', MERAH],
  [/^descending thoracic aorta$/, 'artery', 'great', MERAH],
  [/^abdominal aorta$/, 'artery', 'great', MERAH],
  [/^pulmonary trunk$/, 'artery', 'pulmonary', BIRU],
  [/^(left|right) pulmonary artery$/, 'artery', 'pulmonary', BIRU],
  [/^(left|right) (superior|inferior) pulmonary vein$/, 'vein', 'pulmonary', MERAH],
  [/^(superior|inferior) vena cava$/, 'vein', 'great', BIRU],
  [/^(left|right) brachiocephalic vein$/, 'vein', 'great', BIRU],
  [/^azygos vein$/, 'vein', 'great', BIRU],
  // ── Kepala & leher ─────────────────────────────────────────────────────────
  [/^(left|right) (common|internal) carotid artery$/, 'artery', 'head', MERAH],
  [/^(left|right) vertebral artery$/, 'artery', 'head', MERAH],
  [/^basilar artery$/, 'artery', 'head', MERAH],
  [/^(left|right) anterior cerebral artery$/, 'artery', 'head', MERAH],
  [/^sphenoid part of (left|right) middle cerebral artery$/, 'artery', 'head', MERAH],
  [/^(pre|post)communicating part of (left|right) posterior cerebral artery$/, 'artery', 'head', MERAH],
  [/^anterior communicating artery$/, 'artery', 'head', MERAH],
  [/^(left|right) posterior communicating artery$/, 'artery', 'head', MERAH],
  [/^(left|right) internal jugular vein$/, 'vein', 'head', BIRU],
  // ── Anggota gerak atas ─────────────────────────────────────────────────────
  [/^(left|right) subclavian (artery|vein)$/, 'artery', 'arm', null],
  [/^(left|right) (brachial|radial|ulnar) artery$/, 'artery', 'arm', MERAH],
  // ── Perut ──────────────────────────────────────────────────────────────────
  [/^celiac trunk$/, 'artery', 'abdomen', MERAH],
  [/^common hepatic artery$/, 'artery', 'abdomen', MERAH],
  [/^hepatic artery proper$/, 'artery', 'abdomen', MERAH],
  [/^splenic artery$/, 'artery', 'abdomen', MERAH],
  [/^(superior|inferior) mesenteric artery$/, 'artery', 'abdomen', MERAH],
  [/^(left|right) renal artery$/, 'artery', 'abdomen', MERAH],
  [/^(left|right) renal vein$/, 'vein', 'abdomen', BIRU],
  [/^hepatic portal vein$/, 'vein', 'abdomen', '#6b4f9e'],
  [/^pre-hepatic portal vein$/, 'vein', 'abdomen', '#6b4f9e'],
  [/^(left|right|middle) hepatic vein$/, 'vein', 'abdomen', BIRU],
  [/^(superior|inferior) mesenteric vein$/, 'vein', 'abdomen', '#6b4f9e'],
  // ── Anggota gerak bawah ────────────────────────────────────────────────────
  [/^(left|right) (common|external|internal) iliac artery$/, 'artery', 'leg', MERAH],
  [/^(left|right) (common|external|internal) iliac vein$/, 'vein', 'leg', BIRU],
  [/^(left|right) (femoral|popliteal) artery$/, 'artery', 'leg', MERAH],
  [/^(left|right) (femoral|popliteal|deep femoral) vein$/, 'vein', 'leg', BIRU],
  [/^(left|right) (anterior|posterior) tibial vein$/, 'vein', 'leg', BIRU],
  [/^(left|right) (great|small) saphenous vein$/, 'vein', 'leg', BIRU],
]

const { atlas, potongan } = bacaAtlas(SUMBER)

// human-atlas menandai ventrikel OTAK sebagai sistem "cardiac" — pengelompokan
// yang keliru di sumbernya. Kalau ikut terbawa, ia muncul sebagai "ruang
// jantung" di kepala.
const BUKAN_JANTUNG = /^(third|fourth|left lateral|right lateral) ventricle$|interventricular foramen/i

const terpilih = []
const sudah = new Set()
for (const p of atlas.parts) {
  if (BUKAN_JANTUNG.test(p.name)) continue
  const aturan = PILIH.find(([r]) => r.test(p.name.toLowerCase()))
  if (!aturan) continue
  const kunci = p.name.toLowerCase()
  if (sudah.has(kunci)) continue      // beberapa nama muncul dua kali di sumber
  sudah.add(kunci)
  const [, kind, wilayah, warna] = aturan
  // Subklavia disaring belakangan karena satu pola mencakup arteri dan vena.
  const w = warna ?? (/vein$/i.test(p.name) ? BIRU : MERAH)
  terpilih.push({ p, kind: /vein$/i.test(p.name) && kind === 'artery' ? 'vein' : kind, wilayah, warna: w })
}

const data = terpilih.map(({ p, warna }) => ({ ...ambilBagian(potongan, p), warna }))

// Semua pembuluh dipusatkan SEKALI sebagai satu kesatuan, bukan sendiri-sendiri:
// letak relatif antar pembuluh adalah setengah dari isi pelajarannya.
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
for (const d of data) for (let i = 0; i < d.pos.length; i += 3)
  for (let a = 0; a < 3; a++) { const v = d.pos[i + a]; if (v < min[a]) min[a] = v; if (v > max[a]) max[a] = v }
const rentang = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1
const skala = 2 / rentang
const tengah = [0, 1, 2].map((a) => (min[a] + max[a]) / 2)
for (const d of data) for (let i = 0; i < d.pos.length; i += 3)
  for (let a = 0; a < 3; a++) d.pos[i + a] = (d.pos[i + a] - tengah[a]) * skala

mkdirSync(KELUAR, { recursive: true })
const bytes = tulisGlb(KELUAR + 'cardio.glb', data, HAK_CIPTA)

const daftar = terpilih.map(({ p, kind, wilayah, warna }, i) => ({
  name: p.name,
  kind,
  region: wilayah,
  color: warna,
  centroid: pusat(data[i]),
  // Delapan titik cukup untuk mengikuti lengkungan arkus aorta tanpa membuat
  // berkasnya membengkak; pembuluh pendek menghasilkan lebih sedikit.
  line: garisTengah(data[i], 8),
  triangles: p.indexCount / 3,
}))

writeFileSync(new URL('../src/lib/cardioAtlas.gen.ts', import.meta.url).pathname,
`// DIBANGKITKAN oleh scripts/atlasCardio.mjs — jangan disunting tangan.
//
// ${daftar.length} pembuluh dan struktur jantung bernama, dipotong dari
// BodyParts3D 4.0 (Database Center for Life Science, CC BY 4.0). Nama di sini
// SAMA PERSIS dengan nama mesh di /cardio/cardio.glb, jadi menyorot struktur
// cukup dengan mencocokkan namanya.
export interface CardioPart {
  /** Nama BodyParts3D — identitas yang dipakai di GLB dan di seluruh aplikasi. */
  name: string
  kind: 'artery' | 'vein' | 'coronary' | 'chamber' | 'valve'
  region: 'heart' | 'coronary' | 'great' | 'pulmonary' | 'head' | 'arm' | 'abdomen' | 'leg'
  color: string
  centroid: [number, number, number]
  /** Garis tengah pembuluh: titik-titik berurutan sepanjang sumbu panjangnya. */
  line: [number, number, number][]
  triangles: number
}

export const CARDIO_PARTS: CardioPart[] = ${JSON.stringify(daftar)} as unknown as CardioPart[]

export const CARDIO_BY_NAME: Record<string, CardioPart> = Object.fromEntries(
  CARDIO_PARTS.map((p) => [p.name.toLowerCase(), p]),
)
`)

console.log(`${daftar.length} struktur, ${Math.round(bytes / 1024)} kB`)
const perWilayah = {}
for (const d of daftar) perWilayah[d.region] = (perWilayah[d.region] ?? 0) + 1
console.log(perWilayah)
