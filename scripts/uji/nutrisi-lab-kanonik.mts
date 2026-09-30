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
})
assert.deepEqual(ok.written.sort(), ['glucose', 'ldl', 'potassium', 'sodium', 'totalCholesterol', 'vitD'].sort())
assert.deepEqual(ok.skipped, ['folate'], 'folate stays Nutrition-local until catalogued')
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
assert.equal(balik.folate, undefined)

// Negatif: bad date / non-positive / unknown key → no write.
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('kemarin', { glucose: 90 }).written, [])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { glucose: 0 }).written, [])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { glucose: -1 }).skipped, ['glucose'])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { folate: 12 }).skipped, ['folate'])
assert.deepEqual(nilaiNutrisiDariLabKanonic('not-a-date'), {})

// Mapping covers core lipid + PhenoAge-adjacent Nutrition keys.
for (const wajib of ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'albumin', 'crp', 'creatinine', 'potassium', 'sodium']) {
  assert.ok(KUNCI_NUTRISI_KE_JENIS_LAB[wajib], `${wajib} missing from Nutrition→canonical map`)
}

const page = readFileSync('src/pages/Nutrition.tsx', 'utf8')
assert.match(page, /proyeksikanNilaiNutrisiKeLabKanonic\(editDate, vals\)/)
assert.match(page, /proyeksikanNilaiNutrisiKeLabKanonic\(nl\.date, nl\.values\)/)
assert.match(page, /gabungLabNutrisiDenganKanonic/)
assert.match(page, /account lab log/)
assert.match(page, /not a diagnosis/)

// Hydration: canonical-only draw date surfaces in Nutrition camelCase keys.
store['pmd_lab_v1'] = JSON.stringify({
  gdp: [{ id: 'g1', tanggal: '2026-09-20', nilai: 95 }],
  chol: [{ id: 'c1', tanggal: '2026-09-20', nilai: 185 }],
})
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
