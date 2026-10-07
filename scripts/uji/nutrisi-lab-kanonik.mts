import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  KUNCI_NUTRISI_KE_JENIS_LAB,
  proyeksikanNilaiNutrisiKeLabKanonic,
  nilaiNutrisiDariLabKanonic,
  gabungLabNutrisiDenganKanonic,
  nilaiLabPadaTanggal,
  ambilLab,
} from '../../src/lib/lab.ts'

const store: Record<string, string> = {}
const g = globalThis as { localStorage?: Storage; window?: { dispatchEvent: (e: Event) => boolean } }
g.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v) },
  removeItem: (k) => { delete store[k] },
  clear: () => { for (const key of Object.keys(store)) delete store[key] },
  key: () => null,
  length: 0,
} as Storage
g.window = { dispatchEvent: () => true }

// Positif: known Nutrition keys land in the synced lab log under JENIS_LAB ids.
const ok = proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', {
  glucose: 98,
  totalCholesterol: 190,
  ldl: 110,
  vitD: 32,
  potassium: 4.2,
  sodium: 140,
  folate: 12,
  calcium: 9.4,
  phosphorus: 3.2,
  bilirubin: 0.8,
  homocysteine: 9,
  cortisol: 12,
  inr: 1,
  bun: 14,
  ggt: 28,
  systolic: 120,
})
assert.deepEqual(ok.written.sort(), ['bilirubin', 'bun', 'calcium', 'cortisol', 'folate', 'ggt', 'glucose', 'homocysteine', 'inr', 'ldl', 'phosphorus', 'potassium', 'sodium', 'totalCholesterol', 'vitD'].sort())
assert.deepEqual(ok.skipped, ['systolic'], 'blood pressure stays a vital, not a serum lab')
assert.equal(nilaiLabPadaTanggal('gdp', '2026-09-28'), 98)
assert.equal(nilaiLabPadaTanggal('chol', '2026-09-28'), 190)
assert.equal(nilaiLabPadaTanggal('vitd', '2026-09-28'), 32)
assert.equal(nilaiLabPadaTanggal('kalium', '2026-09-28'), 4.2)
assert.equal(nilaiLabPadaTanggal('natrium', '2026-09-28'), 140)
assert.equal(ambilLab().gdp?.length, 1)

const balik = nilaiNutrisiDariLabKanonic('2026-09-28')
assert.equal(balik.glucose, 98)
assert.equal(balik.totalCholesterol, 190)
assert.equal(balik.vitD, 32)
assert.equal(balik.potassium, 4.2)
assert.equal(balik.sodium, 140)
assert.equal(balik.folate, 12)
assert.equal(balik.calcium, 9.4)
assert.equal(balik.bilirubin, 0.8)
assert.equal(balik.homocysteine, 9)
assert.equal(balik.cortisol, 12)
assert.equal(balik.inr, 1)
assert.equal(balik.bun, 14)
assert.equal(balik.ggt, 28)
assert.equal(nilaiLabPadaTanggal('bun', '2026-09-28'), 14)
assert.equal(nilaiLabPadaTanggal('ggt', '2026-09-28'), 28)
assert.equal(nilaiLabPadaTanggal('folat', '2026-09-28'), 12)
assert.equal(nilaiLabPadaTanggal('kalsium', '2026-09-28'), 9.4)

// Negatif: bad date / non-positive / unknown key → no write.
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('kemarin', { glucose: 90 }).written, [])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { glucose: 0 }).written, [])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { glucose: -1 }).skipped, ['glucose'])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { systolic: 120 }).skipped, ['systolic'])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { bun: 0 }).skipped, ['bun'])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { inr: 0, cortisol: Number.NaN }).skipped.sort(), ['cortisol', 'inr'])
{
  const sebelum = ambilLab().trombosit?.length ?? 0
  const skala = proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { platelet: 220000, wbc: 6800, hemoglobin: 14 })
  assert.deepEqual(skala.skipped.sort(), ['platelet', 'wbc'])
  assert.deepEqual(skala.written, ['hemoglobin'])
  assert.equal(ambilLab().trombosit?.length ?? 0, sebelum, 'per-µL platelet count must not be stored as ×10⁹/L')
  assert.equal(ambilLab().wbc?.some((b) => b.nilai === 6800) ?? false, false)
  const kecil = proyeksikanNilaiNutrisiKeLabKanonic('2026-09-27', { platelet: 220, wbc: 6.8 })
  assert.deepEqual(kecil.written.sort(), ['platelet', 'wbc'])
  assert.equal(nilaiLabPadaTanggal('trombosit', '2026-09-27'), 220)
  assert.equal(nilaiLabPadaTanggal('wbc', '2026-09-27'), 6.8)
}
assert.deepEqual(nilaiNutrisiDariLabKanonic('not-a-date'), {})

// Mapping covers core lipid + PhenoAge-adjacent Nutrition keys.
for (const wajib of ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'albumin', 'crp', 'creatinine', 'potassium', 'sodium']) {
  assert.ok(KUNCI_NUTRISI_KE_JENIS_LAB[wajib], `${wajib} missing from Nutrition→canonical map`)
}

const page = readFileSync('src/pages/bodyhub/Nutrition.tsx', 'utf8')
assert.match(page, /proyeksikanNilaiNutrisiKeLabKanonic\(editDate, vals\)/)
assert.match(page, /proyeksikanNilaiNutrisiKeLabKanonic\(nl\.date, nl\.values\)/)
assert.match(page, /gabungLabNutrisiDenganKanonic/)
assert.match(page, /account lab log/)
assert.match(page, /not a diagnosis/)

// Hydration: canonical-only draw date surfaces in Nutrition camelCase keys.
// Hydrate the active anonymous envelope after the preceding writes; the
// unowned legacy key is now preserved rather than overriding scoped data.
store['pmd_lab_scope_v1:anonymous'] = JSON.stringify({ log: {
  gdp: [{ id: 'g1', tanggal: '2026-09-20', nilai: 95 }],
  chol: [{ id: 'c1', tanggal: '2026-09-20', nilai: 185 }],
} })
assert.equal(nilaiNutrisiDariLabKanonic('2026-09-20').glucose, 95)
assert.equal(nilaiNutrisiDariLabKanonic('2026-09-20').totalCholesterol, 185)
{
  const gabung = gabungLabNutrisiDenganKanonic([{ date: '2026-09-20', values: { folate: 11 } }])
  assert.equal(gabung.length, 1)
  assert.equal(gabung[0].values.glucose, 95, 'canonical glucose fills the Nutrition row')
  assert.equal(gabung[0].values.folate, 11, 'local-only key preserved')
  const konflik = gabungLabNutrisiDenganKanonic([{ date: '2026-09-20', values: { glucose: 120, folate: 11 } }])
  assert.equal(konflik[0].values.glucose, 95, 'account lab log wins over a stale Nutrition weekly value')
  assert.equal(konflik[0].values.folate, 11)
  const besok = gabungLabNutrisiDenganKanonic([{ date: '2026-09-21', values: { folate: 8 } }])
  assert.equal(besok.find((r) => r.date === '2026-09-21')?.values.glucose, undefined, 'an older draw must not fill a later Nutrition row')
  assert.equal(gabungLabNutrisiDenganKanonic([{ date: 'bad', values: { glucose: 1 } }]).every((r) => r.date !== 'bad'), true)
  assert.deepEqual(gabungLabNutrisiDenganKanonic([{ date: 'not-a-date', values: {} }]).filter((r) => r.date === 'not-a-date'), [])
}

// OCR: sodium/potassium aliases; bare "K"/"Na" must not steal unrelated lines without numbers.
{
  const { uraikanLembarLab } = await import('../../src/lib/imporLab.ts')
  const el = Object.fromEntries(uraikanLembarLab(`
Sodium  138  mEq/L  135 - 145
Kalium  4.1  mEq/L  3.5 - 5.0
Potassium 4.0 mEq/L 3.5-5.0
`).map((x) => [x.jenisId, x]))
  assert.equal(el.natrium?.nilai, 138)
  assert.equal(el.natrium?.masalah, null)
  assert.equal(el.kalium?.nilai, 4.1)
  assert.equal(el.kalium?.masalah, null)
  assert.deepEqual(uraikanLembarLab('Sodium within normal\nPotassium adequate'), [])
}

console.log('nutrisi-lab-kanonik: Nutrition weekly tracker writes known analytes into synced lab log')
