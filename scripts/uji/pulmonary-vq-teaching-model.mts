import assert from 'node:assert/strict'
import { PULMONARY_VQ_EDUCATION_MODEL, derivePulmonaryVqTeachingState } from '../../src/lib/pulmonaryVqTeachingModel.ts'

assert.equal(PULMONARY_VQ_EDUCATION_MODEL.systemId, 'respiratory')
assert.ok(PULMONARY_VQ_EDUCATION_MODEL.evidence.every((source) => /^\d+$/.test(source.pmid)))
assert.ok(PULMONARY_VQ_EDUCATION_MODEL.boundary.includes('not patient-specific'))

const baseline = derivePulmonaryVqTeachingState({ regionalVentilation: 0.5, regionalPerfusion: 0.5, alveolarOxygenation: 0.5, vascularResponsiveness: 0.5 })
const matched = derivePulmonaryVqTeachingState({ regionalVentilation: 0.8, regionalPerfusion: 0.8, alveolarOxygenation: 0.8, vascularResponsiveness: 0.5 })
const lowVentilation = derivePulmonaryVqTeachingState({ regionalVentilation: 0.2, regionalPerfusion: 0.8, alveolarOxygenation: 0.2, vascularResponsiveness: 0.8 })
const lowResponsiveness = derivePulmonaryVqTeachingState({ regionalVentilation: 0.2, regionalPerfusion: 0.8, alveolarOxygenation: 0.2, vascularResponsiveness: 0.1 })

assert.ok(matched.matching > lowVentilation.matching)
assert.ok(lowVentilation.hypoxicVasoconstriction > lowResponsiveness.hypoxicVasoconstriction)
assert.ok(lowVentilation.perfusionDiversion > lowResponsiveness.perfusionDiversion)
assert.ok(Object.values(baseline).every((value) => value >= 0 && value <= 1))

console.log('pulmonary V/Q teaching model: ok')
