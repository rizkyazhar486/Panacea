import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { kebugaranKardio } from '../../src/lib/athlytic.ts'
import { nilaiKebugaran, titikTengahVo2 } from '../../src/lib/bugarIlmiah.ts'

const deret = [
  { tanggal: '2026-03-01', nilai: 40 },
  { tanggal: '2026-09-01', nilai: 42 },
]

// ── 1. Tanpa usia tersimpan: angkanya tetap, pembandingannya TIDAK ada ─────
// Inilah cacatnya. getDemo() memberi usia 30 kepada orang yang belum pernah
// mengisi apa pun, dan papan itu lalu mengatakan "kamu di bawah titik tengah
// seusiamu" -- kepada orang yang usianya tidak diketahui siapa pun.
for (const [usia, jk] of [[null, 'L'], [30, null], [null, null], [0, 'L'], [Number.NaN, 'L'], [-4, 'P']] as const) {
  const k = kebugaranKardio(deret, usia as number | null, jk as 'L' | 'P' | null, nilaiKebugaran)
  assert.ok(k, `usia=${usia} jk=${jk}: the VO2 figure itself must survive`)
  assert.equal(k.bandingSeusia, false, `usia=${usia} jk=${jk}: an age comparison was made without an age`)
  for (const bidang of ['titikTengah', 'pita', 'selisihMet', 'hr'] as const) {
    assert.equal(k[bidang], null, `usia=${usia} jk=${jk}: ${bidang} was produced without a real age`)
  }
  assert.equal(k.usiaDipakai, null, 'an age was recorded as used when none was known')
  // Yang TIDAK bergantung pada usia harus tetap ada.
  assert.equal(k.kini, 42, 'the measured VO2max was withheld unnecessarily')
  assert.equal(k.delta, 2, 'the 90-day direction needs no age and must survive')
}

// ── 2. Dengan usia tersimpan: pembandingannya utuh dan benar ───────────────
for (const usia of [22, 30, 45, 58, 71]) {
  for (const jk of ['L', 'P'] as const) {
    const k = kebugaranKardio(deret, usia, jk, nilaiKebugaran)
    assert.ok(k && k.bandingSeusia, `usia=${usia} jk=${jk}: a stored age must produce the comparison`)
    assert.equal(k.usiaDipakai, usia, 'the age used was not reported back')
    assert.equal(k.titikTengah, Math.round(titikTengahVo2(usia, jk) * 10) / 10,
      `usia=${usia} jk=${jk}: midpoint drifted from the published norm`)
    assert.ok(typeof k.pita === 'string' && k.pita.length > 0, 'band missing')
  }
}

// ── 3. Titik tengah 30 tahun BUKAN titik tengah usia lain ──────────────────
// Kalau suatu hari norma itu menjadi datar terhadap usia, seluruh perbaikan
// ini kehilangan alasannya -- dan menyulih 30 akan kembali tidak berbahaya.
// Uji ini memaksa kenyataan itu diperiksa, bukan diasumsikan.
for (const jk of ['L', 'P'] as const) {
  assert.notEqual(Math.round(titikTengahVo2(30, jk)), Math.round(titikTengahVo2(58, jk)),
    `${jk}: the age norm is flat, so the whole distinction is moot — re-read this gate`)
}

// ── 4. Papan tidak boleh menggambar batang pembanding tanpa pembandingan ───
// Sebuah penanda di tengah skala "−4 MET … age midpoint … +4 MET" MENYATAKAN
// sebuah pembandingan. Menggambarnya dengan nilai null adalah berbohong lewat
// tata letak, bukan lewat kalimat.
const papan = readFileSync(new URL('../../src/pages/PapanAtlet.tsx', import.meta.url), 'utf8')
assert.ok(/kardio\.bandingSeusia\s*&&\s*kardio\.selisihMet\s*!==\s*null/.test(papan),
  'the MET midpoint bar is not gated on an actual age comparison')
assert.ok(/age and sex are not stored/.test(papan),
  'the board never tells the reader why the comparison is absent')
// Sumber demografinya untuk pembandingan harus yang TERSIMPAN.
assert.ok(/kebugaranKardio\(deretVo2,\s*usiaTersimpan,\s*jkTersimpan/.test(papan),
  'the age comparison is fed from getDemo(), which substitutes 30 for an empty profile')

console.log('vo2-norma-usia: ok')
