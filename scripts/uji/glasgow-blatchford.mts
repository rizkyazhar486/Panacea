import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { glasgowBlatchford, GBS_RANGES, GBS_FLAG_POINTS, bunPoints, hgbPoints, sbpPoints } from '../../src/domains/clinical-calculators/index.ts'

const base = { bun: 15, hgb: 14, sbp: 120, sex: 'M' as unknown, flags: {} as Record<string, boolean> }
const run = (o: Partial<typeof base> = {}) => glasgowBlatchford({ ...base, ...o })

// Nilai tangan: BUN 15 (0) + Hb 14 laki-laki (0) + SBP 120 (0) = 0 → very-low hanya karena SEMUA sah.
const nol = run(); assert.equal(nol.score, 0); assert.equal(nol.veryLowRisk, true); assert.equal(nol.band, 'very-low')
// Kasus berat: BUN 80 (6) + Hb 9 M (6) + SBP 85 (3) + melena 1 + sinkop 2 = 18.
const berat = run({ bun: 80, hgb: 9, sbp: 85, flags: { melena: true, syncope: true } }); assert.equal(berat.score, 18); assert.equal(berat.band, 'high')
// Perempuan: Hb 11 → 1 poin (laki-laki 3).
assert.equal(run({ hgb: 11, sex: 'F' }).score, 1); assert.equal(run({ hgb: 11, sex: 'M' }).score, 3)

// Batas ambang BUN/Hb/TD tepat dan ±1 langkah (nilai persis dari halaman lama).
const bunB: [number, number][] = [[18.1, 0], [18.2, 2], [22.3, 2], [22.4, 3], [27.9, 3], [28, 4], [69.9, 4], [70, 6]]
for (const [v, p] of bunB) assert.equal(bunPoints(v), p, `BUN ${v}`)
const hM: [number, number][] = [[13, 0], [12.9, 1], [12, 1], [11.9, 3], [10, 3], [9.9, 6]]
for (const [v, p] of hM) assert.equal(hgbPoints(v, 'M'), p, `Hb M ${v}`)
const hF: [number, number][] = [[12, 0], [11.9, 1], [10, 1], [9.9, 6]]
for (const [v, p] of hF) assert.equal(hgbPoints(v, 'F'), p, `Hb F ${v}`)
const sB: [number, number][] = [[110, 0], [109, 1], [100, 1], [99, 2], [90, 2], [89, 3]]
for (const [v, p] of sB) assert.equal(sbpPoints(v), p, `SBP ${v}`)
// Pasangan: hanya BUN yang berbeda memutar skor 0 → 2 (selisih satu langkah di ambang 18.2).
assert.notEqual(run({ bun: 18.1 }).score, run({ bun: 18.2 }).score)
// Poin kotak centang dipatok.
assert.deepEqual({ ...GBS_FLAG_POINTS }, { hr: 1, melena: 1, syncope: 2, hepatic: 2, cardiac: 2 })
for (const [k, p] of Object.entries(GBS_FLAG_POINTS)) assert.equal(run({ flags: { [k]: true } }).score, p, k)
assert.equal(run({ flags: { hr: false, melena: false } }).score, 0)
// Pita risiko.
assert.equal(run({ flags: { hr: true } }).band, 'low-moderate') // 1
assert.equal(run({ flags: { hr: true } }).veryLowRisk, false) // skor 1 bukan very-low (ambang pulang hanya 0)
// Batas pita: 5 → low-moderate, 6 → high (pasangan: hanya satu poin berbeda).
assert.equal(run({ flags: { syncope: true, hepatic: true, hr: true } }).score, 5)
assert.equal(run({ flags: { syncope: true, hepatic: true, hr: true } }).band, 'low-moderate')
assert.equal(run({ flags: { syncope: true, hepatic: true, hr: true, melena: true } }).score, 6)
assert.equal(run({ flags: { syncope: true, hepatic: true, hr: true, melena: true } }).band, 'high')
assert.equal(run({ bun: 80, hgb: 9, sbp: 85 }).band, 'high')
assert.deepEqual(run(), run())

// Regresi vs aritmetika halaman lama pada grid kecil (semua nilai sah).
const oldBun = (v: number) => (v < 18.2 ? 0 : v < 22.4 ? 2 : v < 28 ? 3 : v < 70 ? 4 : 6)
const oldHgb = (v: number, s: string) => (s === 'M' ? (v >= 13 ? 0 : v >= 12 ? 1 : v >= 10 ? 3 : 6) : v >= 12 ? 0 : v >= 10 ? 1 : 6)
const oldSbp = (v: number) => (v >= 110 ? 0 : v >= 100 ? 1 : v >= 90 ? 2 : 3)
for (const bun of [5, 18.2, 25, 50, 90]) for (const hgb of [8, 10.5, 12.5, 15]) for (const sbp of [70, 95, 105, 130]) for (const sex of ['M', 'F'])
  assert.equal(run({ bun, hgb, sbp, sex }).score, oldBun(bun) + oldHgb(hgb, sex) + oldSbp(sbp), `${bun}/${hgb}/${sbp}/${sex}`)

// Kosong → "belum diisi" bernama; TANPA skor dan tanpa "very-low" (inti keselamatan: 0 tidak boleh muncul dari data kosong).
const kosong = run({ bun: NaN, hgb: NaN, sbp: NaN })
assert.deepEqual(kosong.missing, ['blood urea', 'haemoglobin', 'systolic BP']); assert.equal(kosong.score, null); assert.equal(kosong.veryLowRisk, null); assert.equal(kosong.band, null)
assert.deepEqual(run({ hgb: NaN }).missing, ['haemoglobin'])
// Regresi: BUN 5000 / Hb 0.1 / SBP 0 / Infinity dulu lolos "> 0" → ditolak dengan alasan, tanpa skor.
assert.deepEqual(run({ bun: 5000 }).invalid, ['blood urea must be 1–300 mg/dL']); assert.equal(run({ bun: 5000 }).score, null)
assert.deepEqual(run({ hgb: 0.1 }).invalid, ['haemoglobin must be 2–25 g/dL'])
assert.deepEqual(run({ sbp: 0 }).invalid, ['systolic BP must be 30–300 mmHg']); assert.equal(run({ sbp: 0 }).veryLowRisk, null)
assert.equal(run({ bun: Infinity }).score, null); assert.equal(run({ bun: -5 }).score, null)
assert.equal(run({ bun: '15' as unknown as number }).score, null) // string bukan angka
// Jenis kelamin tidak sah ditolak (dulu hanya dua nilai di TypeScript).
assert.deepEqual(run({ sex: 'X' }).invalid, ['sex must be M or F']); assert.equal(run({ sex: undefined }).score, null)
// Batas rentang diterima, ±1 langkah ditolak.
for (const [k, r] of Object.entries(GBS_RANGES)) {
  assert.notEqual(run({ [k]: r.min }).score, null, `${k} min`); assert.notEqual(run({ [k]: r.max }).score, null, `${k} max`)
  assert.equal(run({ [k]: r.min - 0.1 }).score, null, `${k} <min`); assert.equal(run({ [k]: r.max + 0.1 }).score, null, `${k} >max`)
}

// Halaman: teks mentah + mesin domain; tidak ada `|| 0` dan tidak ada nilai bawaan.
const page = readFileSync(new URL('../../src/pages/clinical/scores/GlasgowBlatchfordScore.tsx', import.meta.url), 'utf8')
assert.ok(/parseNumberField\(bun\)/.test(page) && /glasgowBlatchford\(/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali: kolom kosong terbaca sebagai 0')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'halaman tidak menampilkan alasan penolakan')
console.log('glasgow-blatchford: poin & ambang persis, grid regresi lawan halaman lama, kosong/di luar rentang gagal tertutup, jenis kelamin tak sah ditolak')
