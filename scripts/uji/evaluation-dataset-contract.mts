import assert from 'node:assert/strict'
import {
  EVALUATION_DATASET_BOUNDARY,
  EVALUATION_DATASET_FORMULAS,
  datasetEvaluationReady,
  datasetMetadataCompleteness,
  validateEvaluationCaseContract,
  validateEvaluationDatasetManifest,
  type EvaluationCaseContract,
  type EvaluationDatasetManifest,
} from '../../src/lib/evaluation/evaluationDatasetContract'

const validManifest: EvaluationDatasetManifest = {
  datasetId: 'panacea-clinical-eval-001',
  version: 'v1.0.0',
  intendedUse: 'Evaluate clinician-support outputs in a bounded outpatient workflow.',
  populationScope: 'Adults represented by the governed evaluation cohort.',
  clinicalSetting: 'Outpatient clinical decision-support evaluation.',
  origin: 'retrospective-deidentified',
  split: 'test',
  caseCount: 500,
  collectedFrom: '2026-01-01',
  collectedTo: '2026-06-30',
  deidentificationAttested: true,
  consentOrLegalBasisRecorded: true,
  provenanceRecorded: true,
  labelProtocolRecorded: true,
  reviewerProtocolRecorded: true,
  leakageAuditRecorded: true,
  externalValidation: false,
}

assert.equal(datasetEvaluationReady(validManifest), true)
assert.equal(datasetMetadataCompleteness(validManifest), 1)
assert.ok(validateEvaluationDatasetManifest(validManifest).every((check) => check.pass))

const incomplete = {
  ...validManifest,
  deidentificationAttested: false,
  leakageAuditRecorded: false,
}
assert.equal(datasetEvaluationReady(incomplete), false)
assert.ok(datasetMetadataCompleteness(incomplete) < 1)
assert.ok(validateEvaluationDatasetManifest(incomplete).some((check) => check.key === 'deidentification' && !check.pass))
assert.ok(validateEvaluationDatasetManifest(incomplete).some((check) => check.key === 'leakage-audit' && !check.pass))

const falseExternalClaim: EvaluationDatasetManifest = {
  ...validManifest,
  split: 'external',
  externalValidation: false,
}
assert.equal(datasetEvaluationReady(falseExternalClaim), false)
assert.ok(validateEvaluationDatasetManifest(falseExternalClaim).some((check) => check.key === 'external-claim' && !check.pass))

const invalidRuntimeManifest = {
  ...validManifest,
  origin: 'social-post',
  split: 'holdout',
} as unknown as EvaluationDatasetManifest
const invalidManifestChecks = validateEvaluationDatasetManifest(invalidRuntimeManifest)
assert.equal(datasetEvaluationReady(invalidRuntimeManifest), false)
assert.ok(invalidManifestChecks.some((check) => check.key === 'origin' && !check.pass))
assert.ok(invalidManifestChecks.some((check) => check.key === 'split' && !check.pass))

const validCase: EvaluationCaseContract = {
  caseId: 'case-0001',
  datasetId: validManifest.datasetId,
  split: 'test',
  sourceRecordId: null,
  patientIdentifier: null,
  freeTextPatientIdentifier: null,
  goldLabelIds: ['dx-001'],
  reviewerIds: ['reviewer-01'],
  reviewDisposition: 'accepted',
  provenanceRef: 'prov-0001',
}
assert.ok(validateEvaluationCaseContract(validCase).every((check) => check.pass))

const unsafeCase = {
  ...validCase,
  patientIdentifier: 'forbidden' as never,
}
assert.ok(validateEvaluationCaseContract(unsafeCase).some((check) => check.key === 'no-patient-identifier' && !check.pass))

const invalidRuntimeCase = {
  ...validCase,
  split: 'shadow',
  reviewDisposition: 'approved-by-model',
} as unknown as EvaluationCaseContract
const invalidCaseChecks = validateEvaluationCaseContract(invalidRuntimeCase)
assert.ok(invalidCaseChecks.some((check) => check.key === 'split' && !check.pass))
assert.ok(invalidCaseChecks.some((check) => check.key === 'review-disposition' && !check.pass))

assert.ok(EVALUATION_DATASET_FORMULAS.metadataCompleteness.includes('passed dataset-contract checks'))
assert.ok(EVALUATION_DATASET_BOUNDARY.includes('not clinical accuracy'))
assert.ok(EVALUATION_DATASET_BOUNDARY.includes('No directly identifying patient data'))

console.log('evaluation-dataset-contract: ok')
