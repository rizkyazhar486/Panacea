// C6 (bagian rekayasa), tahap 11: aritmetika dosis anak berbasis berat (pedsDose). Mesin ini HANYA aritmetika masukan pengguna:
// tidak ada dosis, batas maksimum, atau indikasi obat di dalamnya (milik formularium dan klinisi). Acuan ditulis TERPISAH
// (satu pecahan, bukan tiga langkah) dan tidak mengimpor konstanta mesin. Bukti rekayasa, BUKAN tinjauan klinis.
import assert from 'node:assert/strict'
import { HOSTILE, close, mulberry32 } from './support/calculatorHarness.mts'
import { PEDS_FREQUENCY_PER_DAY, PEDS_WEIGHT_KG, pedsDose } from '../../src/domains/clinical-calculators/index.ts'

// Rentang ditulis ulang sebagai literal: mengubah tabel mesin tidak boleh ikut mengubah acuan.
assert.deepEqual({ ...PEDS_WEIGHT_KG }, { min: 0.3, max: 200 })
assert.deepEqual({ ...PEDS_FREQUENCY_PER_DAY }, { min: 1, max: 24 })

const rand = mulberry32(20261023)
const between = (min: number, max: number) => min + (max - min) * rand()
const ref = (w: number, d: number, f: number, c: number) => ({ day: w * d, dose: (w * d) / f, ml: (w * d) / (f * c) })
const run = (w: unknown, d: unknown, f: unknown, c: unknown) => pedsDose(w as number, d as number, f as number, c as number)
const GOOD = { w: 12, d: 50, f: 3, c: 25 }

// 1. Acuan terpisah pada sampel acak berbenih (positif).
for (let i = 0; i < 400; i++) {
  const w = between(0.3, 200), d = between(0.01, 500), f = 1 + Math.floor(rand() * 24), c = between(0.01, 500)
  const r = run(w, d, f, c)
  assert.equal(r.ok, true, `random ${w},${d},${f},${c} must compute`)
  if (!r.ok) continue
  const e = ref(w, d, f, c)
  close(r.data.totalDailyMg, e.day, 'totalDailyMg'); close(r.data.perDoseMg, e.dose, 'perDoseMg'); close(r.data.perDoseMl, e.ml, 'perDoseMl')
}

// 2. Nilai emas (dihitung tangan): 12 kg x 50 mg/kg/hari = 600 mg/hari; /3 = 200 mg/dosis; /25 mg/mL = 8 mL/dosis.
{
  const r = run(GOOD.w, GOOD.d, GOOD.f, GOOD.c)
  assert.deepEqual(r, { ok: true, data: { totalDailyMg: 600, perDoseMg: 200, perDoseMl: 8 } })
}

// 3. Batas berat dan frekuensi: tepat di batas sah, sedikit di luar ditolak (pasangan: hanya satu kolom berbeda).
for (const w of [0.3, 200]) assert.equal(run(w, GOOD.d, GOOD.f, GOOD.c).ok, true, `weight ${w} at boundary`)
for (const w of [0.3 - 1e-6, 200 + 1e-6, 0, -1]) assert.equal(run(w, GOOD.d, GOOD.f, GOOD.c).ok, false, `weight ${w} outside`)
for (const f of [1, 24]) assert.equal(run(GOOD.w, GOOD.d, f, GOOD.c).ok, true, `frequency ${f} at boundary`)
for (const f of [0, 25, 2.5, -1, 24.000001]) assert.equal(run(GOOD.w, GOOD.d, f, GOOD.c).ok, false, `frequency ${f} outside or fractional`)

// 4. Masukan bermusuhan pada SATU kolom (kolom lain sah): tidak pernah melempar dan tidak pernah menghasilkan angka.
const columns: Array<[string, (v: unknown) => unknown]> = [
  ['weight', (v) => run(v, GOOD.d, GOOD.f, GOOD.c)],
  ['dose', (v) => run(GOOD.w, v, GOOD.f, GOOD.c)],
  ['frequency', (v) => run(GOOD.w, GOOD.d, v, GOOD.c)],
  ['concentration', (v) => run(GOOD.w, GOOD.d, GOOD.f, v)],
]
for (const [name, call] of columns) {
  for (const bad of HOSTILE) {
    // Angka hingga positif sah untuk dosis dan konsentrasi (tak ada batas atas di mesin); selebihnya harus ditolak.
    if (typeof bad === 'number' && Number.isFinite(bad) && bad > 0 && (name === 'dose' || name === 'concentration')) continue
    if (typeof bad === 'number' && Number.isFinite(bad) && name === 'weight' && bad >= 0.3 && bad <= 200) continue
    if (typeof bad === 'number' && Number.isFinite(bad) && name === 'frequency' && bad >= 1 && bad <= 24 && Number.isInteger(bad)) continue
    let r: { ok: boolean } | undefined
    assert.doesNotThrow(() => { r = call(bad) as { ok: boolean } }, `${name}=${String(bad)} must not throw`)
    assert.equal(r?.ok, false, `${name}=${JSON.stringify(bad) ?? String(bad)} must not produce a result`)
  }
}

// 5. Luapan dan underflow: masukan "hingga dan > 0" yang menghasilkan nilai tak hingga bukan hasil.
assert.deepEqual(run(200, 1e308, 1, 1), { ok: false, reason: 'Result is not a finite number — check the dose and concentration' })
assert.equal(run(GOOD.w, GOOD.d, 1, 1e-320).ok, false, 'concentration underflow gives Infinity mL and must be refused')
// Pasangan kontrol: nilai besar tetapi masih hingga tetap dihitung.
assert.equal(run(1, 1e300, 1, 1).ok, true, 'large but finite stays valid')

// 6. Determinisme: dua kali jalan, hasil identik.
assert.deepEqual(run(GOOD.w, GOOD.d, GOOD.f, GOOD.c), run(GOOD.w, GOOD.d, GOOD.f, GOOD.c))

console.log('calculator-independent-reference-11: pedsDose (seeded reference ×400, golden 600/200/8, boundaries, hostile columns, overflow/underflow, determinism)')
