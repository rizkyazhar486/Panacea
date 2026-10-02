import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MASUKAN, PERAN, BATAS_PELATIH, periksaKesiapan, sulihanTerpakai, SULIHAN_TDEE,
  type Masukan, type PeranPelatih,
} from '../../src/lib/asupanPelatih.ts'

const PERAN_SEMUA = Object.keys(PERAN) as PeranPelatih[]

// ── 1. Kosong berarti TIDAK SIAP, untuk setiap peran ───────────────────────
// Ini seluruh alasan berkas itu ada. Kalau satu peran saja bisa menghasilkan
// rencana dari formulir kosong, penjaganya tidak ada — ia hanya terlihat ada.
for (const p of PERAN_SEMUA) {
  const k = periksaKesiapan(p, {})
  assert.equal(k.siap, false, `${p}: an empty intake must never be ready`)
  assert.ok(k.kurangWajib.length > 0, `${p}: nothing was named as missing`)
}

// ── 2. Nilai "kosong" yang menyamar tetap dihitung kosong ──────────────────
// 0 kg, spasi, array kosong dan NaN adalah kekosongan yang lolos dari
// pemeriksaan `!nilai` atau `nilai !== undefined` — dan justru itulah bentuk
// yang datang dari kolom formulir.
for (const palsu of [0, -1, '', '   ', [], Number.NaN, null, undefined]) {
  const terisi = Object.fromEntries((PERAN.menu.perlu as Masukan[]).map((m) => [m, palsu]))
  const k = periksaKesiapan('menu', terisi)
  assert.equal(k.siap, false, `value ${JSON.stringify(palsu)} was accepted as an answer`)
}

// ── 3. Semua wajib terisi ⇒ siap; satu dicabut ⇒ tidak siap, DAN disebut ───
for (const p of PERAN_SEMUA) {
  const wajib = (PERAN[p].perlu as Masukan[]).filter((m) => MASUKAN[m].wajib)
  const penuh = Object.fromEntries(wajib.map((m) => [m, 'ada'])) as Record<string, unknown>
  assert.equal(periksaKesiapan(p, penuh).siap, true, `${p}: complete required input was still refused`)

  for (const cabut of wajib) {
    const kurang = { ...penuh }
    delete kurang[cabut]
    const k = periksaKesiapan(p, kurang)
    assert.equal(k.siap, false, `${p}: missing ${cabut} still produced a plan`)
    assert.ok(k.kurangWajib.includes(cabut), `${p}: missing ${cabut} was not named to the user`)
  }
}

// ── 4. Yang opsional tidak boleh diam-diam menjadi penghalang ──────────────
for (const p of PERAN_SEMUA) {
  const wajib = (PERAN[p].perlu as Masukan[]).filter((m) => MASUKAN[m].wajib)
  const k = periksaKesiapan(p, Object.fromEntries(wajib.map((m) => [m, 'ada'])))
  for (const o of k.kurangOpsional) {
    assert.equal(MASUKAN[o].wajib, false, `${p}: ${o} appears in the optional list but is required`)
  }
}

// ── 5. Empat masukan dasar TDEE wajib di setiap peran ──────────────────────
// Usia, tinggi, berat dan jenis kelamin adalah persis empat angka yang
// disulih hitungTdee bila dibiarkan kosong. Kalau salah satunya pernah
// menjadi opsional, halaman itu akan mencetak kalori milik orang lain.
for (const p of PERAN_SEMUA) {
  for (const m of ['usia', 'tinggi', 'berat', 'sex'] as Masukan[]) {
    assert.ok(PERAN[p].perlu.includes(m), `${p}: ${m} is not even asked`)
    assert.equal(MASUKAN[m].wajib, true, `${m} must stay required — hitungTdee substitutes it silently`)
  }
}

// ── 6. Sulihan yang diumumkan harus sama dengan sulihan yang sebenarnya ────
// Kalau hitungTdee suatu hari mengganti angka bawaannya, kalimat peringatan
// di layar akan berbohong tanpa ada yang gagal. Uji ini membaca sumbernya.
const tdee = readFileSync(new URL('../../src/lib/tdee.ts', import.meta.url), 'utf8')
for (const [nama, nilai] of [['beratKg', SULIHAN_TDEE.beratKg], ['tinggiCm', SULIHAN_TDEE.tinggiCm], ['umur', SULIHAN_TDEE.umur]] as const) {
  assert.ok(
    new RegExp(`m\\.${nama}\\s*>\\s*0\\s*\\?\\s*m\\.${nama}\\s*:\\s*${nilai}\\b`).test(tdee)
      || new RegExp(`>\\s*0\\s*\\?[^:]+:\\s*${nilai}\\b`).test(tdee),
    `tdee.ts no longer substitutes ${nilai} for ${nama}; SULIHAN_TDEE now lies to the reader`,
  )
}
assert.deepEqual(sulihanTerpakai({}).length, 4, 'all four substitutions must be announced when nothing is entered')
assert.deepEqual(sulihanTerpakai({ berat: 62, tinggi: 168, usia: 41, sex: 'F' }), [],
  'nothing may be announced as substituted once the values are real')

// ── 7. Batas tidak boleh menipis ───────────────────────────────────────────
// Empat kalimat itu adalah satu-satunya tempat pembaca diberi tahu bahwa
// tidak ada yang diukur, bahwa alergi TIDAK disaring, dan bahwa ini bukan
// resep. Menghapusnya saat merapikan tata letak adalah kegagalan diam.
assert.ok(BATAS_PELATIH.length >= 4, 'the boundary statements were thinned out')
for (const pola of [/Mifflin-St Jeor/i, /does not screen/i, /not a treatment plan/i, /Nothing is measured/i]) {
  assert.ok(BATAS_PELATIH.some((b) => pola.test(b)), `boundary statement matching ${pola} disappeared`)
}

// ── 8. Halaman harus benar-benar memakai penjaganya ────────────────────────
// Penjaga yang ada di pustaka tetapi tidak dipanggil di layar tidak menjaga
// apa pun. Dan rencananya harus berdiri di belakang `kesiapan.siap`.
const halaman = readFileSync(new URL('../../src/pages/PelatihAsupan.tsx', import.meta.url), 'utf8')
assert.ok(/periksaKesiapan\(/.test(halaman), 'the page never calls periksaKesiapan')
// Bukan sekadar "kata kesiapan.siap muncul di suatu tempat": baris yang
// benar-benar merender <Rencana /> harus berdiri di belakangnya. Penjaga di
// kartu lain tidak menjaga rencananya.
const barisRencana = halaman.split('\n').filter((b) => /<Rencana\b/.test(b))
assert.ok(barisRencana.length > 0, 'the page never renders a plan at all')
for (const b of barisRencana) {
  assert.ok(/kesiapan\.siap\s*&&/.test(b), `a plan is rendered without the readiness guard: ${b.trim()}`)
}
const impor = halaman.match(/import\s*\{[^}]*\}\s*from\s*'\.\.\/lib\/profile'/)?.[0] ?? ''
assert.ok(/getDemoTersimpan/.test(impor) && !/\bgetDemo\b/.test(impor),
  'the page must prefill from getDemoTersimpan, never from getDemo() which injects 70/170/30')
assert.ok(/BATAS_PELATIH/.test(halaman), 'the page does not render the boundary statements')

console.log('asupan-pelatih: ok')
