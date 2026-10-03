import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { centorMcIsaac } from '../../src/domains/clinical-calculators/index.ts'

const NONE = { fever: false, noCough: false, tenderNodes: false, exudate: false }
const ALL = { fever: true, noCough: true, tenderNodes: true, exudate: true }
const hasil = (c: typeof NONE, usia: number) => { const r = centorMcIsaac(c, usia); assert.ok(r.ok, `usia ${usia}`); return r.ok ? r.data : (undefined as never) }

// Nilai tangan: kriteria + koreksi usia, tiap bucket risiko (teks dipindahkan utuh dari halaman).
assert.deepEqual(hasil(NONE, 30), { total: 0, ageAdjustment: 0, riskLabel: 'Very low risk (1-2.5%)', tone: 'normal', note: 'No swab/empiric antibiotics needed.' })
assert.equal(hasil({ ...NONE, fever: true }, 30).riskLabel, 'Low risk (5-10%)')
assert.equal(hasil({ ...NONE, fever: true, noCough: true }, 30).riskLabel, 'Moderate risk (11-17%)')
assert.equal(hasil({ ...ALL, exudate: false }, 30).riskLabel, 'High risk (28-35%)')
assert.deepEqual(hasil(ALL, 30), { total: 4, ageAdjustment: 0, riskLabel: 'Very high risk (51-53%)', tone: 'critical', note: 'Consider empiric antibiotics (e.g. penicillin) or a rapid test first per local policy.' })
assert.equal(hasil(ALL, 10).total, 5) // anak: +1, skor melewati 4 tetap bucket tertinggi
assert.equal(hasil(NONE, 50).total, -1) // ≥45: −1, bucket terendah
// Batas usia koreksi (berpasangan: hanya usia yang beda).
assert.equal(hasil(NONE, 14.99).ageAdjustment, 1); assert.equal(hasil(NONE, 15).ageAdjustment, 0)
assert.equal(hasil(NONE, 44.99).ageAdjustment, 0); assert.equal(hasil(NONE, 45).ageAdjustment, -1)
// Batas rentang usia: tepat di batas diterima, ±1 langkah ditolak.
for (const u of [1, 120]) assert.equal(centorMcIsaac(NONE, u).ok, true, `usia ${u}`)
const TOLAK = { ok: false, reason: 'Age must be 1–120 years' }
for (const u of [0.99, 120.01, 0, -5, 999, NaN, Infinity, -Infinity, +'']) assert.deepEqual(centorMcIsaac(NONE, u), TOLAK, `usia ${u}`)
for (const salah of [undefined, null, '30', {}] as unknown as number[]) assert.equal(centorMcIsaac(NONE, salah).ok, false)
// Kriteria bukan boolean ditolak, tanpa angka.
const KRIT = { ok: false, reason: 'Each criterion must be yes or no' }
assert.deepEqual(centorMcIsaac({ ...NONE, fever: 1 as unknown as boolean }, 30), KRIT)
assert.deepEqual(centorMcIsaac(undefined as unknown as typeof NONE, 30), KRIT)
assert.equal('data' in (centorMcIsaac(NONE, 0) as object), false)
// Deterministik.
assert.deepEqual(centorMcIsaac(ALL, 30), centorMcIsaac(ALL, 30))
// Jebakan nyata: usia kosong terbaca 0 → halaman lama memberi +1 (anak) tanpa peringatan.
assert.equal(+'' < 15, true)

const halaman = readFileSync('src/pages/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /centorMcIsaac\(\{ fever, noCough, tenderNodes, exudate \}, age\)/)
for (const re of [/centor\.ok \?/, /\{centor\.reason\}/]) assert.match(halaman, re)
assert.doesNotMatch(halaman, /const ageAdj = /, 'koreksi usia McIsaac tidak boleh dihitung ulang di halaman')
console.log('centor-mcisaac: golden buckets, age boundaries, fail-closed age/criteria, single-source score')
