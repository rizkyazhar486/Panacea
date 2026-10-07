import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fluidBalance, ivDrip } from '../../src/domains/clinical-calculators/index.ts'

// ── IV drip: nilai tangan ──
assert.deepEqual(ivDrip(1000, 1, 15), { ok: true, data: { mlPerHour: 1000, dropsPerMin: 250 } })
assert.deepEqual(ivDrip(500, 8, 20), { ok: true, data: { mlPerHour: 62.5, dropsPerMin: 500 * 20 / 480 } })
assert.deepEqual(ivDrip(60, 1, 60), { ok: true, data: { mlPerHour: 60, dropsPerMin: 60 } })
// Pasangan: hanya faktor tetes berbeda → tetes/menit berubah proporsional, mL/jam tetap.
const a = ivDrip(500, 8, 15), b = ivDrip(500, 8, 60)
assert.ok(a.ok && b.ok && a.data.mlPerHour === b.data.mlPerHour && b.data.dropsPerMin === a.data.dropsPerMin * 4)
// Batas volume & durasi.
for (const [v, h] of [[1, 8], [20000, 8], [500, 0.1], [500, 168]] as const) assert.equal(ivDrip(v, h, 20).ok, true, `${v},${h}`)
const GV = { ok: false, reason: 'Volume must be 1–20000 mL' }, GH = { ok: false, reason: 'Duration must be 0.1–168 hours' }
for (const v of [0.99, 0, -500, 20000.01, NaN, Infinity, +'']) assert.deepEqual(ivDrip(v, 8, 20), GV, `volume ${v}`)
for (const h of [0.09, 0, -1, 168.01, NaN, Infinity, +'']) assert.deepEqual(ivDrip(500, h, 20), GH, `jam ${h}`)
const GF = { ok: false, reason: 'Drop factor must be 15, 20 or 60 drops/mL' }
for (const f of [0, 10, 16, 19.9, 61, -20, NaN, Infinity]) assert.deepEqual(ivDrip(500, 8, f), GF, `faktor ${f}`)
for (const salah of [undefined, null, '500', {}] as unknown as number[]) {
  assert.equal(ivDrip(salah, 8, 20).ok, false); assert.equal(ivDrip(500, salah, 20).ok, false); assert.equal(ivDrip(500, 8, salah).ok, false)
}
assert.equal('data' in (ivDrip(500, 0, 20) as object), false)
// Jebakan nyata: durasi kosong → pembagian nol → Infinity tetes/menit.
assert.equal((500 * 20) / (+'' * 60), Infinity)

// ── Balans cairan ──
const nol = { oralIn: 0, ivIn: 0, otherIn: 0, urineOut: 0, drainOut: 0, insensibleOut: 0, otherOut: 0 }
assert.deepEqual(fluidBalance({ ...nol, insensibleOut: 500 }), { ok: true, data: { totalIn: 0, totalOut: 500, balance: -500 } })
assert.deepEqual(
  fluidBalance({ oralIn: 1000, ivIn: 1500, otherIn: 100, urineOut: 1800, drainOut: 200, insensibleOut: 600, otherOut: 50 }),
  { ok: true, data: { totalIn: 2600, totalOut: 2650, balance: -50 } },
)
// Kolom kosong dibaca 0 (tidak ada cairan) dan diterima.
assert.equal(fluidBalance({ ...nol, urineOut: +'' }).ok, true)
// Batas per kolom, dan tiap kolom ditolak dengan nama kolomnya (pasangan: hanya kolom itu yang rusak).
const NAMA = {
  oralIn: 'Oral/Enteral intake', ivIn: 'IV/Infusion intake', otherIn: 'Other intake', urineOut: 'Urine output',
  drainOut: 'Drain/NGT output', insensibleOut: 'Insensible loss', otherOut: 'Other output',
} as const
for (const [kolom, nama] of Object.entries(NAMA)) {
  assert.equal(fluidBalance({ ...nol, [kolom]: 0 }).ok, true, `${kolom}=0`)
  assert.equal(fluidBalance({ ...nol, [kolom]: 20000 }).ok, true, `${kolom}=20000`)
  for (const buruk of [-1, -0.01, 20000.01, NaN, Infinity, -Infinity]) {
    assert.deepEqual(fluidBalance({ ...nol, [kolom]: buruk }), { ok: false, reason: `${nama} must be 0–20000 mL` }, `${kolom}=${buruk}`)
  }
}
for (const salah of [undefined, null, '100'] as unknown as number[]) assert.equal(fluidBalance({ ...nol, ivIn: salah }).ok, false)
assert.equal('data' in (fluidBalance({ ...nol, ivIn: -5 }) as object), false)
assert.deepEqual(fluidBalance({ ...nol, ivIn: 10 }), fluidBalance({ ...nol, ivIn: 10 }), 'deterministik')

// Halaman memakai fungsi kanonik, tanpa menghitung ulang.
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /ivDrip\(volumeMl, hours, dropFactor\)/)
assert.match(halaman, /fluidBalance\(\{ oralIn, ivIn, otherIn, urineOut, drainOut, insensibleOut: insensible, otherOut \}\)/)
assert.match(halaman, /drip\.ok \?/)
assert.match(halaman, /fluid\.ok \?/)
assert.match(halaman, /\{drip\.reason\}/)
assert.match(halaman, /\{fluid\.reason\}/)
assert.doesNotMatch(halaman, /\(volumeMl \* dropFactor\)/, 'rumus tetes/menit tidak boleh disalin ke halaman')
assert.doesNotMatch(halaman, /totalIn - totalOut/, 'balans tidak boleh dihitung ulang di halaman')
console.log('iv-drip-fluid-balance: golden values, fail-closed ranges by field name, single-source formulas')
