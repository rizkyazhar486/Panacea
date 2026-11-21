// Draf suportif EMR: tanpa berat tercatat, tidak ada angka berbasis berat (dulu dihitung dari 60 kg karangan).
// Dengan berat: Holliday–Segar per pita (≤10, 10–20, >20 kg), 25–30 kkal/kg, ambang urin KDIGO 0,5 mL/kg/jam.
import assert from 'node:assert/strict'
import { supportiveDefaults } from '../../src/domains/clinical-operations/model/supportiveDefaults.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const HILANG = 'Weight not recorded — enter the patient’s weight to compute this.'

gagal('dewasa-70-kg-golden', () => {
  const d = supportiveDefaults(70) // 1500 + 20×50 = 2500 mL/24 jam
  assert.equal(d.balansCairan, 'Maintenance ±2500 mL/24 h (104 mL/h, Holliday-Segar); adjust for deficit/loss.')
  assert.equal(d.kebutuhanKalori, '1750–2100 kcal/day (25–30 kcal/kg).')
  assert.equal(d.urineOutput, '> 35.0 mL/h (0.5 mL/kg/h, KDIGO 2012).')
})
gagal('pita-holliday-segar-di-batasnya', () => {
  assert.match(supportiveDefaults(10).balansCairan, /^Maintenance ±1000 mL/, '10 kg: 100 mL/kg')
  assert.match(supportiveDefaults(11).balansCairan, /^Maintenance ±1050 mL/, '11 kg: 1000 + 50')
  assert.match(supportiveDefaults(20).balansCairan, /^Maintenance ±1500 mL/, '20 kg: 1000 + 50×10')
  assert.match(supportiveDefaults(21).balansCairan, /^Maintenance ±1520 mL/, '21 kg: 1500 + 20')
})
gagal('tanpa-berat-tidak-ada-angka-berbasis-berat', () => {
  for (const w of [0, -5, NaN, Infinity]) {
    const d = supportiveDefaults(w)
    assert.deepEqual([d.balansCairan, d.kebutuhanKalori, d.urineOutput], [HILANG, HILANG, HILANG], String(w))
    assert.doesNotMatch(JSON.stringify(d), /\d+ mL\/24 h|kcal\/day|mL\/h \(/, `${w}: tidak ada angka karangan`)
  }
})
gagal('pasangan-berat-terkecil-yang-sah', () => {
  assert.match(supportiveDefaults(0.5).balansCairan, /^Maintenance ±50 mL\/24 h/, '0,5 kg tetap dihitung')
  assert.equal(supportiveDefaults(0).balansCairan, HILANG)
})
console.log('supportive-defaults: OK')
