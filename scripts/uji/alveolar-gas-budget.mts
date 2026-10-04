import assert from 'node:assert/strict'
import { ALVEOLAR_GAS_DEFAULTS as baseline, ALVEOLAR_GAS_CONTROLS, ALVEOLAR_GAS_MODELS, evaluateAlveolarGasBudget, alveolarFrequencySweep } from '../../src/domains/physiology/engine/alveolarGasBudget.ts'
import { buktiUntuk } from '../../src/lib/ecmo/bukti.ts'

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`)
const before = structuredClone(baseline)
const normal = evaluateAlveolarGasBudget(baseline)
assert.equal(normal.ok, true)
if (!normal.ok) throw new Error(normal.detail)
// Golden ideal scenario: 500 mL VT, 150 mL VD, 12/min and 200 mL STPD CO₂/min.
// Formula source: Van Iterson et al. 2018, PMID 30103021, Appendix.
close(normal.minuteVentilationLMin, 6)
close(normal.deadSpaceVentilationLMin, 1.8)
close(normal.alveolarVentilationLMin, 4.2)
close(normal.alveolarCo2MmHg, 41.095238095238095)
close(normal.inspiredO2MmHg, 149.73)
close(normal.alveolarO2MmHg, 100.51845238095238)
close(normal.minuteVentilationLMin, normal.alveolarVentilationLMin + normal.deadSpaceVentilationLMin)
assert.equal(normal.truthClass, 'simulated')
assert.deepEqual(evaluateAlveolarGasBudget(baseline), normal)
assert.deepEqual(baseline, before)
for (const output of Object.values(normal.simulation.latest)) {
  assert.equal(output.truthClass, 'simulated')
  assert.equal(output.sigma, null)
  assert.equal(output.provenance.fidelity, 'educational-reference')
  assert.equal(output.provenance.validationClass, 'published-model-reproduction')
}
assert.deepEqual(normal.simulation.latest['respiratory.gas.co2'].provenance.parents, [normal.simulation.latest['respiratory.ventilation.alveolar'].provenance.id])
assert.deepEqual(normal.simulation.boundaries, {})
assert.equal(normal.simulation.timeSeconds, 0)

// Every range/type rejection differs in only one parameter; input is unchanged.
for (const control of ALVEOLAR_GAS_CONTROLS) {
  for (const value of [NaN, Infinity, -Infinity, control.min - 0.001, control.max + 0.001, '500', null, undefined]) {
    const input = { ...baseline, [control.key]: value } as unknown as typeof baseline
    const saved = structuredClone(input)
    const result = evaluateAlveolarGasBudget(input)
    assert.equal(result.ok, false, `${control.key}=${String(value)} must fail`)
    if (result.ok) throw new Error('unexpected success')
    assert.equal(result.reason, 'invalid-input')
    assert.deepEqual(input, saved)
  }
  for (const value of [control.min, control.max]) {
    const result = evaluateAlveolarGasBudget({ ...baseline, [control.key]: value })
    if (!result.ok) assert.notEqual(result.reason, 'invalid-input', `${control.key} boundary should pass scalar validation`)
  }
}
for (const deadSpaceMl of [500, 501]) {
  const result = evaluateAlveolarGasBudget({ ...baseline, deadSpaceMl })
  assert.deepEqual(result.ok ? null : result.reason, 'no-alveolar-ventilation')
}
const nearZero = evaluateAlveolarGasBudget({ ...baseline, deadSpaceMl: 499 })
assert.equal(nearZero.ok, false)
if (!nearZero.ok) assert.equal(nearZero.reason, 'unsupported-gas-budget')

const doubled = evaluateAlveolarGasBudget({ ...baseline, breathsPerMinute: 24 })
assert.equal(doubled.ok, true)
if (doubled.ok) {
  close(doubled.alveolarCo2MmHg, normal.alveolarCo2MmHg / 2)
  assert.ok(doubled.alveolarO2MmHg > normal.alveolarO2MmHg)
  assert.notEqual(doubled.simulation.latest['respiratory.gas.co2'].provenance.id, normal.simulation.latest['respiratory.gas.co2'].provenance.id)
}
// Same minute ventilation, greater dead-space fraction: deeper breathing clears more CO₂.
const shallow = evaluateAlveolarGasBudget({ ...baseline, tidalVolumeMl: 250, breathsPerMinute: 24 })
assert.equal(shallow.ok, true)
if (shallow.ok) {
  close(shallow.minuteVentilationLMin, normal.minuteVentilationLMin)
  assert.ok(shallow.alveolarVentilationLMin < normal.alveolarVentilationLMin)
  assert.ok(shallow.alveolarCo2MmHg > normal.alveolarCo2MmHg)
}
// FiO₂=1 corrected equation is independent of RQ; avoids simplified equation's high-FiO₂ error.
for (const respiratoryQuotient of [0.7, 0.8, 1]) {
  const result = evaluateAlveolarGasBudget({ ...baseline, inspiredOxygenFraction: 1, respiratoryQuotient })
  assert.equal(result.ok, true)
  if (result.ok) close(result.alveolarO2MmHg, 713 - normal.alveolarCo2MmHg)
}
const zeroDead = evaluateAlveolarGasBudget({ ...baseline, deadSpaceMl: 0 })
assert.equal(zeroDead.ok, true)
if (zeroDead.ok) close(zeroDead.alveolarVentilationLMin, zeroDead.minuteVentilationLMin)
const curve = alveolarFrequencySweep(baseline)
assert.equal(curve.length, 37)
assert.equal(curve[0].breathsPerMinute, 4)
assert.equal(curve[36].breathsPerMinute, 40)
close(curve[8].co2MmHg!, normal.alveolarCo2MmHg)
close(curve[8].o2MmHg!, normal.alveolarO2MmHg)
assert.ok(alveolarFrequencySweep({ ...baseline, deadSpaceMl: 499 }).every(point => point.co2MmHg === null && point.o2MmHg === null))
for (const model of ALVEOLAR_GAS_MODELS) {
  assert.equal(model.status, 'terverifikasi-teks-lengkap')
  assert.equal(buktiUntuk(model.id)[0].pmid, '30103021')
  assert.equal(buktiUntuk(model.id)[0].pmcid, 'PMC6269087')
}
console.log('Alveolar gas budget: units, mass balance, corrected FiO2, invalid/unsupported inputs, causal provenance and deterministic curve verified.')
