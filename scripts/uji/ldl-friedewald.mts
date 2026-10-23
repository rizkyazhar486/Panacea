import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ldlFriedewald, ldlBand, LDL_RANGES, FRIEDEWALD_TG_LIMIT } from '../../src/domains/clinical-calculators/index.ts'

const base = { totalChol: 200, hdl: 50, tg: 150 }
const run = (o: Partial<typeof base> = {}) => ldlFriedewald({ ...base, ...o })

// Nilai tangan: 200 − 50 − 150/5 = 120; non-HDL 150; pita "Near optimal".
const r = run(); assert.equal(r.ldl, 120); assert.equal(r.nonHdl, 150); assert.equal(r.tgTooHigh, false); assert.equal(r.band?.label, 'Near optimal (100-129)'); assert.equal(r.band?.tone, 'brand')
assert.deepEqual(r.missing, []); assert.deepEqual(r.invalid, []); assert.equal(r.complete, true); assert.equal(r.ldlImplausible, false)
assert.equal(run({ totalChol: 260, hdl: 40, tg: 100 }).ldl, 200)

// Ambang pita tepat dan ±1 (NCEP ATP III), diuji lewat ldlBand dan lewat mesin.
const bands: [number, string, string][] = [[99.9, 'Optimal (<100)', 'brand'], [100, 'Near optimal (100-129)', 'brand'], [129.9, 'Near optimal (100-129)', 'brand'], [130, 'Borderline high (130-159)', 'low'], [159.9, 'Borderline high (130-159)', 'low'], [160, 'High (160-189)', 'critical'], [189.9, 'High (160-189)', 'critical'], [190, 'Very high (≥190)', 'critical']]
for (const [v, label, tone] of bands) { assert.equal(ldlBand(v).label, label, String(v)); assert.equal(ldlBand(v).tone, tone, String(v)) }
assert.equal(run({ totalChol: 250, hdl: 50, tg: 50 }).band?.label, 'Very high (≥190)') // 250−50−10 = 190 tepat di ambang
assert.equal(run({ totalChol: 249, hdl: 50, tg: 50 }).band?.label, 'High (160-189)') // 189
assert.notEqual(run({ totalChol: 249, hdl: 50, tg: 50 }).band?.label, run({ totalChol: 250, hdl: 50, tg: 50 }).band?.label) // pasangan di 190

// TG ≥ 400: LDL tidak dihitung, non-HDL tetap; 399 → dihitung (pasangan).
assert.equal(FRIEDEWALD_TG_LIMIT, 400)
const t400 = run({ tg: 400 }); assert.equal(t400.ldl, null); assert.equal(t400.band, null); assert.equal(t400.tgTooHigh, true); assert.equal(t400.nonHdl, 150); assert.equal(t400.ldlImplausible, false)
assert.notEqual(run({ tg: 399 }).ldl, null); assert.equal(run({ tg: 399 }).tgTooHigh, false)

// LDL terhitung ≤ 0 (TG/5 ≥ TC − HDL): tidak diberi pita "Optimal" — ditandai tidak sahih.
const neg = run({ totalChol: 100, hdl: 90, tg: 300 }) // 100−90−60 = −50
assert.equal(neg.ldl, null); assert.equal(neg.band, null); assert.equal(neg.ldlImplausible, true); assert.equal(neg.nonHdl, 10)
assert.equal(run({ totalChol: 100, hdl: 90, tg: 50 }).ldlImplausible, true) // 100−90−10 = 0 → batas: ≤ 0 tidak sahih
assert.equal(run({ totalChol: 100, hdl: 90, tg: 49 }).ldlImplausible, false) // pasangan: >0 diterima

// Kosong → bernama; tanpa non-HDL/LDL/pita.
const kosong = run({ totalChol: NaN, hdl: NaN, tg: NaN })
assert.deepEqual(kosong.missing, ['total cholesterol', 'HDL', 'triglycerides']); assert.equal(kosong.complete, false); assert.equal(kosong.ldl, null); assert.equal(kosong.nonHdl, null); assert.equal(kosong.band, null); assert.equal(kosong.tgTooHigh, null)
assert.deepEqual(run({ tg: NaN }).missing, ['triglycerides'])
// Regresi: TC 5e6 / HDL 1 / TG 0 lolos "> 0" dulu → hasil dan pita; kini ditolak dengan alasan.
assert.deepEqual(run({ totalChol: 5000000 }).invalid, ['total cholesterol must be 50–1000 mg/dL']); assert.equal(run({ totalChol: 5000000 }).band, null)
assert.deepEqual(run({ hdl: 1 }).invalid, ['HDL must be 5–200 mg/dL']); assert.deepEqual(run({ tg: 6 }).invalid, ['triglycerides must be 10–5000 mg/dL'])
assert.deepEqual(run({ hdl: 200, totalChol: 150 }).invalid, ['HDL must be below total cholesterol']) // non-HDL ≤ 0
assert.deepEqual(run({ hdl: 150, totalChol: 150 }).invalid, ['HDL must be below total cholesterol']) // batas: sama
assert.deepEqual(run({ hdl: 149, totalChol: 150 }).invalid, []) // pasangan: hanya HDL 1 lebih rendah
for (const bad of [Infinity, -1, 0]) assert.equal(run({ tg: bad }).complete, false, `tg ${bad}`)
assert.equal(run({ hdl: '50' as unknown as number }).complete, false)

// Batas rentang diterima; ± ditolak.
for (const [k, rg] of Object.entries(LDL_RANGES)) {
  const ok = (v: number) => run({ [k]: v, ...(k === 'hdl' ? { totalChol: 300 } : k === 'totalChol' ? { hdl: 10 } : {}) }).invalid.length === 0
  assert.ok(ok(rg.min), `${k} min`); assert.ok(!ok(rg.min - 0.1), `${k} <min`); assert.ok(!ok(rg.max + 0.1), `${k} >max`)
}
assert.deepEqual(run(), run())

const page = readFileSync(new URL('../../src/pages/clinical/scores/LdlCalculator.tsx', import.meta.url), 'utf8')
assert.ok(/ldlFriedewald\(/.test(page) && /parseNumberField\(totalText\)/.test(page), 'halaman tidak memakai mesin domain')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/hasil\.invalid\.length > 0/.test(page), 'penolakan tidak ditampilkan')
console.log('ldl-friedewald: 120 mg/dL, pita di ambang, TG 399↔400, LDL ≤ 0 tidak sahih, HDL ≥ TC ditolak, kosong/di luar rentang gagal tertutup')
