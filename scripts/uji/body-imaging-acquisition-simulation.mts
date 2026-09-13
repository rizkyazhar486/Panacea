import assert from 'node:assert/strict'
import {
  CARDIAC_ECHO_SIMULATION,
  IMAGING_SIMULATION_BOUNDARY,
  MAMMOGRAPHY_SIMULATION,
  REQUIRED_IMAGING_SIMULATIONS,
  imagingSimulationContractErrors,
} from '../../src/lib/anatomy/imagingAcquisitionSimulation.ts'

assert.deepEqual(REQUIRED_IMAGING_SIMULATIONS.map((item) => item.id), ['cardiac-echo', 'mammography'])

assert.deepEqual(CARDIAC_ECHO_SIMULATION.requiredViews, [
  'PLAX', 'PSAX', 'A4C', 'A2C', 'A3C/A5C', 'Subcostal', 'IVC', 'Suprasternal',
])
assert.deepEqual(CARDIAC_ECHO_SIMULATION.requiredModes, [
  '2D/B-mode', 'M-mode', 'Color Doppler', 'PW Doppler', 'CW Doppler', 'Tissue Doppler',
])
assert.ok(CARDIAC_ECHO_SIMULATION.requiredInteractions.includes('3D slice-plane intersection'))
assert.ok(CARDIAC_ECHO_SIMULATION.requiredInteractions.includes('ECG-synchronized cardiac phase'))

assert.deepEqual(MAMMOGRAPHY_SIMULATION.requiredViews, ['CC', 'MLO'])
assert.ok(MAMMOGRAPHY_SIMULATION.requiredAnatomy.includes('pectoralis major on MLO'))
assert.ok(MAMMOGRAPHY_SIMULATION.requiredInteractions.includes('3D anatomy to 2D projection synchronization'))
assert.ok(MAMMOGRAPHY_SIMULATION.requiredInteractions.includes('compression geometry'))

for (const contract of REQUIRED_IMAGING_SIMULATIONS) {
  assert.equal(contract.representation, 'synthetic-acquisition-geometry')
  assert.equal(contract.syntheticOnly, true)
  assert.equal(contract.patientStudy, false)
  assert.equal(contract.diagnosticInferenceAllowed, false)
  assert.equal(contract.treatmentRecommendationAllowed, false)
  assert.equal(contract.automaticClinicalScoringAllowed, false)
  assert.deepEqual(imagingSimulationContractErrors(contract), [], contract.id)
}

const unsafe = {
  ...CARDIAC_ECHO_SIMULATION,
  syntheticOnly: false,
  patientStudy: true,
  diagnosticInferenceAllowed: true,
  treatmentRecommendationAllowed: true,
  automaticClinicalScoringAllowed: true,
} as unknown as typeof CARDIAC_ECHO_SIMULATION
assert.deepEqual(imagingSimulationContractErrors(unsafe), [
  'must-remain-synthetic-only',
  'must-not-claim-patient-study',
  'diagnostic-inference-forbidden',
  'treatment-recommendation-forbidden',
  'automatic-clinical-scoring-forbidden',
])

assert.match(IMAGING_SIMULATION_BOUNDARY, /separate from source-backed clinical imaging workspaces/i)
assert.match(IMAGING_SIMULATION_BOUNDARY, /must never be relabeled as patient scans/i)

console.log('body-imaging-acquisition-simulation: echo + mammography contracts remain complete and fail closed')
