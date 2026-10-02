import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  TITIK_KALIBRASI_HU, KELAS_JARINGAN, CARA_RENDER,
  lebarJendela, levelJendela, keabuan, kelasDalamJendela, cakupanKelas,
} from '../../src/lib/pencitraanVolumetrik.ts'
import { KALOLUMEN, YANG_BELUM_DIMILIKI_PANACEA } from '../../src/lib/rujukanKaloLumen.ts'
import { JENDELA_CT } from '../../src/lib/dicom.ts'

const dekat = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

// ── 1. Dua titik kalibrasi yang berlaku menurut DEFINISI ───────────────────
assert.equal(TITIK_KALIBRASI_HU.air, 0, 'air adalah 0 HU menurut definisi')
assert.equal(TITIK_KALIBRASI_HU.udara, -1000, 'udara adalah -1000 HU menurut definisi')

// ── 2. Jendela: lebar, level, dan pemetaan abu-abu ─────────────────────────
{
  const j = { bawah: 300, atas: 1900 }
  assert.equal(lebarJendela(j), 1600)
  assert.equal(levelJendela(j), 1100)
  assert.equal(keabuan(299, j), 0, 'di bawah ambang seluruhnya hitam')
  assert.equal(keabuan(1901, j), 1, 'di atas ambang seluruhnya putih')
  assert.ok(dekat(keabuan(1100, j), 0.5), 'level jendela harus jatuh di tengah abu-abu')
  // Monoton: tidak boleh ada nilai HU lebih tinggi yang menjadi lebih gelap.
  let sebelum = -1
  for (let hu = 200; hu <= 2000; hu += 25) {
    const g = keabuan(hu, j)
    assert.ok(g >= sebelum - 1e-12, `keabuan turun pada ${hu} HU`)
    sebelum = g
  }
}

// ── 3. Kontrol negatif: jendela mustahil menolak mencetak angka ────────────
assert.ok(Number.isNaN(lebarJendela({ bawah: Number.NaN, atas: 10 })))
assert.ok(Number.isNaN(keabuan(100, { bawah: 500, atas: 500 })), 'lebar nol tidak sah')
assert.ok(Number.isNaN(keabuan(Number.NaN, { bawah: 0, atas: 100 })), 'NaN masuk, NaN keluar')
assert.deepEqual(kelasDalamJendela({ bawah: 900, atas: 100 }), [], 'jendela terbalik tidak menangkap apa pun')

// ── 4. Cakupan kelas: "sebagian" harus benar-benar sebagian ────────────────
{
  const kortikal = KELAS_JARINGAN.find((k) => k.nama.startsWith('Cortical'))!
  assert.equal(cakupanKelas(kortikal, { bawah: -1000, atas: 3000 }), 1, 'jendela lebar menangkap seluruhnya')
  assert.equal(cakupanKelas(kortikal, { bawah: -1000, atas: -500 }), 0, 'jauh di bawahnya tidak menangkap apa pun')
  const separuh = cakupanKelas(kortikal, { bawah: kortikal.min, atas: (kortikal.min + kortikal.maks) / 2 })
  assert.ok(separuh > 0.4 && separuh < 0.6, `memotong di tengah harus terbaca sebagian, dapat ${separuh}`)
}

// Tumpang-tindih antar kelas memang nyata dan tidak boleh "dirapikan".
{
  const otot = KELAS_JARINGAN.find((k) => k.nama.includes('muscle'))!
  const hati = KELAS_JARINGAN.find((k) => k.nama === 'Liver')!
  assert.ok(otot.maks >= hati.min, 'rentang jaringan lunak dan hati memang bertumpang-tindih')
}

// ── 5. Dua cara render harus disebut BEDA SECARA MENDASAR, bukan gaya ──────
assert.equal(CARA_RENDER.length, 2)
for (const r of CARA_RENDER) {
  assert.ok(r.lemah.length > 40, `${r.cara}: kekuatan tanpa keterbatasan bukan penjelasan`)
}
const permukaan = CARA_RENDER.find((r) => r.cara === 'permukaan')!
assert.match(permukaan.lemah, /discarded|perforated/i, 'isosurface membuang isi volumenya dan itu harus dikatakan')

// ── 6. PROVENANS: rujukan, bukan integrasi ────────────────────────────────
//
// Inilah bagian yang paling mudah menjadi tidak jujur. Halaman yang
// menjelaskan pipeline DICOM->3D dengan baik sangat mudah terbaca sebagai
// halaman yang MENJALANKANNYA.
assert.equal(KALOLUMEN.lisensi, 'unresolved', 'lisensi yang belum pasti tidak boleh dikarang')
assert.ok(KALOLUMEN.batasPenulis.includes('Not for clinical or diagnostic use'),
  'batas yang dinyatakan penulisnya harus ikut terbawa utuh')
assert.ok(KALOLUMEN.klaim.length >= 5)
for (const k of KALOLUMEN.klaim) {
  assert.ok(k.asal === 'dinyatakan penulis' || k.asal === 'terbaca pada antarmuka',
    'setiap klaim harus menyebutkan dari mana Panacea mengetahuinya')
}
assert.ok(YANG_BELUM_DIMILIKI_PANACEA.length >= 4)

const panel = readFileSync('src/pages/bodyhub/PencitraanVolumetrikPanel.tsx', 'utf8')
assert.match(panel, /Reference · not an integration/, 'the page must say plainly that this is a reference')
assert.match(panel, /none of them were re-measured by Panacea/i,
  'the page must not imply Panacea verified the referenced claims')
assert.match(panel, /YANG_BELUM_DIMILIKI_PANACEA/, 'the not-done list must actually be rendered')
assert.match(panel, /unresolved/, 'the unresolved licence must be visible, not only in data')
assert.match(panel, /MRI signal\s*\n?\s*intensity is <em>not<\/em> calibrated in Hounsfield units/,
  'the MRI-is-not-HU correction must stay on screen')

// Tidak boleh mengaku bisa membaca DICOM.
assert.doesNotMatch(panel, /upload (your |a )?(DICOM|CT|MRI)/i, 'Panacea must not offer to read DICOM here')

// ── 6b. Jembatan ke pembaca DICOM yang SUDAH ADA ──────────────────────────
//
// Panacea sudah membaca DICOM di /radiology, lengkap dengan MPR dan kontrol
// aman CT/MR. Yang hilang adalah jalan menuju ke sana DARI Body Exposure --
// pencitraan yang berdiri sendiri persis yang dilarang direktifnya. Panel ini
// memakai preset jendela MILIK pembaca itu, bukan salinan baru, supaya angka
// yang dipelajari di sini adalah angka yang benar-benar diterapkan di sana.
assert.ok(JENDELA_CT.length >= 8, 'preset jendela CT tidak boleh menyusut diam-diam')
for (const w of JENDELA_CT) {
  assert.ok(w.lebar > 0, `${w.nama}: lebar jendela harus positif`)
  assert.ok(w.catatan.length > 10, `${w.nama}: preset tanpa keterangan tidak mengajarkan apa pun`)
}
assert.match(panel, /JENDELA_CT/, 'the panel must reuse the viewer presets rather than copy them')
assert.match(panel, /to="\/radiology"/, 'Body Exposure must offer a way into the DICOM viewer')
assert.match(panel, /never uploaded/i, 'the local-only guarantee must be stated at the entry point')
assert.match(panel, /refused by name/i, 'refusing compressed studies must be stated, not discovered later')
assert.match(panel, /not a diagnostic workstation/i, 'the clinical boundary must be stated at the entry point')
// Preset HU hanya sahih untuk CT, dan itu harus dikatakan di tempat ia ditawarkan.
assert.match(panel, /offered for CT only/i, 'HU presets must be scoped to CT on screen')

// Penggesernya harus bisa MENYATAKAN setiap preset yang ditawarkannya. Lung
// (-600/1500) turun sampai -1350; berhenti di -1000 membuat preset nyata
// terpotong diam-diam, dan yang tampil bukan lagi jendela yang diklaim.
{
  const batasBawah = Number((panel.match(/Lower threshold[\s\S]*?min=\{(-?\d+)\}/) ?? [])[1])
  const batasAtas = Number((panel.match(/Upper threshold[\s\S]*?maks=\{(-?\d+)\}/) ?? [])[1])
  assert.ok(Number.isFinite(batasBawah) && Number.isFinite(batasAtas), 'slider bounds must be readable')
  for (const w of JENDELA_CT) {
    assert.ok(w.pusat - w.lebar / 2 >= batasBawah, `${w.nama}: lower bound ${w.pusat - w.lebar / 2} falls outside the slider`)
    assert.ok(w.pusat + w.lebar / 2 <= batasAtas, `${w.nama}: upper bound ${w.pusat + w.lebar / 2} falls outside the slider`)
  }
}

// ── 7. Terpasang dan bisa dibuka ──────────────────────────────────────────
const explorer = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')
assert.match(explorer, /import\('\.\/bodyhub\/PencitraanVolumetrikPanel'\)/, 'not loaded by Body Explorer')
assert.match(explorer, /\{ key: 'pencitraan-volumetrik', label: 'DICOM → 3D' \}/, 'no tab a user can select')
assert.match(explorer, /panelTab === 'pencitraan-volumetrik'/, 'the tab renders nothing')
assert.match(readFileSync('src/lib/bodyExplorerTabGroups.ts', 'utf8'), /'pencitraan-volumetrik':/, 'unclassified tab')

console.log(
  `Volumetric imaging: Hounsfield window computed over ${KELAS_JARINGAN.length} reference tissue classes, ` +
  'surface vs volume stated with limits, KaloLumen recorded as a reference with unresolved licence and its ' +
  'author boundary intact, and the not-done list on screen.',
)
