import assert from 'node:assert/strict'
import { RENAL_EDUCATION_MODEL, deriveRenalTeachingState } from '../../src/lib/renalFiltrationTransportModel.ts'

assert.equal(RENAL_EDUCATION_MODEL.systemId, 'urinary')
assert.ok(RENAL_EDUCATION_MODEL.evidence.every((source) => /^\d+$/.test(source.pmid)))
assert.ok(RENAL_EDUCATION_MODEL.boundary.includes('not patient-specific'))

const baseline = deriveRenalTeachingState({ filtrationDrive: 0.5, tubularReabsorption: 0.5, flowSensing: 0.5, concentratingDrive: 0.5 })
const moreFiltration = deriveRenalTeachingState({ filtrationDrive: 0.9, tubularReabsorption: 0.5, flowSensing: 0.5, concentratingDrive: 0.5 })
const moreReabsorption = deriveRenalTeachingState({ filtrationDrive: 0.5, tubularReabsorption: 0.9, flowSensing: 0.5, concentratingDrive: 0.5 })
const moreConcentrating = deriveRenalTeachingState({ filtrationDrive: 0.5, tubularReabsorption: 0.5, flowSensing: 0.5, concentratingDrive: 0.9 })

assert.ok(moreFiltration.filteredLoad > baseline.filteredLoad)
assert.ok(moreReabsorption.excretoryFraction < baseline.excretoryFraction)
assert.ok(moreConcentrating.waterConservation > baseline.waterConservation)
assert.ok(Object.values(moreFiltration).every((value) => value >= 0 && value <= 1))

console.log('renal filtration-transport model: ok')
