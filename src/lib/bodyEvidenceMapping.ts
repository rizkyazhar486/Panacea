import type { BodyProjectionTarget, ProjectionKind } from './bodyProjectionContract'

export type EvidenceLocalizationMode = 'generic-reference' | 'measured-patient'
export type EvidenceSourceKind = 'guideline' | 'peer-reviewed' | 'standard' | 'authoritative-atlas' | 'measured-clinical-data'
export type EvidenceAcademicReviewStatus = 'pending' | 'recorded'

export interface BodyEvidenceAcademicReview {
  status: EvidenceAcademicReviewStatus
  reviewerName?: string
  reviewerCredentials?: string
  reviewedAt?: string
  scope?: string
}

export interface BodyEvidenceMappingRecord {
  id: string
  targetId: string
  kind: Exclude<ProjectionKind, 'anatomy' | 'procedure'>
  localizationMode: EvidenceLocalizationMode
  sourceKind: EvidenceSourceKind
  sourceId: string
  sourceVersion: string
  citation: string
  sourceLocator: string
  evidenceSummary: string
  mappedAnatomyTerms: string[]
  patientRecordId?: string
  patientMeasurementId?: string
  patientLocationStructured?: string
  locationInferredFromFreeText: boolean
  aiAssisted: boolean
  academicReview: BodyEvidenceAcademicReview
}

export interface BodyEvidenceMappingValidation {
  publishable: boolean
  reasons: string[]
}

const nonBlank = (value: string | undefined) => Boolean(value?.trim())
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?Z)?$/
const FLOATING_VERSION_RE = /^(?:latest|main|master|head|current|versioned-record)$/i
const PLACEHOLDER_LOCATOR_RE = /^(?:verified-source-record|repository-verified-source-record|source-record|placeholder)$/i

function isPinnedSourceVersion(value: string | undefined) {
  if (!nonBlank(value)) return false
  return !FLOATING_VERSION_RE.test(value!.trim())
}

function isSpecificSourceLocator(value: string | undefined) {
  if (!nonBlank(value)) return false
  return !PLACEHOLDER_LOCATOR_RE.test(value!.trim())
}

function isValidIsoDate(value: string | undefined) {
  if (!nonBlank(value) || !ISO_DATE_RE.test(value!.trim())) return false
  const normalized = value!.trim()
  const parsed = new Date(normalized.length === 10 ? `${normalized}T00:00:00Z` : normalized)
  if (Number.isNaN(parsed.getTime())) return false
  const [year, month, day] = normalized.slice(0, 10).split('-').map(Number)
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day
}

function normalizeAnatomyTerm(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ')
}

function containsWholeAnatomyPhrase(value: string, phrase: string) {
  return ` ${value} `.includes(` ${phrase} `)
}

function anatomyTermMatchesTarget(target: BodyProjectionTarget, term: string) {
  const normalizedTerm = normalizeAnatomyTerm(term)
  if (!normalizedTerm) return false
  return target.anatomyHints.some((hint) => {
    const normalizedHint = normalizeAnatomyTerm(hint)
    if (!normalizedHint) return false
    // A mapped term may equal a target hint or be more specific than it.
    // Never accept a generic fragment merely because it appears inside a hint.
    return normalizedTerm === normalizedHint
      || containsWholeAnatomyPhrase(normalizedTerm, normalizedHint)
  })
}

export function validateBodyEvidenceMapping(
  target: BodyProjectionTarget,
  record: BodyEvidenceMappingRecord,
): BodyEvidenceMappingValidation {
  const reasons: string[] = []

  if (record.targetId !== target.id) reasons.push('Evidence mapping target does not match the requested projection target.')
  if (!target.kinds.includes(record.kind)) reasons.push(`Projection target does not permit evidence kind "${record.kind}".`)
  if (!nonBlank(record.id)) reasons.push('Evidence mapping id is missing.')
  if (!nonBlank(record.sourceId)) reasons.push('Evidence source identity is missing.')
  if (!isPinnedSourceVersion(record.sourceVersion)) reasons.push('Evidence source version/revision must be explicit and immutable.')
  if (!nonBlank(record.citation)) reasons.push('Evidence citation is missing.')
  if (!isSpecificSourceLocator(record.sourceLocator)) reasons.push('Evidence source locator must identify a specific source location.')
  if (!nonBlank(record.evidenceSummary)) reasons.push('Bounded evidence summary is missing.')
  if (!record.mappedAnatomyTerms.length || record.mappedAnatomyTerms.some((term) => !nonBlank(term))) {
    reasons.push('At least one explicit mapped anatomy term is required.')
  } else if (record.mappedAnatomyTerms.some((term) => !anatomyTermMatchesTarget(target, term))) {
    reasons.push('Every mapped anatomy term must resolve conservatively to the requested projection target anatomy hints.')
  }
  if (typeof record.aiAssisted !== 'boolean') reasons.push('AI-assistance disclosure must be an explicit boolean.')
  if (record.locationInferredFromFreeText) reasons.push('Patient lesion/location inference from free text is forbidden.')

  if (record.localizationMode === 'generic-reference') {
    if (record.sourceKind === 'measured-clinical-data') reasons.push('Generic reference localization must not masquerade as measured patient data.')
    if (nonBlank(record.patientRecordId) || nonBlank(record.patientMeasurementId) || nonBlank(record.patientLocationStructured)) reasons.push('Generic reference localization must not carry patient-specific identifiers or measured locations.')
  }

  if (record.localizationMode === 'measured-patient') {
    if (record.sourceKind !== 'measured-clinical-data') reasons.push('Measured patient localization requires measured clinical data provenance.')
    if (!target.patientSpecificAllowed) reasons.push('This projection target is not approved for patient-specific localization.')
    if (!nonBlank(record.patientRecordId)) reasons.push('Measured patient localization requires a patient record identifier.')
    if (!nonBlank(record.patientMeasurementId)) reasons.push('Measured patient localization requires a structured measurement identifier.')
    if (!nonBlank(record.patientLocationStructured)) reasons.push('Measured patient localization requires a structured measured location.')
  }

  if (target.evidenceStatus === 'unsupported') reasons.push('Projection target evidence status is unsupported.')
  if (target.geometryStatus === 'blocked') reasons.push('Projection target is blocked and cannot publish an overlay.')

  if (record.academicReview.status === 'recorded') {
    if (!nonBlank(record.academicReview.reviewerName)) reasons.push('Recorded academic review requires reviewer identity.')
    if (!nonBlank(record.academicReview.reviewerCredentials)) reasons.push('Recorded academic review requires reviewer credentials.')
    if (!nonBlank(record.academicReview.scope)) reasons.push('Recorded academic review requires review scope.')
    if (!isValidIsoDate(record.academicReview.reviewedAt)) reasons.push('Recorded academic review requires a real ISO review date/timestamp.')
  }

  if (target.academicReview === 'recorded' && record.academicReview.status !== 'recorded') reasons.push('Target requires recorded academic review metadata for publication.')
  return { publishable: reasons.length === 0, reasons: [...new Set(reasons)] }
}
