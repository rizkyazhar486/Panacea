import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { analyseTrade } from '../../src/lib/macroEconomics.ts'

// Nilai tangan: 264 − 237 = +27; 27/1400 = 1,9286% ; (264+237)/1400 = 35,786%.
const ok = analyseTrade({ exportsUsdBn: 264, importsUsdBn: 237, gdpUsdBn: 1400 })
assert.equal(ok.ok, true)
if (ok.ok) {
  assert.equal(ok.balanceUsdBn, 27)
  assert.ok(Math.abs(ok.balancePctGdp - 1.92857) < 1e-4)
  assert.ok(Math.abs(ok.tradeOpennessPct - 35.78571) < 1e-4)
  assert.match(ok.verdict, /^Surplus 1\.9%/)
}
// Defisit memakai nilai mutlak pada kalimat.
const def = analyseTrade({ exportsUsdBn: 100, importsUsdBn: 150, gdpUsdBn: 1000 })
assert.equal(def.ok && def.verdict.startsWith('Defisit 5.0%'), true)
// Batas: ekspor/impor 0 sah (negara tanpa dagang tetap angka nyata); GDP tepat 0 ditolak, GDP kecil positif sah.
assert.equal(analyseTrade({ exportsUsdBn: 0, importsUsdBn: 0, gdpUsdBn: 1 }).ok, true)
const g0 = analyseTrade({ exportsUsdBn: 264, importsUsdBn: 237, gdpUsdBn: 0 })
assert.deepEqual(g0, { ok: false, problems: ['GDP must be a number greater than 0'] })
assert.equal(analyseTrade({ exportsUsdBn: 1, importsUsdBn: 1, gdpUsdBn: 1e-9 }).ok, true)
// Negatif: kosong (NaN), Infinity, negatif — tiap aturan berpasangan dengan kasus yang hanya berbeda pada satu kolom.
assert.deepEqual(analyseTrade({ exportsUsdBn: NaN, importsUsdBn: 237, gdpUsdBn: 1400 }), { ok: false, problems: ['exports must be a number of 0 or more'] })
assert.deepEqual(analyseTrade({ exportsUsdBn: 264, importsUsdBn: -1, gdpUsdBn: 1400 }), { ok: false, problems: ['imports must be a number of 0 or more'] })
assert.deepEqual(analyseTrade({ exportsUsdBn: 264, importsUsdBn: 237, gdpUsdBn: Infinity }), { ok: false, problems: ['GDP must be a number greater than 0'] })
assert.deepEqual(analyseTrade({ exportsUsdBn: NaN, importsUsdBn: NaN, gdpUsdBn: NaN }).ok, false)
assert.equal((analyseTrade({ exportsUsdBn: NaN, importsUsdBn: NaN, gdpUsdBn: NaN }) as { problems: string[] }).problems.length, 3)
// Determinisme.
assert.deepEqual(analyseTrade({ exportsUsdBn: 5, importsUsdBn: 3, gdpUsdBn: 10 }), analyseTrade({ exportsUsdBn: 5, importsUsdBn: 3, gdpUsdBn: 10 }))
// Regresi halaman: kolom kosong tidak lagi dipaksa 0.
const hal = readFileSync(new URL('../../src/pages/MacroLab.tsx', import.meta.url), 'utf8')
assert.ok(!/exportsUsdBn: Number\(ex\) \|\| 0/.test(hal))
assert.ok(hal.includes('exportsUsdBn: parseNumberField(ex)'))
console.log('macro-trade: OK')
