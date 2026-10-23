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
const gc = readFileSync(new URL('../../src/components/growth/GrowthChart.tsx', import.meta.url), 'utf8')
assert.ok(gc.includes("valid ? bmi : '—'"), 'growthchart_dewasa_strip')

console.log('bmi-tak-terhitung: ok')

// Representability and runtime type boundaries: finite inputs need finite positive output too.
for (const [w,h] of [[1e308,100],[70,1e-200],[70,1e308],[1e-300,100],[Number.MIN_VALUE,175]]) {
  assert.deepEqual(computeBmi(w,h), { bmi: 0, kesan: 'Cannot be calculated', tone: 'normal', valid: false })
}
for (const bad of ['', '175', null, undefined, {}, [], true]) {
  assert.equal(computeBmi(bad as number,175).valid,false)
  assert.equal(computeBmi(70,bad as number).valid,false)
}
for (const [threshold, below, label] of [[18.5,18.4,'Normal'],[23,22.9,'At risk'],[25,24.9,'Obesity I'],[30,29.9,'Obesity II']] as const) {
  assert.equal(computeBmi(threshold,100).kesan,label)
  assert.notEqual(computeBmi(below,100).kesan,label)
}
for (const weight of [20,40,70,100,140,200]) for (const height of [100,120,150,175,200,220]) {
  const r=computeBmi(weight,height)
  assert.equal(r.valid,true)
  assert.ok(Number.isFinite(r.bmi) && r.bmi>0)
  assert.equal(r.bmi,Math.round(weight/((height/100)**2)*10)/10)
}
