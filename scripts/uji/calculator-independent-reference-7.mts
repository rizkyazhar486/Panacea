// C6 (bagian rekayasa), tahap 7: fungsi diskriminan Maddrey, skor stroke Siriraj, indeks Fletcher dan validasi usia Denver II.
// Acuan ditulis TERPISAH dari rumus terbitnya (aritmetika bilangan bulat per persepuluh/perseratus agar batas tepat tidak bergantung pada
// pembulatan float), diuji pada sampel acak berbenih, kisi batas lengkap, dan masukan bermusuhan. Bukti rekayasa, BUKAN tinjauan klinis;
// temuan dan konstanta tanpa sumber dicatat di docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md.
import assert from 'node:assert/strict'
import { close, hostileMatrix, mulberry32 } from './support/calculatorHarness.mts'
import {
  DENVER_AGE_MONTHS, MADDREY_RANGES, THRESHOLD_DB_HL, fletcherIndex, maddreyScore, sirirajStrokeScore, validateDenverAge,
} from '../../src/domains/clinical-calculators/index.ts'

// Tabel rentang ditulis ulang sebagai literal: mengubah tabel mesin tidak boleh ikut mengubah acuan.
assert.deepEqual(Object.fromEntries(Object.entries(MADDREY_RANGES).map(([k, v]) => [k, [v.min, v.max]])), { bilirubin: [0.1, 60], patientPt: [5, 150], controlPt: [5, 60] }, 'Maddrey ranges')
assert.deepEqual({ ...THRESHOLD_DB_HL }, { min: -10, max: 120 }, 'Fletcher range'); assert.deepEqual({ ...DENVER_AGE_MONTHS }, { min: 0, max: 72 }, 'Denver range')

const rand = mulberry32(20261021)
const between = (min: number, max: number) => min + (max - min) * rand()
const N = 400

// ── 1. Maddrey: DF = 4,6 × (PT pasien − PT kontrol) + bilirubin; berat bila DF ≥ 32 ──
for (let n = 0; n < N; n++) {
  const p = between(5, 150), c = between(5, 60), b = between(0.1, 60), r = maddreyScore({ patientPt: p, controlPt: c, bilirubin: b })
  const diff = p - c, df = 4.6 * diff + b
  close(r.ptDiff as number, diff, 'PT difference'); close(r.df as number, df, 'DF')
  if (Math.abs(df - 32) > 1e-6) assert.equal(r.severe, df >= 32, `severe for DF ${df}`)
}
// Batas persis dengan aritmetika bilangan bulat: DF×100 = 46 × selisih(persepuluh) + 10 × bilirubin(persepuluh). Setiap kombinasi persepuluh
// yang DF-nya TEPAT 32 harus "berat" (dulu 129 dari 793 kasus selisih positif dilaporkan "tidak berat" karena 31,999999999999996).
let tepat = 0
for (let c = 100; c <= 160; c++) for (let p = c + 1; p <= 1500; p++) {
  const b = (3200 - 46 * (p - c)) / 10
  if (!Number.isInteger(b) || b < 1 || b > 600) continue
  tepat++
  const r = maddreyScore({ patientPt: p / 10, controlPt: c / 10, bilirubin: b / 10 })
  assert.equal(r.severe, true, `DF is exactly 32 for PT ${p / 10}, control ${c / 10}, bilirubin ${b / 10} (computed ${r.df})`)
}
assert.equal(tepat, 793, 'the exact-boundary grid covers 793 combinations')
// Tepat di bawah 32 (satu persepuluh bilirubin kurang) tidak berat.
for (let c = 100; c <= 160; c += 7) for (let p = c + 1; p <= 1500; p += 13) {
  const b = (3200 - 46 * (p - c)) / 10 - 1
  if (!Number.isInteger(b) || b < 1 || b > 600) continue
  assert.equal(maddreyScore({ patientPt: p / 10, controlPt: c / 10, bilirubin: b / 10 }).severe, false, `DF 31.9 is not severe (PT ${p / 10}, control ${c / 10})`)
}
{
  const r = maddreyScore({ patientPt: 20, controlPt: 12, bilirubin: 10 }); close(r.df as number, 46.8, 'worked case: 4.6 × 8 + 10'); assert.deepEqual([r.ptDiff, r.severe], [8, true])
  assert.equal(maddreyScore({ patientPt: 15.5, controlPt: 10, bilirubin: 6.7 }).severe, true, 'DF exactly 32.0 is "severe" (rule is ≥ 32)')
  assert.equal(maddreyScore({ patientPt: 15.5, controlPt: 10, bilirubin: 6.6 }).severe, false)
  const kurang = maddreyScore({ patientPt: 10, controlPt: 12, bilirubin: 3 }); close(kurang.df as number, 4.6 * -2 + 3, 'a PT shorter than control is accepted (negative difference)'); assert.equal(kurang.severe, false)
  for (const k of ['bilirubin', 'patientPt', 'controlPt'] as const) {
    const dasar = { bilirubin: 5, patientPt: 18, controlPt: 12 }
    const kosong = maddreyScore({ ...dasar, [k]: Number.NaN }); assert.deepEqual([kosong.missing.length, kosong.invalid.length, kosong.df, kosong.ptDiff, kosong.severe], [1, 0, null, null, null], `${k} NaN is "missing"`)
    for (const bad of [Infinity, -1, 0, '5', null, undefined, {}, true]) { const r2 = maddreyScore({ ...dasar, [k]: bad } as never); assert.deepEqual([r2.invalid.length, r2.df, r2.severe], [1, null, null], `${k}=${String(bad)} is invalid`) }
  }
  hostileMatrix('maddreyScore', { bilirubin: 5, patientPt: 18, controlPt: 12 }, (i) => maddreyScore(i as never), (r) => (r as { df: unknown }).df !== null, ['bilirubin', 'patientPt', 'controlPt'], MADDREY_RANGES)
}

// ── 2. Siriraj: 2,5 × kesadaran + 2 × muntah + 2 × sakit kepala + 0,1 × TD diastolik − 3 × ateroma − 12; > +1 hemoragik, < −1 iskemik ──
// Acuan dalam persepuluh (bilangan bulat): skor × 10 = 25c + 20v + 20h + d − 30a − 120.
let sirirajKasus = 0
for (const c of [0, 1, 2]) for (const v of [0, 1]) for (const h of [0, 1]) for (const a of [0, 1]) for (let d2 = 40; d2 <= 400; d2++) {
  const d = d2 / 2, sepuluh = 25 * c + 20 * v + 20 * h + d - 30 * a - 120
  const tone = sepuluh > 10 ? 'critical' : sepuluh < -10 ? 'low' : 'high'
  const r = sirirajStrokeScore({ consciousness: c, vomiting: v, headache: h, diastolicMmHg: d, atheroma: a }) as any
  assert.equal(r.ok, true); sirirajKasus++
  assert.equal(r.data.tone, tone, `tone for c${c} v${v} h${h} d${d} a${a}`); close(r.data.score, sepuluh / 10, 'score'); close(r.data.rounded, Math.round(sepuluh * 10) / 100, 'rounded to 2 dp')
  assert.equal(r.data.label, tone === 'critical' ? 'Suggests HAEMORRHAGIC stroke' : tone === 'low' ? 'Suggests ISCHAEMIC stroke' : 'Indeterminate — imaging required', 'label agrees with tone')
}
assert.equal(sirirajKasus, 3 * 2 * 2 * 2 * 361, 'every valid combination with half-step diastolic pressures was checked')
{
  const s = (o: object) => (sirirajStrokeScore({ consciousness: 0, vomiting: 0, headache: 0, diastolicMmHg: 90, atheroma: 0, ...o }) as any)
  close(s({}).data.score, -3, 'worked case: all-zero features with diastolic 90 → 9 − 12 = −3'); assert.equal(s({}).data.tone, 'low')
  assert.equal(s({ consciousness: 2, vomiting: 1, headache: 1, diastolicMmHg: 110 }).data.tone, 'critical', 'coma, vomiting, headache, high diastolic → haemorrhagic')
  assert.equal(s({ diastolicMmHg: 110 }).data.tone, 'high', 'score exactly −1 is still indeterminate'); assert.equal(s({ diastolicMmHg: 130 }).data.tone, 'high', 'score exactly +1 is still indeterminate (rule is > +1)'); assert.equal(s({ diastolicMmHg: 131 }).data.tone, 'critical', 'score +1.1 is haemorrhagic')
  for (const [k, ok] of [['consciousness', [0, 1, 2]], ['vomiting', [0, 1]], ['headache', [0, 1]], ['atheroma', [0, 1]]] as const) {
    for (const bad of [-1, 3, 0.5, 1.5, Number.NaN, Infinity, '1', null, undefined, true, {}, [1]]) { if (ok.includes(bad as never)) continue; assert.equal(s({ [k]: bad }).ok, false, `${k}=${String(bad)} is refused`) }
  }
  for (const bad of [undefined, null, 5, 'x', [], true]) { let r: any; assert.doesNotThrow(() => { r = sirirajStrokeScore(bad as never) }); assert.equal(r.ok, false, `whole input ${String(bad)}`) }
  hostileMatrix('sirirajStrokeScore diastolic', { d: 90 }, (i) => sirirajStrokeScore({ consciousness: 0, vomiting: 0, headache: 0, diastolicMmHg: i.d as never, atheroma: 0 }), (r) => (r as { ok: boolean }).ok, ['d'], { d: { min: 20, max: 200 } })
}

// ── 3. Fletcher: rata-rata ambang 500/1000/2000 Hz (dasar) atau + 3000 Hz (lengkap); < 26 normal, < 41 ringan, < 56 sedang, < 71 sedang-berat, < 91 berat, selebihnya sangat berat ──
const refLabel = (x10: number, n: number) => (x10 < 260 * n ? 'Normal' : x10 < 410 * n ? 'Mild hearing loss' : x10 < 560 * n ? 'Moderate hearing loss' : x10 < 710 * n ? 'Moderately severe hearing loss' : x10 < 910 * n ? 'Severe hearing loss' : 'Profound (total) hearing loss')
for (let k = 0; k < N * 5; k++) {
  const t = [0, 1, 2, 3].map(() => Math.round(between(-10, 120) * 2) / 2), mode = rand() < 0.5 ? 'basic' : 'complete' as const
  const n = mode === 'basic' ? 3 : 4, sum10 = t.slice(0, n).reduce((s, x) => s + Math.round(x * 10), 0)
  const r = fletcherIndex(mode, t[0], t[1], t[2], t[3]) as any; assert.ok(r.ok)
  close(r.data.indexDb, sum10 / 10 / n, 'index dB'); assert.equal(r.data.label, refLabel(sum10, n), `label for ${mode} ${t}`)
  assert.equal(r.data.tone, r.data.label === 'Normal' ? 'normal' : /^(Mild|Moderate hearing)/.test(r.data.label) ? 'low' : 'critical', 'tone')
}
{
  // Batas persis: indeks 25 / 26 (dasar), 40 / 41, 55 / 56, 70 / 71, 90 / 91; lengkap memakai 3000 Hz.
  for (const [idx, label] of [[25, 'Normal'], [26, 'Mild hearing loss'], [40, 'Mild hearing loss'], [41, 'Moderate hearing loss'], [55, 'Moderate hearing loss'], [56, 'Moderately severe hearing loss'], [70, 'Moderately severe hearing loss'], [71, 'Severe hearing loss'], [90, 'Severe hearing loss'], [91, 'Profound (total) hearing loss'], [-10, 'Normal'], [120, 'Profound (total) hearing loss']] as const) {
    assert.equal((fletcherIndex('basic', idx, idx, idx, undefined) as any).data.label, label, `basic mean ${idx}`); assert.equal((fletcherIndex('complete', idx, idx, idx, idx) as any).data.label, label, `complete mean ${idx}`)
  }
  assert.equal((fletcherIndex('basic', 25, 25, 27, undefined) as any).data.label, 'Normal', 'a mean of 25.67 is below the 26 dB cut-off: Normal (REVIEWER ITEM: the engine does not round the mean before classifying)')
  assert.equal((fletcherIndex('basic', 10, 20, 30, 9999 as never) as any).ok, true, 'in basic mode 3000 Hz is ignored, even if nonsense')
  assert.equal((fletcherIndex('complete', 10, 20, 30, undefined) as any).ok, false, 'complete mode needs 3000 Hz'); assert.equal((fletcherIndex('complete', 10, 20, 30, Number.NaN) as any).ok, false)
  for (const m of ['', 'Basic', 'full', null, undefined, 1, 'toString']) assert.equal((fletcherIndex(m as never, 10, 20, 30, 40) as any).ok, false, `mode ${String(m)}`)
  const base = { a: 20, b: 30, c: 40 }
  hostileMatrix('fletcherIndex basic', base, (i) => fletcherIndex('basic', i.a, i.b, i.c, undefined), (r) => (r as { ok: boolean }).ok, ['a', 'b', 'c'], { a: { min: -10, max: 120 }, b: { min: -10, max: 120 }, c: { min: -10, max: 120 } })
  hostileMatrix('fletcherIndex complete 3000 Hz', { d: 50 }, (i) => fletcherIndex('complete', 20, 30, 40, i.d as never), (r) => (r as { ok: boolean }).ok, ['d'], { d: { min: -10, max: 120 } })
}

// ── 4. Denver II: usia 0–72 bulan ──
for (let m = 0; m <= 72; m += 0.5) assert.deepEqual(validateDenverAge(m), { ok: true, data: { ageMonths: m } }, `age ${m}`)
hostileMatrix('validateDenverAge', { m: 24 }, (i) => validateDenverAge(i.m as never), (r) => (r as { ok: boolean }).ok, ['m'], { m: { min: 0, max: 72 } })
console.log('calculator-independent-reference-7: Maddrey, Siriraj, Fletcher and Denver age validation match integer-arithmetic references (all exact-boundary grids, 400+ seeded cases, hostile inputs)')
