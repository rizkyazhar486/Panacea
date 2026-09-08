import assert from 'node:assert/strict'
import {
  RESPIRATORY_MODEL_BOUNDARY,
  RESPIRATORY_PHASES,
  RESPIRATORY_REFERENCE_INPUTS,
  RESPIRATORY_STRUCTURE_CHAIN,
  calculateRespiratoryMetrics,
  normalizeRespiratoryInputs,
  respiratoryPhaseById,
} from '../../src/lib/respiratoryAtlas'

const baseline = calculateRespiratoryMetrics(RESPIRATORY_REFERENCE_INPUTS)
assert.deepEqual(
  {
    respiratoryRate: baseline.respiratoryRate,
    tidalVolumeMl: baseline.tidalVolumeMl,
    deadSpaceMl: baseline.deadSpaceMl,
  },
  RESPIRATORY_REFERENCE_INPUTS,
  'Reference inputs must survive normalization unchanged.',
)
assert.equal(baseline.minuteVentilationLMin, 6, '12 × 500 mL must yield 6 L/min minute ventilation.')
assert.equal(baseline.alveolarVentilationLMin, 4.2, '12 × (500 − 150) mL must yield 4.2 L/min alveolar ventilation.')
assert.equal(baseline.deadSpaceVentilationLMin, 1.8, '12 × 150 mL must yield 1.8 L/min dead-space ventilation.')
assert.equal(baseline.alveolarFractionPct, 70, '350/500 mL must yield a 70% alveolar fraction for the illustrative breath.')

const bounded = normalizeRespiratoryInputs({
  respiratoryRate: Number.POSITIVE_INFINITY,
  tidalVolumeMl: -20,
  deadSpaceMl: 9999,
})
assert.equal(bounded.respiratoryRate, 12, 'Non-finite respiratory rate must fall back to the reference value.')
assert.equal(bounded.tidalVolumeMl, 150, 'Tidal-volume teaching input must respect the lower bound.')
assert.equal(bounded.deadSpaceMl, 150, 'Dead space must never exceed tidal volume after normalization.')

const zeroAlveolar = calculateRespiratoryMetrics({ respiratoryRate: 40, tidalVolumeMl: 150, deadSpaceMl: 500 })
assert.equal(zeroAlveolar.alveolarVentilationLMin, 0, 'Teaching math must never emit negative alveolar ventilation.')
assert.ok(zeroAlveolar.minuteVentilationLMin >= zeroAlveolar.deadSpaceVentilationLMin)
assert.equal(zeroAlveolar.alveolarFractionPct, 0)

assert.equal(RESPIRATORY_PHASES.length, 4, 'The atlas must preserve four explicit phase markers across the breath cycle.')
assert.equal(new Set(RESPIRATORY_PHASES.map((phase) => phase.id)).size, RESPIRATORY_PHASES.length, 'Respiratory phase IDs must be unique.')
assert.deepEqual(
  RESPIRATORY_PHASES.map((phase) => phase.cyclePosition),
  [0, 0.25, 0.5, 0.75],
  'Phase markers must remain ordered through normalized cycle time.',
)
for (const phase of RESPIRATORY_PHASES) {
  assert.ok(phase.diaphragm.length > 20, `${phase.id} must explain diaphragm mechanics.`)
  assert.ok(phase.thorax.length > 20, `${phase.id} must explain thoracic mechanics.`)
  assert.ok(phase.pleuralPressure.length > 20, `${phase.id} must explain pleural-pressure direction.`)
  assert.ok(phase.alveolarPressure.length > 20, `${phase.id} must explain alveolar-pressure direction.`)
  assert.ok(phase.airflow.length > 10, `${phase.id} must explain airflow direction.`)
  assert.ok(phase.elasticRecoil.length > 20, `${phase.id} must explain elastic recoil.`)
  assert.ok(phase.schematic.lungScale > 0, `${phase.id} schematic scale must remain positive.`)
}
assert.equal(respiratoryPhaseById('inspiration').schematic.airflowDirection, 1)
assert.equal(respiratoryPhaseById('passive-expiration').schematic.airflowDirection, -1)
assert.equal(respiratoryPhaseById('end-inspiration').schematic.airflowDirection, 0)

assert.ok(RESPIRATORY_STRUCTURE_CHAIN.includes('Pleural pressure coupling'))
assert.ok(RESPIRATORY_STRUCTURE_CHAIN.includes('Alveolar ventilation'))
assert.match(RESPIRATORY_MODEL_BOUNDARY, /educational reference/i)
assert.match(RESPIRATORY_MODEL_BOUNDARY, /not patient measurements/i)
assert.match(RESPIRATORY_MODEL_BOUNDARY, /does not deform source anatomy/i)
assert.match(RESPIRATORY_MODEL_BOUNDARY, /must not be used to diagnose disease/i)

console.log('Respiratory 4D teaching-model invariants verified.')
