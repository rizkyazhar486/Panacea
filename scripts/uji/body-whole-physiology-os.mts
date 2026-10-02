import assert from 'node:assert/strict'
import {
  WHOLE_BODY_COUPLING_LOOPS,
  WHOLE_BODY_PHYSIOLOGY_BOUNDARY,
  WHOLE_BODY_PHYSIOLOGY_SYSTEMS,
  getWholeBodySystem,
  simulateSyntheticHomeostasis,
} from '../../src/lib/wholeBodyPhysiologyOS.ts'

assert.equal(WHOLE_BODY_PHYSIOLOGY_SYSTEMS.length, 11, 'whole-body physiology OS must cover 11 major systems')
assert.equal(new Set(WHOLE_BODY_PHYSIOLOGY_SYSTEMS.map((system) => system.id)).size, 11, 'system ids must be unique')
assert.ok(WHOLE_BODY_COUPLING_LOOPS.length >= 8, 'whole-body physiology OS needs multisystem coupling loops')

for (const system of WHOLE_BODY_PHYSIOLOGY_SYSTEMS) {
  assert.ok(system.anatomyAnchors.length >= 3, `${system.id} needs gross-anatomy anchors`)
  assert.ok(system.physiologyAnchors.length >= 3, `${system.id} needs physiology anchors`)
  assert.ok(system.couplingTargets.length >= 2, `${system.id} needs direct whole-body couplings`)
  assert.ok(system.equation.length > 5, `${system.id} needs an explicit teaching relationship`)
  assert.match(system.equationNote, /teaching|concept|patient|diagnostic|inference|model/i)
}

for (const loop of WHOLE_BODY_COUPLING_LOOPS) {
  assert.ok(loop.path.length >= 3, `${loop.id} should cross at least three systems`)
  for (const id of loop.path) getWholeBodySystem(id)
}

const baseline = simulateSyntheticHomeostasis({ activity: 0, altitude: 0, dehydration: 0, inflammation: 0 })
const activity = simulateSyntheticHomeostasis({ activity: 1, altitude: 0, dehydration: 0, inflammation: 0 })
const altitude = simulateSyntheticHomeostasis({ activity: 0, altitude: 1, dehydration: 0, inflammation: 0 })
const dehydration = simulateSyntheticHomeostasis({ activity: 0, altitude: 0, dehydration: 1, inflammation: 0 })
const inflammation = simulateSyntheticHomeostasis({ activity: 0, altitude: 0, dehydration: 0, inflammation: 1 })

assert.ok(activity.oxygenDemand > baseline.oxygenDemand)
assert.ok(activity.circulatoryDrive > baseline.circulatoryDrive)
assert.ok(altitude.ventilatoryDrive > baseline.ventilatoryDrive)
assert.ok(dehydration.renalConservation > baseline.renalConservation)
assert.ok(inflammation.immuneSignal > baseline.immuneSignal)

const clipped = simulateSyntheticHomeostasis({ activity: 4, altitude: -3, dehydration: 9, inflammation: 2 })
for (const value of Object.values(clipped)) {
  assert.ok(value >= 0 && value <= 1, 'synthetic outputs must remain normalized')
}

assert.match(WHOLE_BODY_PHYSIOLOGY_BOUNDARY, /Educational systems physiology only/)
assert.match(WHOLE_BODY_PHYSIOLOGY_BOUNDARY, /not measurements/)
assert.match(WHOLE_BODY_PHYSIOLOGY_BOUNDARY, /patient-specific physiology/)

console.log('body whole-body physiology OS: 11 systems, coupling loops, synthetic guardrails, and reachability contract validated')
