import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sleepDebt, sanitizeNights, validateNeed, validateHours, SLEEP_RANGES, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const N = (hs: number[]) => hs.map((h, i) => ({ date: `2026-10-${String(20 - i).padStart(2, '0')}`, hours: h }))
const data = (need: number, hs: number[]) => { const r = sleepDebt(need, N(hs)); assert.ok(r.ok); return r.ok ? r.data : (undefined as never) }
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`)

// Nilai tangan: kebutuhan 8, tidur 7, 6.5, 8 → utang 1 + 1.5 + 0 = 2.5 (> 2 → low); rata-rata 7.1666…
const d = data(8, [7, 6.5, 8])
close(d.debt, 2.5); close(d.avg, (7 + 6.5 + 8) / 3); assert.equal(d.tone, 'low'); assert.equal(d.verdict, 'Mild sleep debt — protect your next few nights'); assert.equal(d.counted, 3)
// Tanpa catatan: utang 0, rata-rata 0 (bukan NaN), baik.
const kosong = data(8, [])
assert.deepEqual(kosong, { debt: 0, avg: 0, tone: 'brand', verdict: 'Well-rested — minimal debt', counted: 0 })
// Surplus: tidur lebih dari kebutuhan → utang negatif, baik.
close(data(7, [9, 9]).debt, -4); assert.equal(data(7, [9, 9]).tone, 'brand')
// Batas nada: utang tepat 2 → brand; 2.01 → low; tepat 8 → low; 8.01 → critical.
assert.equal(data(8, [6]).tone, 'brand'); assert.equal(data(8, [5.99]).tone, 'low')
assert.equal(data(8, [0, 0]).debt, 16)
assert.equal(data(8, [4, 4]).tone, 'low'); close(data(8, [4, 4]).debt, 8)
assert.equal(data(8, [4, 3.99]).tone, 'critical')
// Hanya 14 malam terbaru dihitung (mulai dari yang pertama di daftar).
const dua = data(8, [...Array(14).fill(8), 0, 0])
assert.equal(dua.counted, 14); assert.equal(dua.debt, 0)
assert.equal(data(8, [...Array(13).fill(8), 0]).debt, 8)
assert.deepEqual(sleepDebt(8, N([7])), sleepDebt(8, N([7])))

// Regresi vs halaman lama (rumus asli) pada grid kebutuhan × pola malam.
const lama = (need: number, hs: number[]) => {
  const l = hs.slice(0, 14); const debt = l.reduce((s, h) => s + (need - h), 0); const avg = l.length ? l.reduce((s, h) => s + h, 0) / l.length : 0
  return { debt, avg, tone: debt <= 2 ? 'brand' : debt <= 8 ? 'low' : 'critical' }
}
let n = 0
for (const need of [5, 6, 7, 7.5, 8, 9, 11]) for (const pat of [[], [8], [6, 6, 6], [4, 9, 7.25, 8, 5.5], Array(14).fill(6.5), Array(20).fill(5), [0, 16, 8]]) {
  const o = lama(need, pat); const r = data(need, pat)
  assert.equal(r.debt, o.debt); assert.equal(r.avg, o.avg); assert.equal(r.tone, o.tone); n++
}
assert.equal(n, 49)

// Rentang dan konstanta dipatok literal.
assert.deepEqual(JSON.parse(JSON.stringify(SLEEP_RANGES)), { need: { min: 5, max: 11 }, hours: { min: 0, max: 16 } })
const GN = { ok: false, reason: 'Sleep need must be 5–11 hours' }
for (const v of [5, 11]) assert.equal(validateNeed(v).ok, true)
for (const v of [4.99, 0, -8, 11.01, Number.NaN, Infinity, -Infinity]) assert.deepEqual(validateNeed(v), GN, `need ${v}`)
for (const v of [undefined, null, '8', {}] as unknown[]) assert.deepEqual(validateNeed(v), GN)
assert.deepEqual(sleepDebt(0, N([7])), GN); assert.equal('data' in sleepDebt(Number.NaN, N([7])), false)
const GH = { ok: false, reason: 'Hours slept must be 0–16' }
for (const v of [0, 16]) assert.equal(validateHours(v).ok, true) // 0 jam adalah nilai sah (begadang), bukan "kosong"
for (const v of [-0.25, 16.01, Number.NaN, Infinity]) assert.deepEqual(validateHours(v), GH, `jam ${v}`)
// Regresi: kolom kosong dulu = 0 → malam 0 jam palsu tercatat. Kini kosong ditolak, "0" diterima.
assert.deepEqual(validateHours(parseNumberField('')), GH)
assert.deepEqual(validateHours(parseNumberField('  ')), GH)
assert.equal(validateHours(parseNumberField('0')).ok, true)
assert.deepEqual(validateNeed(parseNumberField('')), GN)

// sanitizeNights: catatan tersimpan rusak dibuang dan dilaporkan.
const baik = { date: '2026-10-03', hours: 7.5 }
assert.deepEqual(sanitizeNights([baik]), { nights: [baik], dropped: 0 })
const rusak = [baik, { date: '2026-10-02', hours: 'x' }, { date: '2026-10-01', hours: Number.NaN }, { date: '2026-13-01', hours: 7 }, { date: '2026-10-1', hours: 7 }, { date: 20261001, hours: 7 }, { date: '2026-10-04', hours: -1 }, { date: '2026-10-05', hours: 17 }, null, 'x', 5, { hours: 7 }]
assert.deepEqual(sanitizeNights(rusak), { nights: [baik], dropped: rusak.length - 1 })
for (const bukanDaftar of [null, undefined, {}, 'x', 5]) assert.deepEqual(sanitizeNights(bukanDaftar), { nights: [], dropped: 0 })
// Batas tanggal dan jam yang sah tetap lolos; urutan dipertahankan.
const sah = [{ date: '2026-12-31', hours: 0 }, { date: '2026-01-01', hours: 16 }]
assert.deepEqual(sanitizeNights(sah), { nights: sah, dropped: 0 })
assert.equal(sanitizeNights([{ date: '2026-00-10', hours: 7 }]).nights.length, 0); assert.equal(sanitizeNights([{ date: '2026-10-32', hours: 7 }]).nights.length, 0); assert.equal(sanitizeNights([{ date: '2026-10-00', hours: 7 }]).nights.length, 0)

// Halaman.
const src = readFileSync('src/pages/SleepDebt.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { parseNumberField, sanitizeNights, sleepDebt, validateHours, type Night } from '../domains/clinical-calculators'"))
assert.ok(!/\|\|\s*0\)/.test(src), 'tidak boleh ada || 0')
assert.ok(!/reduce\(\(s, n\) => s \+ \(need/.test(src) && !/debt <= 2|debt <= 8/.test(src), 'rumus/ambang tidak boleh disalin ke halaman')
assert.ok(lines.includes('{!res.ok ? ('))
assert.ok(lines.some((l) => l.includes('disabled={!hoursChecked.ok}')))
assert.ok(lines.includes('if (!hoursChecked.ok) return'), 'tombol tidak boleh mencatat malam saat jam tidak valid')
assert.ok(lines.some((l) => l.includes('sanitizeNights(JSON.parse(localStorage.getItem(LS_KEY)')))

console.log('sleep-debt: hand values, tone cutoffs, 14-night window, 49-case old-page regression, fail-closed need/hours, corrupt stored nights dropped, empty field no longer a 0-hour night')
