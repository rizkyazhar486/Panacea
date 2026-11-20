import assert from 'node:assert/strict'
import { NORMAL, SKENARIO, simulate } from '../../src/lib/bodySim.ts'
import { HR_MAX, HR_MIN } from '../../src/domains/body-exposure/engine/cardiacCycle.ts'
import {
  MOTION_SCENARIOS,
  bodyMotionFrame,
  planBodyMotion,
  planScenarioMotion,
  type BodyMotionPlan,
} from '../../src/domains/body-exposure/engine/body-motion/bodyMotion.ts'

const ok = (r: ReturnType<typeof planBodyMotion>): BodyMotionPlan => {
  assert.equal(r.ok, true, r.ok ? '' : r.reason)
  return r as BodyMotionPlan
}
const near = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`)

// ── Positif: angka berasal dari simulator, bukan ditulis tangan ─────────────────────────────────────────
const rest = ok(planScenarioMotion('normal'))
const restOut = simulate(NORMAL)
assert.equal(rest.truthClass, 'simulated')
assert.equal(rest.heartRateBpm, 70)
assert.equal(rest.respRatePerMin, 14)
near(rest.readout.cardiacOutputLMin, restOut.cardiacOutput)
near(rest.readout.mapMmHg, restOut.map)
near(rest.readout.sao2Pct, restOut.sao2)
near(rest.readout.urineMlPerHour, restOut.urineOutput)
near(rest.relative.cardiacOutput, 1)
near(rest.relative.ventilation, 1)
near(rest.relative.renalPerfusion, 1)

const ex = ok(planScenarioMotion('exercise'))
const exInput = SKENARIO.find((s) => s.key === 'exercise')!.input
const exOut = simulate(exInput)
near(ex.relative.cardiacOutput, exOut.cardiacOutput / restOut.cardiacOutput)
near(ex.relative.ventilation, (exInput.respRate * exInput.tidalVolume) / (14 * 500))
assert.ok(ex.relative.cardiacOutput > 1, 'olahraga menaikkan curah jantung relatif')

// Setiap skenario bawaan menghasilkan rencana gerak yang sah, dan daftar skenario sama dengan simulator.
assert.deepEqual(MOTION_SCENARIOS.map((s) => s.key), SKENARIO.map((s) => s.key))
for (const s of SKENARIO) ok(planScenarioMotion(s.key))

// ── Bingkai gerak ────────────────────────────────────────────────────────────────────────────────────
const f0 = bodyMotionFrame(rest, 0)!
assert.equal(f0.cardiacPhase, 'isovolumic_contraction', 't=0 adalah awal sistol')
near(f0.breath01, 0)
near(f0.lungGlow, 0, 1e-12) // awal inspirasi = akhir ekspirasi
near(f0.heartGlow, 0, 1e-12) // kontraksi isovolumik: ventrikel masih penuh
assert.equal(f0.vesselPulse, 0, 'tanpa ejeksi tidak ada denyut pembuluh')

// Satu periode denyut kemudian keadaannya sama (periodik), periode napas juga.
const period = 60 / 70
const fp = bodyMotionFrame(rest, period * 3)!
near(fp.heartGlow, f0.heartGlow, 1e-9)
const breathPeriod = 60 / 14
near(bodyMotionFrame(rest, breathPeriod * 2)!.breath01, 0, 1e-9)

// Paru mengembang maksimal di akhir inspirasi (1/3 napas) dan lebih besar saat olahraga (volume tidal lebih besar).
const peakRest = bodyMotionFrame(rest, breathPeriod / 3)!.lungGlow
const peakEx = bodyMotionFrame(ex, (60 / exInput.respRate) / 3)!.lungGlow
assert.ok(peakRest > 0, 'paru berpendar saat inspirasi')
assert.ok(peakEx > peakRest, 'volume tidal olahraga lebih besar → paru berpendar lebih terang')
// Jantung paling terang tepat di akhir ejeksi (ventrikel sudah mengosongkan seluruh isi sekuncup).
const endSystole = (() => { let best = 0; for (let i = 0; i < 400; i++) best = Math.max(best, bodyMotionFrame(rest, (i / 400) * period)!.heartGlow); return best })()
near(endSystole, 1, 0.01)

// Denyut pembuluh muncul selama ejeksi dan lebih kuat saat curah jantung lebih tinggi.
const sample = (plan: BodyMotionPlan) => {
  let maxPulse = 0
  for (let i = 0; i < 400; i++) maxPulse = Math.max(maxPulse, bodyMotionFrame(plan, (i / 400) * (60 / plan.heartRateBpm))!.vesselPulse)
  return maxPulse
}
assert.ok(sample(rest) > 0)
// Tinggi puncak sebanding curah jantung relatif (dibatasi 3× untuk tampilan): rasio puncak olahraga/istirahat = rasio curah jantung.
const expectedRatio = Math.min(ex.relative.cardiacOutput, 3) / Math.min(rest.relative.cardiacOutput, 3)
assert.ok(expectedRatio > 1.5, 'skenario olahraga harus menaikkan curah jantung secara bermakna')
assert.ok(Math.abs(sample(ex) / sample(rest) - expectedRatio) < 0.02 * expectedRatio, `denyut pembuluh tidak sebanding curah jantung: ${sample(ex) / sample(rest)} vs ${expectedRatio}`)
for (const s of SKENARIO) {
  const p = ok(planScenarioMotion(s.key))
  for (let i = 0; i < 50; i++) {
    const f = bodyMotionFrame(p, i * 0.137)!
    assert.ok(f.vesselPulse >= 0 && f.vesselPulse <= 1 && f.renalGlow >= 0 && f.renalGlow <= 1, `${s.key}: intensitas di luar 0..1`)
    assert.ok(f.heartGlow >= 0 && f.heartGlow <= 1 && f.lungGlow >= 0 && f.lungGlow <= 1, `${s.key}: cahaya di luar 0..1`)
    assert.equal(Object.keys(f).some((k) => /scale/i.test(k)), false, 'gerak tidak boleh mengubah skala geometri atlas')
  }
}
// Perdarahan menurunkan perfusi ginjal → ginjal lebih redup daripada istirahat.
const bleed = ok(planScenarioMotion('hemorrhage'))
assert.ok(bodyMotionFrame(bleed, 0)!.renalGlow < bodyMotionFrame(rest, 0)!.renalGlow)

// ── Negatif: gagal tertutup, tanpa gerak karangan ───────────────────────────────────────────────────
const reject = (patch: Record<string, unknown>, pesan: RegExp) => {
  const r = planBodyMotion({ ...NORMAL, ...patch } as typeof NORMAL, 'custom')
  assert.equal(r.ok, false)
  assert.match((r as { reason: string }).reason, pesan)
}
reject({ heartRate: Number.NaN }, /heartRate must be a finite number/)
reject({ heartRate: Infinity }, /heartRate must be a finite number/)
reject({ heartRate: '70' }, /heartRate must be a finite number/)
reject({ respRate: 0 }, /respiratory rate must be above 0/)
reject({ tidalVolume: -5 }, /tidalVolume cannot be negative/)
reject({ hemoglobin: undefined }, /hemoglobin must be a finite number/)
assert.equal(planBodyMotion(null as unknown as typeof NORMAL, 'x').ok, false)
const unknown = planScenarioMotion('not-a-scenario')
assert.equal(unknown.ok, false)
assert.match((unknown as { reason: string }).reason, /unknown scenario/)
assert.equal(bodyMotionFrame(rest, Number.NaN), null)
assert.equal(bodyMotionFrame(rest, Infinity), null)

// Berpasangan dengan negatif: hanya beda pada kondisi itu.
ok(planBodyMotion({ ...NORMAL, respRate: 1 }, 'custom'))
ok(planBodyMotion({ ...NORMAL, tidalVolume: 1 }, 'custom'))

// ── Batas denyut jantung (sama dengan siklus prosedural) ────────────────────────────────────────────
ok(planBodyMotion({ ...NORMAL, heartRate: HR_MIN }, 'b'))
ok(planBodyMotion({ ...NORMAL, heartRate: HR_MAX }, 'b'))
reject({ heartRate: HR_MIN - 1 }, /heart rate must be/)
reject({ heartRate: HR_MAX + 1 }, /heart rate must be/)

// ── Determinisme dan tanpa efek samping ─────────────────────────────────────────────────────────────
const before = JSON.stringify(NORMAL)
assert.deepEqual(planScenarioMotion('sepsis'), planScenarioMotion('sepsis'))
assert.deepEqual(bodyMotionFrame(ex, 1.234), bodyMotionFrame(ex, 1.234))
assert.equal(JSON.stringify(NORMAL), before, 'input bawaan simulator tidak boleh berubah')

console.log('body-motion: OK')
