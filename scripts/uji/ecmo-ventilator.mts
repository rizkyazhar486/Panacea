// Mekanika ventilator VV (lung rest): VT = Crs·ΔP, Pplat = PEEP + ΔP, VA → PaCO2 mesin yang sama.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mekanikaVentilator, VENTILATOR_ISTIRAHAT as R } from '../../src/lib/ecmo/ventilator.ts'
import { keadaanCO2 } from '../../src/lib/ecmo/mesin.ts'
import { MODEL, buktiUntuk } from '../../src/lib/ecmo/bukti.ts'

const r = mekanikaVentilator(R)
assert.equal(r.vtMl, 250, 'VT = Crs·ΔP'); assert.equal(r.pplat, 20, 'Pplat = PEEP + ΔP'); assert.ok(Math.abs(r.vaLMenit - 1) < 1e-9, 'VA = (VT − VD)·RR')
assert.equal(r.istirahatElso.memenuhi, true, 'pengaturan istirahat default memenuhi ELSO')
// Ambang ELSO tercetak: Pplat ≤ 25 ATAU ΔP ≤ 15, dan PEEP ≥ 10.
assert.equal(mekanikaVentilator({ ...R, peep: 5 }).istirahatElso.memenuhi, false, 'PEEP < 10 gagal')
const tinggi = mekanikaVentilator({ ...R, peep: 14, pInspAtasPeep: 14 })
assert.equal(tinggi.istirahatElso.pplatOk, false); assert.equal(tinggi.istirahatElso.memenuhi, true, 'Pplat 28 tetap lolos bila ΔP ≤ 15 (aturan "atau" ELSO)')
assert.equal(mekanikaVentilator({ ...R, peep: 12, pInspAtasPeep: 18 }).istirahatElso.memenuhi, false, 'Pplat 30 dan ΔP 18 gagal')
// Kompliens turun (edema) pada tekanan tetap → VT turun (ELSO VV 2021).
assert.ok(mekanikaVentilator({ ...R, crs: 15 }).vtMl < r.vtMl, 'komplians turun menurunkan VT')
// VT ≤ ruang rugi → VA 0 (bukan negatif).
assert.equal(mekanikaVentilator({ ...R, crs: 10, pInspAtasPeep: 10 }).vaLMenit, 0)
assert.equal(mekanikaVentilator({ ...R, crs: 0 }).sah, false, 'komplians 0 ditolak')
// Kopling ke CO2: istirahat paru (VA ↓) menaikkan PaCO2; sweep lebih tinggi mengembalikannya.
const gas = { hb: 10, vo2: 320, shunt: 0.9, fio2: 0.3, hco3: 26, fdo2: 1, fungsiMembran: 1 }
const ultra = mekanikaVentilator({ ...R, crs: 15, pInspAtasPeep: 12 })
const a = keadaanCO2({ ...gas, va: r.vaLMenit, sweep: 3 }, 4), b = keadaanCO2({ ...gas, va: ultra.vaLMenit, sweep: 3 }, 4), c = keadaanCO2({ ...gas, va: ultra.vaLMenit, sweep: 8 }, 4)
assert.ok(b.paco2 > a.paco2 && c.paco2 < b.paco2, 'VA dari mekanika mengalir ke PaCO2; sweep mengompensasi')
assert.ok(MODEL['ventilator-istirahat'] && buktiUntuk('ventilator-istirahat').some((x) => x.pmid === '25693014'))
const ui = readFileSync('src/components/PanelEcmo.tsx', 'utf8')
assert.match(ui, /data-ecmo-ventilator/, 'panel harus menampilkan mekanika ventilator'); assert.match(ui, /mekanikaVentilator\(/)
console.log('ecmo-ventilator: lulus')
