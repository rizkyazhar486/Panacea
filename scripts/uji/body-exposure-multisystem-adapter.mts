import assert from 'node:assert/strict'
import { getBodyExposureDomainIds, getBodyExposureKnowledgeContext } from '../../src/lib/bodyExposureMultisystem.ts'
import type { StrukturTubuh } from '../../src/lib/bodySearch.ts'

function mock(l: StrukturTubuh['l'], b: string, n = b): StrukturTubuh {
  return { l, b, n, w: 'trunk', s: 'tengah', y: 0.5, t: 1 } as StrukturTubuh
}

assert.deepEqual(getBodyExposureDomainIds(mock('skeletal', 'femur')), ['musculoskeletal'])
assert.deepEqual(getBodyExposureDomainIds(mock('muscular', 'biceps brachii')), ['musculoskeletal'])
assert.deepEqual(getBodyExposureDomainIds(mock('cardiovascular', 'aorta')), ['cardiovascular'])
assert.deepEqual(getBodyExposureDomainIds(mock('nervous', 'vagus nerve')), ['nervous-system'])
assert.deepEqual(getBodyExposureDomainIds(mock('lymphoid', 'lymph node')), ['hematologic-immune-lymphatic'])
assert.deepEqual(getBodyExposureDomainIds(mock('surface', 'skin')), ['integumentary'])
assert.deepEqual(getBodyExposureDomainIds(mock('visceral', 'left lung')), ['respiratory'])
assert.deepEqual(getBodyExposureDomainIds(mock('visceral', 'pancreas')), ['digestive-hepatobiliary', 'endocrine'])
assert.deepEqual(getBodyExposureDomainIds(mock('visceral', 'unknown structure')), [])

const brain = getBodyExposureKnowledgeContext(mock('visceral', 'brain'))
assert.deepEqual(brain.domainIds, ['nervous-system'])
assert.ok(brain.scales.includes('neural-circuit'))
assert.ok(brain.scales.includes('cognition-behavior'))
assert.equal(brain.educationalOnly, true)
assert.equal(brain.patientSpecificInference, false)
assert.equal(brain.diagnosisOrTreatment, false)
assert.equal(brain.academicAccuracyGateRequiredForHighRiskClinicalUse, true)

const unknown = getBodyExposureKnowledgeContext(mock('visceral', 'unknown structure'))
assert.deepEqual(unknown.domains, [])
assert.deepEqual(unknown.scales, [])

console.log('Body Exposure multisystem adapter verified.')
