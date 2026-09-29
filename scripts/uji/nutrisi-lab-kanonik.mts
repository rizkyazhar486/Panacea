import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  KUNCI_NUTRISI_KE_JENIS_LAB,
  proyeksikanNilaiNutrisiKeLabKanonic,
  nilaiNutrisiDariLabKanonic,
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
})
assert.deepEqual(ok.written.sort(), ['glucose', 'ldl', 'totalCholesterol', 'vitD'].sort())
assert.deepEqual(ok.skipped, ['potassium'], 'electrolytes without JENIS_LAB stay Nutrition-local')
assert.equal(nilaiLabPadaTanggal('gdp', '2026-09-28'), 98)
assert.equal(nilaiLabPadaTanggal('chol', '2026-09-28'), 190)
assert.equal(nilaiLabPadaTanggal('vitd', '2026-09-28'), 32)
assert.equal(ambilLab().gdp?.length, 1)

const balik = nilaiNutrisiDariLabKanonic('2026-09-28')
assert.equal(balik.glucose, 98)
assert.equal(balik.totalCholesterol, 190)
assert.equal(balik.vitD, 32)
assert.equal(balik.potassium, undefined)

// Negatif: bad date / non-positive / unknown key → no write.
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('kemarin', { glucose: 90 }).written, [])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { glucose: 0 }).written, [])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { glucose: -1 }).skipped, ['glucose'])
assert.deepEqual(proyeksikanNilaiNutrisiKeLabKanonic('2026-09-28', { folate: 12 }).skipped, ['folate'])
assert.deepEqual(nilaiNutrisiDariLabKanonic('not-a-date'), {})

// Mapping covers core lipid + PhenoAge-adjacent Nutrition keys.
for (const wajib of ['glucose', 'hba1c', 'totalCholesterol', 'ldl', 'hdl', 'albumin', 'crp', 'creatinine']) {
  assert.ok(KUNCI_NUTRISI_KE_JENIS_LAB[wajib], `${wajib} missing from Nutrition→canonical map`)
}

const page = readFileSync('src/pages/Nutrition.tsx', 'utf8')
assert.match(page, /proyeksikanNilaiNutrisiKeLabKanonic\(editDate, vals\)/)
assert.match(page, /proyeksikanNilaiNutrisiKeLabKanonic\(nl\.date, nl\.values\)/)
assert.match(page, /account lab log/)

console.log('nutrisi-lab-kanonik: Nutrition weekly tracker writes known analytes into synced lab log')
