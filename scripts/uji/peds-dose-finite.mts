// Dosis anak: hasil yang bukan angka hingga TIDAK boleh dikembalikan sebagai `ok: true`.
// Dulu dosis/konsentrasi yang hanya diperiksa "hingga dan > 0" dapat meluap (mis. 200 kg × 1e308 mg/kg/hari, atau konsentrasi 1e-320 mg/mL)
// sehingga mesin mengembalikan ok:true dengan Infinity/NaN yang tampil sebagai "Infinity mg". Mesin tetap tidak menetapkan dosis maksimum
// (itu milik formularium): hanya menolak hasil yang tidak dapat direpresentasikan.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pedsDose } from '../../src/domains/clinical-calculators/index.ts'

const finite = (r: ReturnType<typeof pedsDose>) => r.ok && [r.data.totalDailyMg, r.data.perDoseMg, r.data.perDoseMl].every(Number.isFinite)
const NOT_FINITE = { ok: false, reason: 'Result is not a finite number — check the dose and concentration' }

// Kasus nyata yang dulu lolos sebagai ok:true dengan angka tak hingga.
for (const [w, d, f, c] of [[200, 1e308, 1, 1], [70, 5, 3, 1e-320], [70, 1e300, 1, 1e-300], [200, 1e308, 24, 1e-308], [10, 1e307, 1, 1e-10]] as const) {
  const r = pedsDose(w, d, f, c)
  assert.deepEqual(r, NOT_FINITE, `pedsDose(${w}, ${d}, ${f}, ${c}) must refuse a non-finite result`)
}
// Kasus biasa dan ekstrem yang sah tetap dihitung, dan semua keluarannya hingga.
for (const [w, d, f, c] of [[10, 20, 3, 40], [0.3, 1, 1, 100], [200, 5000, 24, 0.001], [15, 10, 3, 25], [70, 1e6, 1, 1e-3]] as const) assert.ok(finite(pedsDose(w, d, f, c)), `pedsDose(${w}, ${d}, ${f}, ${c}) stays valid`)
const ok = pedsDose(10, 20, 3, 40); assert.ok(ok.ok); assert.equal(ok.data.totalDailyMg, 200); assert.equal(ok.data.perDoseMg, 200 / 3); assert.equal(ok.data.perDoseMl, 200 / 3 / 40)
// Alasan masukan yang sudah ada tidak berubah.
assert.deepEqual(pedsDose(15, 0, 3, 25), { ok: false, reason: 'Dose must be a number above 0 mg/kg/day' }); assert.deepEqual(pedsDose(15, 10, 3, 0), { ok: false, reason: 'Concentration must be a number above 0 mg/mL' })
// Regresi sumber: pemeriksaan keluaran ada di mesin.
const src = readFileSync(new URL('../../src/domains/clinical-calculators/engine/pedsDose.ts', import.meta.url), 'utf8')
assert.ok(/Number\.isFinite/.test(src.slice(src.indexOf('const totalDailyMg'))), 'the engine checks its outputs are finite')
console.log('peds-dose-finite: overflowing doses/concentrations are refused, valid ones still compute with finite outputs; passed')
