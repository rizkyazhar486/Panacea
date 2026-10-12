import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { computeBmi } from '../../src/lib/anthro.ts'

// Rujukan tangan: 70 kg / (1.75 m)^2 = 22.857… → 22.9, batas Asia-Pasifik 18.5 / 23 / 25 / 30.
const ok = computeBmi(70, 175)
assert.deepEqual(ok, { bmi: 22.9, kesan: 'Normal', tone: 'normal', valid: true }, 'positif_bmi_normal')

// Batas berpasangan: 23.0 tepat = At risk, sedikit di bawah = Normal.
assert.equal(computeBmi(23, 100).kesan, 'At risk', 'batas_23_tepat')
assert.equal(computeBmi(22.9, 100).kesan, 'Normal', 'batas_di_bawah_23')

// Negatif: berat/tinggi hilang atau tak sah → valid:false, bukan angka tebakan yang tampak sebagai pengukuran.
const buruk: Array<[string, number, number]> = [
  ['berat_nol', 0, 175],
  ['tinggi_nol', 70, 0],
  ['berat_negatif', -70, 175],
  ['tinggi_negatif', 70, -175],
  ['berat_NaN', NaN, 175],
  ['tinggi_NaN', 70, NaN],
  ['berat_Infinity', Infinity, 175],
  ['tinggi_Infinity', 70, Infinity],
]
for (const [nama, w, h] of buruk) {
  const r = computeBmi(w, h)
  assert.equal(r.valid, false, `menolak_${nama}`)
  assert.equal(r.bmi, 0, `tanpa_angka_${nama}`)
  assert.equal(r.kesan, 'Cannot be calculated', `kesan_${nama}`)
}

// Determinisme.
assert.deepEqual(computeBmi(70, 175), computeBmi(70, 175))

// Regresi halaman: gauge tidak lagi mengubah BMI tak sah menjadi 0 yang digambar di skala.
const dash = readFileSync(new URL('../../src/pages/dashboard/Dashboard.tsx', import.meta.url), 'utf8')
assert.ok(dash.includes('anthro.valid ? anthro.bmi : null'), 'dashboard_memakai_valid')
assert.ok(!/Number\(anthro\.bmi\)\s*\|\|\s*0/.test(dash), 'dashboard_tanpa_fallback_nol')
assert.ok(dash.includes("bmi ?? '—'"), 'dashboard_menampilkan_strip')
const gc = readFileSync(new URL('../../src/components/GrowthChart.tsx', import.meta.url), 'utf8')
assert.ok(gc.includes("valid ? bmi : '—'"), 'growthchart_dewasa_strip')

console.log('bmi-tak-terhitung: ok')
