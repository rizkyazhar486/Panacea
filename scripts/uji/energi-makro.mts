import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hitungTdee } from '../../src/lib/tdee'
import { bagiEnergi, kalimatSelisih, puncakMenit, ATWATER, AMBANG_KKAL } from '../../src/lib/energiMakro'
import { susunPekan } from '../../src/lib/organizerLatihan'

// ─────────────────────────────────────────────────────────────────────────────
// SEBUAH BATANG HARUS MENGAKUI KETIKA ANGKANYA TIDAK BERJUMLAH.
//
// Grafik gizi punya satu godaan tetap: menormalkan ketiga makro menjadi 100%
// supaya batangnya selalu penuh dan selalu rapi. Normalisasi itulah yang
// menyembunyikan satu-satunya hal yang perlu dilihat — rencana yang tidak
// berjumlah ke targetnya sendiri.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Perkara biasa: makronya memang berjumlah ke target ─────────────────
const biasa = hitungTdee({ beratKg: 70, tinggiCm: 175, umur: 28, sex: 'M', tujuan: 'rawat', aktivitas: 'sedang' })
const b1 = bagiEnergi(biasa)
assert.ok(b1.berjumlah, `an ordinary plan should add up, but it is off by ${b1.selisihKkal} kcal`)
assert.ok(Math.abs(b1.selisihKkal) <= AMBANG_KKAL)
assert.match(kalimatSelisih(b1), /add up to the daily target/)

// Pecahannya berjumlah satu, dan dihitung terhadap JUMLAH, bukan target.
assert.ok(Math.abs(b1.segmen.reduce((n, s) => n + s.pecahan, 0) - 1) < 1e-9,
  'the segments no longer fill the bar')

// Faktor Atwater dipakai apa adanya, bukan dikarang ulang.
const p = b1.segmen.find((s) => s.kunci === 'protein')!
assert.equal(p.kkal, biasa.proteinG * 4)
assert.equal(ATWATER.lemak, 9)

// ── 2. Perkara yang menjadi alasan grafik ini ada ─────────────────────────
// tdee.ts menjepit karbohidrat di nol. Untuk badan berat dengan tujuan
// menurunkan berat, protein dan lemak SAJA sudah melampaui target, dan
// rencananya berhenti berjumlah tanpa ada yang gagal. Angka di bawah bukan
// karangan: ia keluar dari hitungTdee sendiri.
const jepit = hitungTdee({ beratKg: 140, tinggiCm: 158, umur: 58, sex: 'F', tujuan: 'defisit', aktivitas: 'ringan' })
assert.equal(jepit.karboG, 0, 'the premise of this case changed: carbohydrate is no longer clamped to zero here')
const b2 = bagiEnergi(jepit)
assert.ok(!b2.berjumlah, 'a plan whose macros overshoot the target was reported as adding up')
assert.ok(b2.selisihKkal > AMBANG_KKAL, `expected an overshoot, got ${b2.selisihKkal} kcal`)
assert.equal(b2.jumlahKkal, jepit.proteinG * 4 + jepit.lemakG * 9)
assert.match(kalimatSelisih(b2), /above the .* kcal target/)
assert.match(kalimatSelisih(b2), /Carbohydrate cannot go below zero/)

// Inilah pemeriksaan yang menangkap normalisasi: kalau pecahan dihitung
// terhadap target, potongannya di perkara ini akan berjumlah LEBIH dari satu
// dan batangnya meluber tanpa memberi tahu siapa pun.
assert.ok(Math.abs(b2.segmen.reduce((n, s) => n + s.pecahan, 0) - 1) < 1e-9,
  'the bar no longer sums to its own width in the clamped case')
assert.equal(b2.segmen.find((s) => s.kunci === 'karbo')!.pecahan, 0,
  'zero carbohydrate was drawn as a visible slice')

// ── 3. Pekan: istirahat adalah bagian rencana, bukan lubang ──────────────
const pekan = susunPekan({ hariLatihan: 4, fokus: 'seimbang', sesiLari: 0 }, null)
assert.equal(pekan.length, 7, 'the week is no longer seven days; the chart would show a short week')
const beban = pekan.map((h) => ({ indeks: h.indeks, hari: h.hari, menit: h.menit, judul: h.judul, latihan: h.menit > 0 }))
assert.ok(beban.some((h) => h.menit === 0), 'no rest day exists in a four-day week — re-read this gate')
assert.ok(puncakMenit(beban) >= Math.max(...beban.map((h) => h.menit)),
  'the bar scale is shorter than the longest session, so that session would overflow its own chart')
assert.ok(puncakMenit([{ indeks: 0, hari: 'Monday', menit: 5, judul: 'x', latihan: true }]) >= 30,
  'a single short session would be drawn as a full-height bar')

// ── 4. Warna tidak boleh menjadi satu-satunya pembawa arti ───────────────
const komponen = readFileSync(new URL('../../src/components/GrafikEnergiPekan.tsx', import.meta.url), 'utf8')
assert.ok(/\{s\.label\}/.test(komponen), 'the legend no longer prints each macro by name')
assert.ok(/\{s\.gram\.toLocaleString\(\)\} g/.test(komponen), 'the legend no longer prints grams')
assert.ok(/aria-label=/.test(komponen), 'the charts are unreadable to assistive tech')
// Hari istirahat digambar, bukan dibiarkan setinggi nol yang tidak terlihat.
assert.ok(/border-dashed/.test(komponen), 'rest days are no longer drawn at all')
// Kalimat selisih ikut ditampilkan; batangnya saja tidak menyebut angka.
assert.ok(/kalimatSelisih\(b\)/.test(komponen), 'the chart stopped saying whether the plan adds up')

console.log(`energi-makro: ok (ordinary plan off by ${b1.selisihKkal} kcal; clamped plan overshoots by ${b2.selisihKkal} kcal)`)
