import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildFhirBundleForSepsisCare,
  buildFhirPatientResource,
  buildFhirConditionResource,
  buildFhirEncounterResource,
  validateFhirR4Bundle,
  FHIR_CODE_SYSTEMS,
  MISSING_OBSERVATION,
} from '../../src/domains/clinical-operations/model/downstreamHilirisasiFhirPacsBridge.ts'

test('FHIR Code Systems provide standard immutable URIs', () => {
  assert.equal(FHIR_CODE_SYSTEMS.LOINC, 'http://loinc.org')
  assert.equal(FHIR_CODE_SYSTEMS.SNOMED_CT, 'http://snomed.info/sct')
  assert.equal(FHIR_CODE_SYSTEMS.ICD10, 'http://hl7.org/fhir/sid/icd-10')
  assert.equal(FHIR_CODE_SYSTEMS.UCUM, 'http://unitsofmeasure.org')
  assert.equal(FHIR_CODE_SYSTEMS.ACT_CODE, 'http://terminology.hl7.org/CodeSystem/v3-ActCode')
  assert.equal(FHIR_CODE_SYSTEMS.CONDITION_CLINICAL, 'http://terminology.hl7.org/CodeSystem/condition-clinical')
  assert.equal(FHIR_CODE_SYSTEMS.CONDITION_VER_STATUS, 'http://terminology.hl7.org/CodeSystem/condition-ver-status')
  assert.equal(FHIR_CODE_SYSTEMS.CONDITION_CATEGORY, 'http://terminology.hl7.org/CodeSystem/condition-category')
  assert.equal(FHIR_CODE_SYSTEMS.OBSERVATION_INTERPRETATION, 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation')
  assert.equal(FHIR_CODE_SYSTEMS.PANACEA_TRUTH_CLASS, 'http://panaceamed.id/fhir/truth-class')
})

test('buildFhirPatientResource creates conformant FHIR R4 Patient with privacy-safe identifier', () => {
  const patient = buildFhirPatientResource({
    patientId: 'PT-99881',
    truthClass: 'OBSERVED_CLINICAL',
    gender: 'female',
    birthDate: '1980-06-15',
    timestampIso: '2026-11-03T10:00:00.000Z',
  })
  assert.equal(patient.resourceType, 'Patient')
  assert.equal(patient.active, true)
  assert.equal(patient.gender, 'female')
  assert.equal(patient.birthDate, '1980-06-15')
  assert.equal(patient.identifier?.[0].system, 'http://panaceamed.id/patient-id')
  assert.ok(patient.identifier?.[0].value.startsWith('pt-'))
  assert.ok(!patient.identifier?.[0].value.includes('PT-99881'))
})

test('buildFhirConditionResource creates conformant FHIR R4 Condition with SNOMED and ICD-10', () => {
  const condition = buildFhirConditionResource({
    patientId: 'PT-99881',
    truthClass: 'OBSERVED_CLINICAL',
    encounterId: 'ENC-001',
    timestampIso: '2026-11-03T10:00:00.000Z',
  })
  assert.equal(condition.resourceType, 'Condition')
  assert.equal(condition.clinicalStatus.coding[0].code, 'active')
  assert.equal(condition.verificationStatus?.coding[0].code, 'confirmed')
  assert.equal(condition.code.coding[0].system, FHIR_CODE_SYSTEMS.SNOMED_CT)
  assert.equal(condition.code.coding[0].code, '91302008')
  assert.equal(condition.code.coding[1].system, FHIR_CODE_SYSTEMS.ICD10)
  assert.equal(condition.code.coding[1].code, 'A41.9')
  assert.equal(condition.encounter?.reference, 'Encounter/ENC-001')
})

test('buildFhirEncounterResource creates conformant FHIR R4 Encounter with emergency ActCode', () => {
  const encounter = buildFhirEncounterResource({
    encounterId: 'ENC-001',
    patientId: 'PT-99881',
    status: 'in-progress',
    encounterClass: 'EMER',
    truthClass: 'OBSERVED_CLINICAL',
    timestampIso: '2026-11-03T10:00:00.000Z',
  })
  assert.equal(encounter.resourceType, 'Encounter')
  assert.equal(encounter.status, 'in-progress')
  assert.equal(encounter.class.code, 'EMER')
  assert.equal(encounter.class.system, FHIR_CODE_SYSTEMS.ACT_CODE)
  assert.equal(encounter.type?.[0].coding[0].code, '91302008')
})

test('buildFhirBundleForSepsisCare generates conformant standard and full bundles', () => {
  // Standard bundle
  const stdBundle = buildFhirBundleForSepsisCare({
    patientId: 'PT-SEPSIS-1',
    lactateMmolL: 4.1,
    meanArterialPressureMmhg: 58,
    antibioticAdministered: true,
    fluidResuscitationOrdered: true,
    fluidResuscitationAdministered: false,
    truthClass: 'OBSERVED_CLINICAL',
    timestampIso: '2026-11-03T10:00:00.000Z',
  })
  assert.equal(stdBundle.resourceType, 'Bundle')
  assert.equal(stdBundle.type, 'collection')
  assert.equal(stdBundle.total, 4)
  const stdVal = validateFhirR4Bundle(stdBundle)
  assert.equal(stdVal.valid, true, `Validation failed: ${stdVal.errors.join(', ')}`)

  // Full bundle with Patient, Encounter, and Condition
  const fullBundle = buildFhirBundleForSepsisCare({
    patientId: 'PT-SEPSIS-2',
    lactateMmolL: 3.5,
    meanArterialPressureMmhg: 62,
    antibioticAdministered: true,
    fluidResuscitationOrdered: true,
    fluidResuscitationAdministered: true,
    encounterId: 'ENC-ICU-88',
    includePatientResource: true,
    includeConditionResource: true,
    truthClass: 'OBSERVED_CLINICAL',
    timestampIso: '2026-11-03T10:00:00.000Z',
  })
  assert.equal(fullBundle.resourceType, 'Bundle')
  assert.equal(fullBundle.type, 'collection')
  assert.equal(fullBundle.total, 7)
  const fullVal = validateFhirR4Bundle(fullBundle)
  assert.equal(fullVal.valid, true, `Validation failed: ${fullVal.errors.join(', ')}`)
})

test('validateFhirR4Bundle fails closed on structural defects', () => {
  // 1. Not a bundle
  assert.equal(validateFhirR4Bundle({ resourceType: 'Patient' }).valid, false)

  // 2. Bad type
  assert.equal(validateFhirR4Bundle({ resourceType: 'Bundle', type: 'unknown', total: 0, entry: [] }).valid, false)

  // 3. Count mismatch
  assert.equal(validateFhirR4Bundle({ resourceType: 'Bundle', type: 'collection', total: 10, entry: [] }).valid, false)

  // 4. Malformed fullUrl
  assert.equal(validateFhirR4Bundle({
    resourceType: 'Bundle',
    type: 'collection',
    total: 1,
    entry: [{ fullUrl: 'bad-url', resource: { resourceType: 'Patient', id: 'p1' } }],
  }).valid, false)

  // 5. ID mismatch with urn:uuid
  assert.equal(validateFhirR4Bundle({
    resourceType: 'Bundle',
    type: 'collection',
    total: 1,
    entry: [{
      fullUrl: 'urn:uuid:12345678-1234-4234-8234-123456789abc',
      resource: { resourceType: 'Patient', id: 'wrong-id' },
    }],
  }).valid, false)
})
