import assert from 'node:assert/strict'
import {
  CARDIAC_HEMODYNAMICS_BOUNDARY,
  CARDIAC_HEMODYNAMICS_EVIDENCE,
  CARDIAC_PHASES,
  CARDIAC_TEACHING_RELATIONSHIPS,
  buildSyntheticPvLoop,
  simulateSyntheticCardiacHemodynamics,
} from '../../src/lib/cardiacHemodynamicsLab.ts'

assert.equal(CARDIAC_PHASES.length, 4, 'cardiac cycle state machine must expose four canonical mechanical phases')
assert.deepEqual(CARDIAC_PHASES.map((phase) => phase.id), [
  'ventricular-filling',
  'isovolumic-contraction',
  'ejection',
  'isovolumic-relaxation',
])
assert.equal(CARDIAC_PHASES.filter((phase) => phase.mitralState === 'open').length, 1, 'mitral valve should be open in the simplified filling phase only')
assert.equal(CARDIAC_PHASES.filter((phase) => phase.aorticState === 'open').length, 1, 'aortic valve should be open in the simplified ejection phase only')
assert.ok(CARDIAC_PHASES.filter((phase) => phase.volumeDirection === 'fixed').length === 2, 'both isovolumic phases must keep ventricular volume fixed')

assert.ok(CARDIAC_TEACHING_RELATIONSHIPS.some((item) => item.expression === 'CO = HR × SV'))
assert.ok(CARDIAC_TEACHING_RELATIONSHIPS.some((item) => item.expression === 'SV = EDV − ESV'))
assert.ok(CARDIAC_TEACHING_RELATIONSHIPS.some((item) => /EF =/.test(item.expression)))
assert.ok(CARDIAC_TEACHING_RELATIONSHIPS.some((item) => /wall stress/i.test(item.expression)))
assert.ok(CARDIAC_TEACHING_RELATIONSHIPS.some((item) => /coronary perfusion pressure/i.test(item.expression)))
for (const relationship of CARDIAC_TEACHING_RELATIONSHIPS) {
  assert.ok(relationship.meaning.length >= 50, `${relationship.id} needs a meaningful physiology explanation`)
  assert.match(relationship.boundary, /teaching|normalized|clinical|conceptual|educational/i, `${relationship.id} needs an educational boundary`)
  assert.match(relationship.boundary, /not|no synthetic output|does not/i, `${relationship.id} must reject patient-specific interpretation`)
}

const baselineInput = { preload: 0.5, afterload: 0.5, contractility: 0.5, heartRate: 0.5, lusitropy: 0.5 }
const baseline = simulateSyntheticCardiacHemodynamics(baselineInput)
for (const [key, value] of Object.entries(baseline)) {
  assert.ok(value >= 0 && value <= 1, `${key} must remain a normalized signal`)
}

const lowPreload = simulateSyntheticCardiacHemodynamics({ ...baselineInput, preload: 0.1 })
const highPreload = simulateSyntheticCardiacHemodynamics({ ...baselineInput, preload: 0.9 })
assert.ok(highPreload.endDiastolicVolumeSignal > lowPreload.endDiastolicVolumeSignal, 'synthetic preload should directionally increase EDV signal')
assert.ok(highPreload.strokeVolumeSignal > lowPreload.strokeVolumeSignal, 'synthetic preload should directionally increase stroke-volume signal')

const lowAfterload = simulateSyntheticCardiacHemodynamics({ ...baselineInput, afterload: 0.1 })
const highAfterload = simulateSyntheticCardiacHemodynamics({ ...baselineInput, afterload: 0.9 })
assert.ok(highAfterload.ejectionPressureSignal > lowAfterload.ejectionPressureSignal, 'synthetic afterload should directionally increase ejection-pressure signal')
assert.ok(highAfterload.strokeVolumeSignal < lowAfterload.strokeVolumeSignal, 'synthetic afterload should directionally reduce stroke-volume signal')

const lowContractility = simulateSyntheticCardiacHemodynamics({ ...baselineInput, contractility: 0.1 })
const highContractility = simulateSyntheticCardiacHemodynamics({ ...baselineInput, contractility: 0.9 })
assert.ok(highContractility.strokeVolumeSignal > lowContractility.strokeVolumeSignal, 'synthetic contractility should directionally increase stroke-volume signal')
assert.ok(highContractility.endSystolicVolumeSignal < lowContractility.endSystolicVolumeSignal, 'synthetic contractility should directionally reduce end-systolic-volume signal')

const lowRate = simulateSyntheticCardiacHemodynamics({ ...baselineInput, heartRate: 0.1 })
const highRate = simulateSyntheticCardiacHemodynamics({ ...baselineInput, heartRate: 0.9 })
assert.ok(highRate.diastolicPerfusionOpportunity < lowRate.diastolicPerfusionOpportunity, 'higher normalized rate drive should reduce synthetic diastolic-perfusion opportunity')

const lowLusitropy = simulateSyntheticCardiacHemodynamics({ ...baselineInput, lusitropy: 0.1 })
const highLusitropy = simulateSyntheticCardiacHemodynamics({ ...baselineInput, lusitropy: 0.9 })
assert.ok(highLusitropy.fillingPressureSignal < lowLusitropy.fillingPressureSignal, 'better synthetic lusitropy should reduce filling-pressure signal')
assert.ok(highLusitropy.diastolicPerfusionOpportunity > lowLusitropy.diastolicPerfusionOpportunity, 'better synthetic lusitropy should increase diastolic-perfusion opportunity')

const loop = buildSyntheticPvLoop(baselineInput)
assert.equal(loop.length, 4, 'PV projection must expose four valve-transition points')
const [endDiastole, aorticOpen, endSystole, mitralOpen] = loop
assert.equal(endDiastole.volume, aorticOpen.volume, 'isovolumic contraction must preserve volume')
assert.equal(endSystole.volume, mitralOpen.volume, 'isovolumic relaxation must preserve volume')
assert.ok(endDiastole.volume > endSystole.volume, 'ejection must reduce ventricular volume in the synthetic loop')
assert.ok(aorticOpen.pressure > endDiastole.pressure, 'pressure must rise before aortic opening in the synthetic loop')
assert.ok(endSystole.pressure > mitralOpen.pressure, 'pressure must fall before mitral opening in the synthetic loop')

assert.deepEqual(CARDIAC_HEMODYNAMICS_EVIDENCE.map((source) => source.pmid), ['26436838', '27598497', '3276755'])
for (const source of CARDIAC_HEMODYNAMICS_EVIDENCE) {
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`)
  assert.ok(source.role.length >= 80, `${source.pmid} needs an explicit evidence role`)
}

assert.match(CARDIAC_HEMODYNAMICS_BOUNDARY, /educational cardiovascular physiology sandbox/i)
assert.match(CARDIAC_HEMODYNAMICS_BOUNDARY, /normalized synthetic signals/i)
assert.match(CARDIAC_HEMODYNAMICS_BOUNDARY, /does not measure or estimate patient/i)
assert.match(CARDIAC_HEMODYNAMICS_BOUNDARY, /ejection fraction/i)
assert.match(CARDIAC_HEMODYNAMICS_BOUNDARY, /procedural eligibility/i)

console.log('cardiac hemodynamics lab: pressure-volume state machine, directional synthetic responses, formula ledger and evidence boundaries validated')
