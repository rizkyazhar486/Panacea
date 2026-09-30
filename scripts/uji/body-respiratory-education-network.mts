import assert from 'node:assert/strict'
import { RESPIRATORY_EDUCATION_NETWORK, getRespiratoryRelationships } from '../../src/lib/bodyRespiratoryEducationNetwork.ts'

assert.equal(RESPIRATORY_EDUCATION_NETWORK.systemId, 'respiratory')
assert.equal(RESPIRATORY_EDUCATION_NETWORK.patientSpecific, false)
assert.equal(RESPIRATORY_EDUCATION_NETWORK.clinicalDecisionSupport, false)
assert.ok(RESPIRATORY_EDUCATION_NETWORK.sources.every((source) => /^\d+$/.test(source.pmid)))
assert.ok(RESPIRATORY_EDUCATION_NETWORK.sources.some((source) => source.pmid === '37816345'))
assert.ok(RESPIRATORY_EDUCATION_NETWORK.relationships.some((edge) => edge.kind === 'gas-exchange'))
assert.ok(RESPIRATORY_EDUCATION_NETWORK.relationships.some((edge) => edge.kind === 'ventilation-perfusion'))
assert.ok(RESPIRATORY_EDUCATION_NETWORK.relationships.some((edge) => edge.kind === 'pathophysiology'))
assert.ok(RESPIRATORY_EDUCATION_NETWORK.relationships.every((edge) => edge.sourcePmids.length > 0))
assert.ok(RESPIRATORY_EDUCATION_NETWORK.relationships.every((edge) => edge.educationalOnly === true))
assert.deepEqual(getRespiratoryRelationships('alveolar-unit').map((edge) => edge.id), ['alveolar-ventilation-gas-exchange', 'alveolar-perfusion-vq-coupling'])
assert.deepEqual(getRespiratoryRelationships('unknown-structure'), [])

console.log('body respiratory evidence network: ok')
