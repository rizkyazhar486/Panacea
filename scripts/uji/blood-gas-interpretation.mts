import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { interpretAbg } from '../../src/domains/clinical-calculators/index.ts'

const base = { ph: 7.32, paco2: 30, hco3: 15, na: 140, cl: 104, albumin: 4.0 }
const run = (o: Partial<typeof base>) => interpretAbg({ ...base, ...o })
const data = (o: Partial<typeof base>) => { const r = run(o); assert.ok(r.ok, JSON.stringify(o)); return r.ok ? r.data : (undefined as never) }

// Valor tangan untuk masukan bawaan halaman: Winter 1.5×15+8 = 30.5 (28.5–32.5); AG = 140 − (104+15) = 21; delta = 9/9 = 1.00.
assert.deepEqual(run({}), { ok: true, data: {
  phStatus: 'Acidemia', primary: 'Metabolic Acidosis',
  compensationNote: "Respiratory compensation is appropriate (Winter's estimate 28.5-32.5).",
  correctedAnionGap: 21, anionGapHigh: true,
  deltaRatioNote: 'Delta ratio 1.00 (0.4-2) — consistent with pure high-gap acidosis.',
} })
// Gangguan primer: satu kasus per cabang keputusan.
for (const [o, primary] of [
  [{ ph: 7.25, paco2: 60, hco3: 24 }, 'Respiratory Acidosis'],
  [{ ph: 7.30, paco2: 40, hco3: 24 }, 'Mixed/unclear acidemia'],
  [{ ph: 7.50, paco2: 45, hco3: 32 }, 'Metabolic Alkalosis'],
  [{ ph: 7.50, paco2: 28, hco3: 24 }, 'Respiratory Alkalosis'],
  [{ ph: 7.50, paco2: 40, hco3: 24 }, 'Mixed/unclear alkalemia'],
  [{ ph: 7.40, paco2: 40, hco3: 24 }, 'Normal'],
  [{ ph: 7.40, paco2: 50, hco3: 24 }, 'Normal pH but abnormal PaCO2/HCO3 — possible mixed disorder (full compensation)'],
] as const) assert.equal(data(o).primary, primary, JSON.stringify(o))
// Batas pH: 7.35 dan 7.45 sendiri normal; satu langkah di luar berubah status (pasangan di tiap sisi).
for (const [ph, st] of [[7.34, 'Acidemia'], [7.35, 'Normal pH'], [7.45, 'Normal pH'], [7.46, 'Alkalemia']] as const) assert.equal(data({ ph }).phStatus, st, `pH ${ph}`)
// Batas HCO3 untuk asidosis metabolik (21.99 vs 22) dan PaCO2 untuk asidosis respiratorik (45 vs 45.01).
assert.equal(data({ ph: 7.3, hco3: 21.99, paco2: 30 }).primary, 'Metabolic Acidosis')
assert.equal(data({ ph: 7.3, hco3: 22, paco2: 45 }).primary, 'Mixed/unclear acidemia')
assert.equal(data({ ph: 7.3, hco3: 22, paco2: 45.01 }).primary, 'Respiratory Acidosis')
// Kompensasi Winter: bawah, tepat di batas, atas.
assert.match(data({ paco2: 20 }).compensationNote, /lower than the Winter's formula estimate \(28\.5-32\.5\) — suspect concomitant respiratory alkalosis/)
assert.match(data({ paco2: 40 }).compensationNote, /higher than the Winter's formula estimate \(28\.5-32\.5\) — suspect concomitant respiratory acidosis/)
assert.match(data({ paco2: 28.5 }).compensationNote, /appropriate/)
assert.match(data({ paco2: 32.5 }).compensationNote, /appropriate/)
assert.equal(data({ ph: 7.5, paco2: 28, hco3: 24 }).compensationNote, '', 'tanpa catatan Winter di luar asidosis metabolik')
// Anion gap dan koreksi albumin; delta ratio pada tiga cabangnya.
assert.equal(data({ albumin: 2.0, cl: 104, hco3: 24 }).correctedAnionGap, 12 + 2.5 * 2)
assert.equal(data({ albumin: 2.0, cl: 104, hco3: 24 }).anionGapHigh, true, 'albumin rendah mengangkat gap ke High')
assert.equal(data({ hco3: 24, cl: 104 }).anionGapHigh, false)
assert.match(data({ hco3: 10, cl: 115, paco2: 23 }).deltaRatioNote, /^Delta ratio 0\.21 \(<0\.4\) — suspect concomitant non-gap/)
assert.match(data({ hco3: 20, cl: 95, paco2: 38 }).deltaRatioNote, /^Delta ratio 3\.25 \(>2\) — suspect concomitant metabolic alkalosis/)
// Ambang delta ratio tepat di batas (HCO3 14 → penyebut 10, jadi delta = (AG − 12)/10 persis): 0.4 termasuk 'murni', 0.3 di bawah.
const dr = (cl: number) => data({ ph: 7.2, hco3: 14, cl, paco2: 28 }).deltaRatioNote
assert.match(dr(111), /^Delta ratio 0\.30 \(<0\.4\)/)
assert.match(dr(110), /^Delta ratio 0\.40 \(0\.4-2\) — consistent with pure high-gap/)
assert.match(dr(94), /^Delta ratio 2\.00 \(0\.4-2\) — consistent with pure high-gap/)
assert.match(dr(93), /^Delta ratio 2\.10 \(>2\)/)
assert.equal(data({ ph: 7.5, hco3: 24, paco2: 40 }).deltaRatioNote, '', 'delta ratio hanya untuk asidosis metabolik gap tinggi')

// Regresi: keluaran identik dengan logika halaman lama pada grid masukan sah (oracle = logika lama, ditulis ulang di sini).
function lama(ph: number, paco2: number, hco3: number, na: number, cl: number, albumin: number) {
  const ac = ph < 7.35, al = ph > 7.45
  let primary: string
  if (ac) primary = hco3 < 22 ? 'Metabolic Acidosis' : paco2 > 45 ? 'Respiratory Acidosis' : 'Mixed/unclear acidemia'
  else if (al) primary = hco3 > 26 ? 'Metabolic Alkalosis' : paco2 < 35 ? 'Respiratory Alkalosis' : 'Mixed/unclear alkalemia'
  else primary = (paco2 > 45 || paco2 < 35 || hco3 > 26 || hco3 < 22) ? 'x' : 'Normal'
  const ag = na - (cl + hco3) + 2.5 * (4 - albumin)
  return { primary: primary === 'x' ? 'Normal pH but abnormal PaCO2/HCO3 — possible mixed disorder (full compensation)' : primary, ag }
}
let n = 0
for (const ph of [6.9, 7.2, 7.34, 7.35, 7.4, 7.45, 7.46, 7.6]) for (const paco2 of [10, 28, 35, 45, 46, 80])
  for (const hco3 of [5, 15, 21.9, 22, 26, 26.1, 40]) for (const albumin of [1, 4, 5]) {
    const o = lama(ph, paco2, hco3, 140, 100, albumin)
    const r = interpretAbg({ ph, paco2, hco3, na: 140, cl: 100, albumin }); assert.ok(r.ok)
    if (r.ok) { assert.equal(r.data.primary, o.primary); assert.equal(r.data.correctedAnionGap, o.ag) }
    n++
  }
assert.equal(n, 8 * 6 * 7 * 3)

// Penolakan: tiap kolom di batas diterima, satu langkah di luar ditolak dengan nama kolom; hanya kolom itu yang berubah.
const RANGE = { ph: [6.5, 8.0, 'pH must be 6.5–8'], paco2: [5, 150, 'PaCO2 must be 5–150 mmHg'], hco3: [1, 60, 'HCO3 must be 1–60 mEq/L'],
  na: [90, 200, 'Na must be 90–200 mEq/L'], cl: [50, 160, 'Cl must be 50–160 mEq/L'], albumin: [0.5, 7, 'Albumin must be 0.5–7 g/dL'] } as const
for (const [k, [lo, hi, msg]] of Object.entries(RANGE)) {
  const key = k as keyof typeof base
  assert.equal(run({ [key]: lo }).ok, true, `${k}=${lo}`); assert.equal(run({ [key]: hi }).ok, true, `${k}=${hi}`)
  for (const bad of [lo - 0.01, hi + 0.01, 0, -1, NaN, Infinity, -Infinity, +'']) assert.deepEqual(run({ [key]: bad }), { ok: false, reason: msg }, `${k}=${bad}`)
  for (const salah of [undefined, null, '7.3'] as unknown as number[]) assert.equal(run({ [key]: salah }).ok, false, `${k}=${String(salah)}`)
}
assert.equal('data' in (run({ ph: 0 }) as object), false)
// Jebakan nyata: pH kosong → 0 → halaman lama menampilkan "Acidemia" dan gangguan primer.
assert.equal(lama(+'', 30, 15, 140, 104, 4).primary, 'Metabolic Acidosis')
assert.deepEqual(run({ ph: +'' }), { ok: false, reason: 'pH must be 6.5–8' })
assert.deepEqual(run({}), run({}), 'deterministik')

// Halaman memakai fungsi kanonik, tanpa menghitung ulang.
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /interpretAbg\(\{ ph, paco2, hco3, na, cl, albumin \}\)/)
assert.match(halaman, /abg\.ok \?/)
assert.match(halaman, /\{abg\.reason\}/)
assert.doesNotMatch(halaman, /1\.5 \* hco3 \+ 8/, 'rumus Winter tidak boleh disalin ke halaman')
assert.doesNotMatch(halaman, /2\.5 \* \(4 - albumin\)/, 'koreksi albumin tidak boleh disalin ke halaman')
console.log('blood-gas-interpretation: golden branches, boundaries, behaviour-preserving regression grid, fail-closed ranges by field')
