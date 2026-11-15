// Tekanan transpulmoner elastance-derived: nilai tepat, penolakan bernama, batas, determinisme, tanpa efek samping.
import assert from 'node:assert/strict'
import { transpulmonaryPressure as tp, TRANSPULMONARY_SOURCE, type TranspulmonaryInput } from '../../src/domains/physiology/engine/transpulmonaryPressure.ts'

const dasar: TranspulmonaryInput = { lungElastanceCmH2OPerL: 20, chestWallElastanceCmH2OPerL: 5, plateauAirwayPressureCmH2O: 25, peepCmH2O: 10 }
const dekat = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`)

// positif: nilai persis (E_rs 25, fraksi paru 0,8)
const r = tp(dasar); assert.equal(r.ok, true)
if (r.ok) {
  assert.equal(r.respiratoryElastanceCmH2OPerL, 25); dekat(r.lungFraction, 0.8)
  dekat(r.endInspiratoryTranspulmonaryCmH2O, 20)   // 25 × 0,8
  dekat(r.endExpiratoryTranspulmonaryCmH2O, 8)     // 10 × 0,8
  dekat(r.lungDrivingPressureCmH2O, 12)            // (25−10) × 0,8
  dekat(r.endInspiratoryPleuralCmH2O, 5)           // 25 × 0,2
  dekat(r.endInspiratoryTranspulmonaryCmH2O + r.endInspiratoryPleuralCmH2O, 25) // paru + dinding dada = jalan napas
  assert.equal(r.truthClass, 'derived'); assert.equal(r.source, TRANSPULMONARY_SOURCE); assert.equal(r.source.pmid, '28828360')
  assert.match(r.boundary, /not a measured/)
}
// berpasangan: hanya E_cw yang berbeda → fraksi paru berubah dan hasil mengikuti (aturan itulah yang bekerja)
const kaku = tp({ ...dasar, chestWallElastanceCmH2OPerL: 20 }); assert.equal(kaku.ok, true)
if (kaku.ok) dekat(kaku.endInspiratoryTranspulmonaryCmH2O, 12.5) // 25 × 20/40
// batas: PEEP = plateau → driving 0; PEEP 0 diterima (nol yang diberikan adalah nilai)
const sama = tp({ ...dasar, peepCmH2O: 25 }); assert.equal(sama.ok, true); if (sama.ok) assert.equal(sama.lungDrivingPressureCmH2O, 0)
const nolPeep = tp({ ...dasar, peepCmH2O: 0 }); assert.equal(nolPeep.ok, true); if (nolPeep.ok) assert.equal(nolPeep.endExpiratoryTranspulmonaryCmH2O, 0)
assert.equal(tp({ ...dasar, plateauAirwayPressureCmH2O: 100, peepCmH2O: 100 }).ok, true)  // tepat di batas atas
assert.equal(tp({ ...dasar, lungElastanceCmH2OPerL: 100 }).ok, true)
// negatif: ditolak dengan alasan, tanpa angka tebakan
const alasan = (x: unknown) => { const v = tp(x as TranspulmonaryInput); return v.ok ? 'ok' : v.reason }
assert.equal(alasan({ ...dasar, plateauAirwayPressureCmH2O: 9 }), 'plateau-below-peep')
assert.equal(alasan({ ...dasar, plateauAirwayPressureCmH2O: 9.999 }), 'plateau-below-peep')    // ±1 langkah di bawah PEEP
for (const buruk of [
  { ...dasar, lungElastanceCmH2OPerL: 0 }, { ...dasar, lungElastanceCmH2OPerL: -1 }, { ...dasar, lungElastanceCmH2OPerL: 100.001 },
  { ...dasar, chestWallElastanceCmH2OPerL: 0 }, { ...dasar, chestWallElastanceCmH2OPerL: Number.NaN }, { ...dasar, chestWallElastanceCmH2OPerL: Infinity },
  { ...dasar, peepCmH2O: -0.1 }, { ...dasar, peepCmH2O: 100.1 }, { ...dasar, plateauAirwayPressureCmH2O: 100.1, peepCmH2O: 10 },
  { ...dasar, peepCmH2O: '10' }, { ...dasar, lungElastanceCmH2OPerL: undefined }, { ...dasar, plateauAirwayPressureCmH2O: null },
  null, 'x',
]) assert.equal(alasan(buruk), 'invalid-input', JSON.stringify(buruk))
// tanpa efek samping dan deterministik
const salin = JSON.stringify(dasar); const a = tp(dasar); const b = tp(dasar)
assert.equal(JSON.stringify(dasar), salin, 'input tidak boleh diubah'); assert.deepEqual(a, b)
console.log('transpulmonary-pressure: lulus')
