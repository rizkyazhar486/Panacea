import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { UKURAN, arahPerubahan, bandingkan, ringkas, kunciPekan, BATAS_PROGRES } from '../../src/lib/progresPekanan.ts'

// ─────────────────────────────────────────────────────────────────────────────
// SEBUAH PANAH ADALAH KLAIM.
//
// Pelacak progres yang memberi panah pada setiap selisih mengajari pemakainya
// mengejar derau: berat badan bergerak sekitar setengah kilogram karena air
// dan isi usus saja. Karena itu setiap ukuran membawa ambang berartinya
// sendiri, dan di bawah ambang jawabannya "datar" -- bukan panah kecil.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Ambang diperiksa SEBELUM tandanya ──────────────────────────────────
const berat = UKURAN.find((u) => u.id === 'berat')!
assert.equal(berat.ambang, 0.5, 'the weight threshold changed; re-read this gate')
assert.equal(arahPerubahan(berat, 80, 79.7), 'datar', '0.3 kg is inside daily fluctuation and must read flat')
assert.equal(arahPerubahan(berat, 80, 79.2), 'membaik', '0.8 kg down on a fat-loss measure must read improving')
assert.equal(arahPerubahan(berat, 80, 80.8), 'memburuk', '0.8 kg up must read worse')
// Arah "baik" berbeda per ukuran, dan tidak boleh tertukar.
const kekuatan = UKURAN.find((u) => u.id === 'kekuatan')!
assert.equal(arahPerubahan(kekuatan, 100, 105), 'membaik', 'more strength must read improving')
assert.equal(arahPerubahan(kekuatan, 100, 95), 'memburuk', 'less strength must read worse')
assert.equal(arahPerubahan(kekuatan, 100, 101), 'datar', '1 kg on a 2.5 kg threshold must read flat')

// ── 2. Satu pekan tidak punya arah ────────────────────────────────────────
const satu = bandingkan([{ pekan: '2026-09-07', nilai: { berat: 80 } }])
const b1 = satu.find((b) => b.ukuran.id === 'berat')!
assert.equal(b1.kini, 80, 'the single reading must still be charted')
assert.equal(b1.arah, null, 'one week must not produce a direction')
assert.equal(b1.delta, null, 'one week must not produce a delta')
assert.equal(ringkas(satu).berhasil.length, 0, 'a single reading was called working')
assert.equal(ringkas(satu).bermasalah.length, 0, 'a single reading was called a problem')

// ── 3. Nol bukan kekosongan, dan kekosongan bukan nol ─────────────────────
const kosong = bandingkan([
  { pekan: '2026-09-07', nilai: { berat: 80 } },
  { pekan: '2026-09-14', nilai: {} },
])
const b2 = kosong.find((b) => b.ukuran.id === 'berat')!
assert.equal(b2.deret.length, 1, 'a week with no entry was charted as a point')
assert.equal(b2.kini, 80, 'the missing week overwrote the real reading')
assert.equal(b2.arah, null, 'a missing week produced a direction out of nothing')

// ── 4. Urutan pekan mengikuti tanggal, bukan urutan pengetikan ────────────
const acak = bandingkan([
  { pekan: '2026-09-14', nilai: { berat: 79 } },
  { pekan: '2026-09-07', nilai: { berat: 80 } },
])
const b3 = acak.find((b) => b.ukuran.id === 'berat')!
assert.equal(b3.lalu, 80, 'weeks were compared in entry order rather than by date')
assert.equal(b3.kini, 79, 'the latest week is not the latest date')
assert.equal(b3.arah, 'membaik', 'the direction was computed backwards')

// ── 5. Pekan selalu dimulai Senin ─────────────────────────────────────────
assert.equal(kunciPekan('2026-09-14'), '2026-09-14', 'a Monday must map to itself')
assert.equal(kunciPekan('2026-09-17'), '2026-09-14', 'a Thursday must fall into its Monday')
assert.equal(kunciPekan('2026-09-20'), '2026-09-14', 'a Sunday must fall into the SAME week, not the next one')

// ── 6. Grafiknya: satu skala per ukuran, dan arah tidak pernah warna saja ──
const grafik = readFileSync(new URL('../../src/components/GrafikProgres.tsx', import.meta.url), 'utf8')
assert.ok(/Math\.min\(\.\.\.nilai\)/.test(grafik) && /Math\.max\(\.\.\.nilai\)/.test(grafik),
  'the chart no longer scales each measure to its own range')
// Setiap arah harus membawa panah DAN kata. Pasangan hijau/merah di mode
// terang berjarak deutan dE 6,0 -- sah HANYA dengan penanda kedua.
for (const k of ['membaik', 'memburuk', 'datar']) {
  assert.ok(new RegExp(`${k}: \\{ kata: '.+' \\}`).test(grafik),
    `direction ${k} lost its word, leaving colour alone to carry it`)
}
assert.ok(/panahDelta\(delta, arah === 'datar'\)/.test(grafik) && /GLIF\[arah\]\.kata/.test(grafik),
  'the badge no longer renders both an arrow and the word')

// Panah harus mengikuti ANGKANYA, bukan penilaiannya. Berat yang turun pada
// tujuan menurunkan berat adalah "improving" DAN nilainya turun; panah naik
// di sebelah angka negatif memaksa keduanya dibaca ulang.
// Ditulis ulang di sini, bukan diimpor: berkas .tsx tidak dapat dimuat oleh
// pemuat uji ini, dan mencerminkan sumbernya tidak akan membuktikan apa pun.
const panahDelta = (delta: number, datar: boolean) => (datar ? '—' : delta > 0 ? '▲' : delta < 0 ? '▼' : '—')
assert.equal(panahDelta(-0.8, false), '▼', 'a fall in the number must draw a down arrow, whatever the verdict')
assert.equal(panahDelta(7.5, false), '▲', 'a rise in the number must draw an up arrow')
assert.equal(panahDelta(-0.3, true), '—', 'a change below threshold must draw neither arrow')
// Dan sumbernya harus benar-benar memakai tanda deltanya, bukan penilaiannya.
assert.ok(/return delta > 0 \? '▲' : delta < 0 \? '▼' : '—'/.test(grafik),
  'the arrow is no longer taken from the sign of the change')
assert.ok(!/membaik: \{ panah: '▲'/.test(grafik),
  'the arrow was tied back to the verdict; a fall would again show an up arrow beside a negative number')
// Label langsung hanya pada titik terakhir.
assert.ok(/x=\{L - pad\.kanan \+ 5\}/.test(grafik), 'the direct label is no longer anchored to the last point only')
assert.ok(!/deret\.map[\s\S]{0,200}<text/.test(grafik), 'a value label was put on every point')
// Nol tidak boleh digambar untuk data yang tidak ada.
assert.ok(/Nothing recorded yet/.test(grafik), 'an empty measure no longer says it is empty')

// ── 7. Halaman: tabel tersedia, dan sesi tidak diketik ulang ──────────────
const halaman = readFileSync(new URL('../../src/pages/PelatihProgres.tsx', import.meta.url), 'utf8')
assert.ok(/Show as table/.test(halaman), 'the table view is gone; colour and shape became the only encoding')
assert.ok(/asal === 'diisi sendiri'/.test(halaman),
  'every measure became typeable, including the one the training log already holds')
assert.ok(/getWorkouts\(\)/.test(halaman), 'session count is no longer read from the training log')
assert.ok(BATAS_PROGRES.some((b) => /not evidence of cause/i.test(b)), 'the causation limit disappeared')
assert.ok(BATAS_PROGRES.length >= 4, 'the limits were thinned out')

console.log('progres-pekanan: ok')
