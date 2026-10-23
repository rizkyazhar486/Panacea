import assert from 'node:assert/strict'
import { EMPTY_SCENARIO, barFraction, evaluatePerfusionScenario, type ScenarioText } from '../../src/domains/body-exposure/engine/perfusionScenario.ts'

// Sintetis: menguji perhitungan, bukan nilai bawaan pasien.
const full: ScenarioText = { hr: '80', edv: '120', esv: '50', svr: '1200', cvp: '6', icp: '10' }
const ok = (t: ScenarioText) => { const r = evaluatePerfusionScenario(t); assert.equal(r.status, 'ok', JSON.stringify(r)); return (r as Extract<typeof r, { status: 'ok' }>).result }

// 1. Tidak ada nilai bawaan: kosong -> incomplete, menyebut semua kolom.
const empty = evaluatePerfusionScenario(EMPTY_SCENARIO)
assert.deepEqual(empty, { status: 'incomplete', missing: ['hr', 'edv', 'esv', 'svr', 'cvp', 'icp'] })
assert.deepEqual(evaluatePerfusionScenario({ ...full, svr: '  ' }), { status: 'incomplete', missing: ['svr'] })

// 2. Rantai dihitung dengan tangan dan sama dengan mesin runtime.
const r = ok(full)
assert.equal(r.strokeVolumeMl, 70)
assert.equal(r.cardiacOutputLMin, 5.6)
assert.ok(Math.abs(r.meanArterialPressureMmHg - 90) < 1e-12)
assert.ok(Math.abs(r.cerebralPerfusionPressureMmHg - 80) < 1e-12)
assert.equal(r.gradient, 'arterial-to-intracranial')

// 3. Invarian: ICP hanya menggeser CPP; SVR menggeser MAP dan CPP; ICP mencapai MAP -> tidak positif.
assert.ok(Math.abs(ok({ ...full, icp: '25' }).cerebralPerfusionPressureMmHg - 65) < 1e-12)
assert.equal(ok({ ...full, icp: '25' }).meanArterialPressureMmHg, r.meanArterialPressureMmHg)
assert.ok(Math.abs(ok({ ...full, svr: '1400' }).meanArterialPressureMmHg - (r.meanArterialPressureMmHg + 14)) < 1e-12)
const flat = ok({ ...full, icp: '90' })
assert.equal(flat.cerebralPerfusionPressureMmHg, 0)
assert.equal(flat.gradient, 'non-positive')

// 4. Masukan mustahil ditolak dengan alasan, tidak menghasilkan angka.
for (const [patch, reason] of [
  [{ hr: '0' }, /Heart rate/], [{ hr: '-5' }, /Heart rate/], [{ edv: '0' }, /End-diastolic/], [{ esv: '121' }, /End-systolic/], [{ esv: '-1' }, /End-systolic/],
  [{ svr: '0' }, /resistance/], [{ icp: '-1' }, /Intracranial/], [{ hr: 'abc' }, /Heart rate is not a valid number/], [{ cvp: 'Infinity' }, /Central venous/], [{ cvp: '-5000' }, /positive finite/],
] as const) {
  const res = evaluatePerfusionScenario({ ...full, ...patch })
  assert.equal(res.status, 'invalid', JSON.stringify(patch))
  assert.match((res as { reason: string }).reason, reason, JSON.stringify(patch))
}

// 5. Skala tampilan membatasi batang pada 0..1 dan menolak angka tak berarti.
assert.equal(barFraction(5.6, 15), 5.6 / 15)
assert.equal(barFraction(500, 200), 1)
assert.equal(barFraction(-3, 200), 0)
assert.equal(barFraction(Number.NaN, 200), 0)
assert.equal(barFraction(10, 0), 0)

console.log('perfusion scenario: blank start, hand-checked CO/MAP/CPP chain, invariants and rejection reasons locked')
