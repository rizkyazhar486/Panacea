import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { celahAnion, celahAnionTerkoreksi, tafsirkan } from '../../src/lib/asamBasa.ts'

// Tabel kasus tinggal di dalam panel (.tsx), dan Node tidak bisa mengimpor JSX.
// Karena itu tabelnya dibaca dari berkas panel yang sebenarnya lalu dievaluasi
// sebagai literal: yang diuji tetap tabel yang benar-benar dipakai panel, bukan
// salinan yang bisa menyimpang diam-diam.
function muatLiteral(berkas: string, nama: string): any {
  const sumber = readFileSync(berkas, 'utf8')
  const mulai = sumber.indexOf(`export const ${nama}`)
  assert.ok(mulai >= 0, `${berkas}: ${nama} tidak diekspor`)
  const samaDengan = sumber.indexOf('=', mulai)
  const buka = sumber.slice(samaDengan).search(/[[{]/) + samaDengan
  let dalam = 0
  let akhir = -1
  let petik: string | null = null
  for (let i = buka; i < sumber.length; i++) {
    const c = sumber[i]
    if (petik) {
      if (c === '\\') { i++; continue }
      if (c === petik) petik = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') { petik = c; continue }
    if (c === '[' || c === '{') dalam++
    else if (c === ']' || c === '}') {
      dalam--
      if (dalam === 0) { akhir = i + 1; break }
    }
  }
  assert.ok(akhir > buka, `${berkas}: literal ${nama} tidak lengkap`)
  // eslint-disable-next-line no-new-func
  return new Function(`return (${sumber.slice(buka, akhir)})`)()
}

const BERKAS_ASAM_BASA = 'src/pages/bodyhub/AsamBasaPanel.tsx'
const BERKAS_NEFRON = 'src/pages/bodyhub/NefronPanel.tsx'
const BERKAS_HEMODINAMIK = 'src/pages/bodyhub/HemodinamikPanel.tsx'

const KASUS_ASAM_BASA = muatLiteral(BERKAS_ASAM_BASA, 'KASUS_ASAM_BASA')
const RENTANG_ASAM_BASA = muatLiteral(BERKAS_ASAM_BASA, 'RENTANG_ASAM_BASA')
const KASUS_NEFRON = muatLiteral(BERKAS_NEFRON, 'KASUS_NEFRON')
const RENTANG_NEFRON = muatLiteral(BERKAS_NEFRON, 'RENTANG_NEFRON')
const KASUS_HEMODINAMIK = muatLiteral(BERKAS_HEMODINAMIK, 'KASUS_HEMODINAMIK')
const RENTANG_HEMODINAMIK = muatLiteral(BERKAS_HEMODINAMIK, 'RENTANG_HEMODINAMIK')

// Uji kasus terpandu pada ketiga panel fisiologi.
//
// SATU SIFAT yang dijaga berkas ini: sebuah kasus terpandu hanya memuat
// MASUKAN. Kalau jawabannya ikut disimpan di dalam kasus, tutorialnya akan
// tetap menampilkan jawaban yang "benar" walaupun mesin di belakangnya sudah
// rusak -- dan tutorial yang tetap benar saat alatnya salah adalah kebalikan
// dari mengajar. Karena itu di sini diuji dua hal sekaligus: kasusnya tidak
// menyimpan jawaban, dan jawabannya memang keluar benar ketika mesin yang
// sama dijalankan atas masukan itu.

interface Batas { min: number; maks: number }
interface Kasus { judul: string; ajakan: string; pelajaran: string; masukan: Record<string, number | boolean> }

const kelompok: Array<{ nama: string; berkas: string; awalan: string; kasus: Kasus[]; rentang: Record<string, Batas> }> = [
  { nama: 'AsamBasaPanel', berkas: BERKAS_ASAM_BASA, awalan: 'RENTANG_ASAM_BASA', kasus: KASUS_ASAM_BASA, rentang: RENTANG_ASAM_BASA },
  { nama: 'NefronPanel', berkas: BERKAS_NEFRON, awalan: 'RENTANG_NEFRON', kasus: KASUS_NEFRON, rentang: RENTANG_NEFRON },
  { nama: 'HemodinamikPanel', berkas: BERKAS_HEMODINAMIK, awalan: 'RENTANG_HEMODINAMIK', kasus: KASUS_HEMODINAMIK, rentang: RENTANG_HEMODINAMIK },
]

// ── 1. Bentuk kasus: judul, ajakan, pelajaran, dan MASUKAN saja ────────────
{
  const kunciSah = new Set(['judul', 'ajakan', 'masukan', 'pelajaran'])
  for (const { nama, kasus, rentang } of kelompok) {
    assert.ok(kasus.length >= 2, `${nama}: butuh minimal dua kasus terpandu`)
    for (const k of kasus) {
      for (const kunci of Object.keys(k)) {
        assert.ok(kunciSah.has(kunci), `${nama}/${k.judul}: kunci tak dikenal "${kunci}"`)
      }
      for (const teks of [k.judul, k.ajakan, k.pelajaran]) {
        assert.ok(typeof teks === 'string' && teks.trim().length > 0, `${nama}/${k.judul}: teks kosong`)
      }
      const masukan = k.masukan
      assert.ok(Object.keys(masukan).length > 0, `${nama}/${k.judul}: tanpa masukan`)
      for (const [medan, nilai] of Object.entries(masukan)) {
        assert.ok(
          typeof nilai === 'number' || typeof nilai === 'boolean',
          `${nama}/${k.judul}: masukan "${medan}" bukan nilai penggeser`,
        )
        // Setiap medan angka harus punya batas penggeser yang dinyatakan panel.
        if (typeof nilai === 'number') {
          assert.ok(rentang[medan], `${nama}/${k.judul}: "${medan}" tidak punya batas penggeser`)
        }
      }
    }
  }
}

// ── 2. Tidak ada kasus yang menyimpan jawaban ──────────────────────────────
//
// Inilah sifat yang paling mudah hilang tanpa disadari: seseorang menambahkan
// `ph: 7.18` "supaya tampilannya pasti benar", dan sejak itu tampilan tidak
// lagi membuktikan apa pun tentang mesinnya.
{
  const terlarang = /(^|[^a-z])(ph|gfr|diagnosis|jawab|answer|hasil|expected|diharapkan|tafsir|gangguan|celah|anionGap|do2|hantaran|curah|output|verdict|kesimpulan)($|[^a-z])/i
  for (const { nama, kasus } of kelompok) {
    for (const k of kasus) {
      for (const medan of Object.keys(k.masukan)) {
        assert.ok(!terlarang.test(medan), `${nama}/${k.judul}: masukan "${medan}" terlihat seperti jawaban tersimpan`)
      }
      for (const medan of Object.keys(k)) {
        assert.ok(!terlarang.test(medan), `${nama}/${k.judul}: medan "${medan}" terlihat seperti jawaban tersimpan`)
      }
    }
  }
}

// ── 3. Setiap masukan harus berada di dalam batas penggeser ────────────────
//
// Preset di luar batas dijepit diam-diam oleh `<input type="range">`: tidak ada
// galat, tidak ada peringatan, hanya angka lain yang mengajarkan hal lain.
{
  for (const { nama, kasus, rentang } of kelompok) {
    for (const k of kasus) {
      for (const [medan, nilai] of Object.entries(k.masukan)) {
        if (typeof nilai !== 'number') continue
        const batas = rentang[medan]
        assert.ok(
          nilai >= batas.min && nilai <= batas.maks,
          `${nama}/${k.judul}: ${medan} = ${nilai} di luar penggeser ${batas.min}..${batas.maks}`,
        )
      }
    }
  }
}

// ── 3b. Batas itu harus batas yang DIPAKAI penggeser panel ────────────────
//
// Tabel rentang yang terpisah dari `<input type="range">` hanya memindahkan
// masalahnya: ujinya lulus sementara penggesernya memakai angka lain.
{
  for (const { nama, berkas, awalan, rentang } of kelompok) {
    const sumber = readFileSync(berkas, 'utf8')
    for (const medan of Object.keys(rentang)) {
      assert.ok(sumber.includes(`${awalan}.${medan}.min`), `${nama}: penggeser ${medan} tidak memakai ${awalan}`)
      assert.ok(sumber.includes(`${awalan}.${medan}.maks`), `${nama}: penggeser ${medan} tidak memakai ${awalan}`)
    }
    assert.ok(!/min=\{\d/.test(sumber), `${nama}: masih ada penggeser dengan batas angka mentah`)
  }
}

// ── 4. Kasus asam-basa dihitung ulang lewat mesin yang sama ────────────────
//
// Ini yang membuktikan kasusnya benar-benar mengajarkan sesuatu, TANPA
// menyimpan satu pun jawaban di dalam kasus.
{
  const cari = (potongan: string) => {
    const k = (KASUS_ASAM_BASA as Kasus[]).find((x) => x.judul.toLowerCase().includes(potongan))
    assert.ok(k, `Kasus asam-basa "${potongan}" hilang`)
    return k!
  }

  // Ketoasidosis diabetik: asidosis metabolik, celah lebar, kompensasi Winter
  // yang sesuai -- jadi PaCO2 rendahnya adalah jawaban paru, bukan gangguan kedua.
  {
    const m = cari('ketoacidosis').masukan as Record<string, number>
    const t = tafsirkan({ bikarbonat: m.bikarbonat, paco2: m.paco2 }, !m.kronik)
    assert.equal(t.gangguan, 'asidosis-metabolik')
    assert.ok(t.ph < 7.35, `DKA harus asidemik; pH ${t.ph.toFixed(2)}`)
    assert.equal(t.sesuaiKompensasi, true, 'PaCO2 DKA harus masuk rentang Winter')
    const ag = celahAnion({ natrium: m.natrium, klorida: m.klorida, bikarbonat: m.bikarbonat, albumin: m.albumin })
    assert.ok(ag > 16, `DKA harus celah lebar; celah ${ag}`)
  }

  // Retensi CO2 menahun: SESUAI aturan kronik, TIDAK sesuai aturan akut.
  // Kalau kedua aturan memberi hasil sama, kasus ini tidak mengajarkan apa pun.
  {
    const m = cari('co₂ retention').masukan
    assert.equal(m.kronik, true, 'Kasus 2 harus memuat penanda menahun')
    const gas = { bikarbonat: m.bikarbonat as number, paco2: m.paco2 as number }
    const kronik = tafsirkan(gas, false)
    const akut = tafsirkan(gas, true)
    assert.equal(kronik.gangguan, 'asidosis-respiratorik')
    assert.equal(akut.gangguan, 'asidosis-respiratorik')
    assert.equal(kronik.sesuaiKompensasi, true, 'Aturan kronik harus menyebut bikarbonat ini wajar')
    assert.equal(akut.sesuaiKompensasi, false, 'Aturan akut harus menyebutnya gangguan kedua')
  }

  // Celah yang tersembunyi oleh albumin rendah: mentah tampak biasa, terkoreksi lebar.
  {
    const m = cari('albumin').masukan as Record<string, number>
    const e = { natrium: m.natrium, klorida: m.klorida, bikarbonat: m.bikarbonat, albumin: m.albumin }
    const mentah = celahAnion(e)
    const koreksi = celahAnionTerkoreksi(e)
    assert.ok(mentah <= 12, `Celah mentah harus tampak biasa; dapat ${mentah}`)
    assert.ok(koreksi > 16, `Celah terkoreksi harus lebar; dapat ${koreksi}`)
  }
}

console.log('kasus-terpandu-fisiologi: lulus')
