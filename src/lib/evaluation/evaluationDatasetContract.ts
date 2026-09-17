export type EvaluationSplit = 'development' | 'validation' | 'test' | 'external'
export type EvidenceOrigin = 'synthetic' | 'retrospective-deidentified' | 'prospective-deidentified' | 'public-benchmark'
export type ReviewDisposition = 'pending' | 'accepted' | 'accepted-with-notes' | 'rejected'

export interface EvaluationDatasetManifest {
  datasetId: string
  version: string
  intendedUse: string
  populationScope: string
  clinicalSetting: string
  origin: EvidenceOrigin
  split: EvaluationSplit
  caseCount: number
  collectedFrom: string | null
  collectedTo: string | null
  deidentificationAttested: boolean
  consentOrLegalBasisRecorded: boolean
  provenanceRecorded: boolean
  labelProtocolRecorded: boolean
  reviewerProtocolRecorded: boolean
  leakageAuditRecorded: boolean
  externalValidation: boolean
}

export interface EvaluationCaseContract {
  caseId: string
  datasetId: string
  split: EvaluationSplit
  sourceRecordId: null
  patientIdentifier: null
  freeTextPatientIdentifier: null
  goldLabelIds: string[]
  reviewerIds: string[]
  reviewDisposition: ReviewDisposition
  provenanceRef: string
}

export interface DatasetContractCheck {
  key: string
  pass: boolean
  reason: string
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]*$/i

export function validateEvaluationDatasetManifest(manifest: EvaluationDatasetManifest): DatasetContractCheck[] {
  return [
    { key: 'dataset-id', pass: SAFE_ID.test(manifest.datasetId), reason: 'datasetId must be a bounded opaque identifier' },
    { key: 'version', pass: SAFE_ID.test(manifest.version), reason: 'version must be explicit and immutable for a released evaluation snapshot' },
    { key: 'intended-use', pass: manifest.intendedUse.trim().length >= 8, reason: 'intended use must be stated before interpreting performance' },
    { key: 'population-scope', pass: manifest.populationScope.trim().length >= 3, reason: 'population scope must be stated' },
    { key: 'clinical-setting', pass: manifest.clinicalSetting.trim().length >= 3, reason: 'clinical setting must be stated' },
    { key: 'case-count', pass: Number.isInteger(manifest.caseCount) && manifest.caseCount > 0, reason: 'caseCount must be a positive integer' },
    { key: 'deidentification', pass: manifest.deidentificationAttested, reason: 'de-identification must be explicitly attested before evaluation use' },
    { key: 'legal-basis', pass: manifest.consentOrLegalBasisRecorded, reason: 'consent or another applicable legal basis must be recorded' },
    { key: 'provenance', pass: manifest.provenanceRecorded, reason: 'dataset provenance must be recorded' },
    { key: 'label-protocol', pass: manifest.labelProtocolRecorded, reason: 'gold-label protocol must be recorded' },
    { key: 'reviewer-protocol', pass: manifest.reviewerProtocolRecorded, reason: 'reviewer protocol must be recorded' },
    { key: 'leakage-audit', pass: manifest.leakageAuditRecorded, reason: 'train/evaluation leakage audit must be recorded' },
    { key: 'external-claim', pass: manifest.split !== 'external' || manifest.externalValidation, reason: 'external split cannot be described as external validation without an explicit external-validation record' },
  ]
}

export function validateEvaluationCaseContract(record: EvaluationCaseContract): DatasetContractCheck[] {
  return [
    { key: 'case-id', pass: SAFE_ID.test(record.caseId), reason: 'caseId must be opaque and non-identifying' },
    { key: 'dataset-id', pass: SAFE_ID.test(record.datasetId), reason: 'datasetId must resolve to the immutable dataset manifest' },
    { key: 'no-source-record-id', pass: record.sourceRecordId === null, reason: 'raw source record identifiers must not enter the evaluation artifact' },
    { key: 'no-patient-identifier', pass: record.patientIdentifier === null, reason: 'patient identifiers are forbidden in the evaluation artifact' },
    { key: 'no-free-text-identifier', pass: record.freeTextPatientIdentifier === null, reason: 'free-text patient identifiers are forbidden' },
    { key: 'gold-labels', pass: record.goldLabelIds.length > 0 && record.goldLabelIds.every((id) => SAFE_ID.test(id)), reason: 'at least one opaque gold label is required' },
    { key: 'reviewers', pass: record.reviewerIds.length > 0 && record.reviewerIds.every((id) => SAFE_ID.test(id)), reason: 'at least one opaque reviewer identifier is required' },
    { key: 'provenance-ref', pass: SAFE_ID.test(record.provenanceRef), reason: 'every case requires a provenance reference' },
  ]
}

export function datasetMetadataCompleteness(manifest: EvaluationDatasetManifest): number {
  const checks = validateEvaluationDatasetManifest(manifest)
  return checks.filter((check) => check.pass).length / checks.length
}

export function datasetEvaluationReady(manifest: EvaluationDatasetManifest): boolean {
  return validateEvaluationDatasetManifest(manifest).every((check) => check.pass)
}

export const EVALUATION_DATASET_FORMULAS = {
  metadataCompleteness: 'MetadataCompleteness = passed dataset-contract checks / total dataset-contract checks',
} as const

export const EVALUATION_DATASET_BOUNDARY =
  'Metadata completeness is a governance/readiness signal only. It is not clinical accuracy, evidence strength, representativeness, regulatory approval, or proof that an evaluation dataset is fit for a particular deployment. No directly identifying patient data belongs in this contract.'
