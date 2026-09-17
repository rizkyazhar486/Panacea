import assert from 'node:assert/strict'
import {
  CARDIAC_HEMODYNAMICS_BOUNDARY,
  CARDIAC_HEMODYNAMICS_EVIDENCE,
  CARDIAC_PHASES,
  CARDIAC_TEACHING_RELATIONSHIPS,
  buildSyntheticPvLoop,
  simulateSyntheticCardiacHemodynamics,
} from '../../src/lib/cardiacHemodynamicsLab.ts'

assert.deepEqual(CARDIAC_PHASES.map((phase) => phase.id), ['ventricular-filling', 'isovolumic-contraction', 'ejection', 'isovolumic-relaxation'])
assert.equal(CARDIAC_PHASES.filter((phase) => phase.mitralState === 'open').length, 1)
assert.equal(CARDIAC_PHASES.filter((phase) => phase.aorticState === 'open').length, 1)
assert.equal(CARDIAC_PHASES.filter((phase) => phase.volumeDirection === 'fixed').length, 2)

for (const expression of ['CO = HR × SV', 'SV = EDV − ESV', 'EF = (SV / EDV) × 100%']) {
  assert.ok(CARDIAC_TEACHING_RELATIONSHIPS.some((relationship) => relationship.expression === expression))
}

const baseline = { preload: 0.5, afterload: 0.5, contractility: 0.5, heartRate: 0.5, lusitropy: 0.5 }
for (const value of Object.values(simulateSyntheticCardiacHemodynamics(baseline))) assert.ok(value >= 0 && value <= 1)
assert.ok(simulateSyntheticCardiacHemodynamics({ ...baseline, preload: 0.9 }).strokeVolumeSignal > simulateSyntheticCardiacHemodynamics({ ...baseline, preload: 0.1 }).strokeVolumeSignal)
assert.ok(simulateSyntheticCardiacHemodynamics({ ...baseline, afterload: 0.9 }).strokeVolumeSignal < simulateSyntheticCardiacHemodynamics({ ...baseline, afterload: 0.1 }).strokeVolumeSignal)
assert.ok(simulateSyntheticCardiacHemodynamics({ ...baseline, contractility: 0.9 }).endSystolicVolumeSignal < simulateSyntheticCardiacHemodynamics({ ...baseline, contractility: 0.1 }).endSystolicVolumeSignal)
assert.ok(simulateSyntheticCardiacHemodynamics({ ...baseline, heartRate: 0.9 }).diastolicPerfusionOpportunity < simulateSyntheticCardiacHemodynamics({ ...baseline, heartRate: 0.1 }).diastolicPerfusionOpportunity)

const loop = buildSyntheticPvLoop(baseline)
assert.equal(loop.length, 4)
assert.equal(loop[0].volume, loop[1].volume)
assert.equal(loop[2].volume, loop[3].volume)
assert.ok(loop[0].volume > loop[2].volume)
assert.deepEqual(CARDIAC_HEMODYNAMICS_EVIDENCE.map((source) => source.pmid), ['26436838', '27598497', '3276755'])
assert.match(CARDIAC_HEMODYNAMICS_BOUNDARY, /normalized synthetic signals/i)
assert.match(CARDIAC_HEMODYNAMICS_BOUNDARY, /does not measure or estimate patient/i)
console.log('cardiac hemodynamics lab: deterministic physiology and educational boundaries validated')
