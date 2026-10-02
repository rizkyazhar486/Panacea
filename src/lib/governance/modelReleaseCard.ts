export type ModelReleaseStage = 'research' | 'internal-eval' | 'clinician-supervised-pilot' | 'production-assistive'
export type HumanReviewState = 'pending' | 'accepted' | 'accepted-with-limitations' | 'rejected'

export interface ModelReleaseCard {
  releaseId: string
  provider: string
  modelId: string
  modelVersion: string
  promptVersion: string
  intendedUse: string
  forbiddenUses: string[]
  knownLimitations: string[]
  safetyControls: string[]
  evaluationDatasetRef: string | null
  metricsSnapshotRef: string | null
  sourceRegistryRef: string | null
  humanReviewState: HumanReviewState
  humanReviewerIds: string[]
  changeSummary: string
  targetStage: ModelReleaseStage
}

export interface ModelReleaseGateCheck {
  key: string
  pass: boolean
  reason: string
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:@/-]*$/i

function nonEmptyList(values: string[]): boolean {
  return values.length > 0 && values.every((value) => value.trim().length > 0)
}

export function validateModelReleaseCard(card: ModelReleaseCard): ModelReleaseGateCheck[] {
  const supervisedOrHigher = card.targetStage === 'clinician-supervised-pilot' || card.targetStage === 'production-assistive'
  const production = card.targetStage === 'production-assistive'
  const acceptedReview = card.humanReviewState === 'accepted' || card.humanReviewState === 'accepted-with-limitations'

  return [
    { key: 'release-id', pass: SAFE_ID.test(card.releaseId), reason: 'releaseId must be a bounded immutable identifier' },
    { key: 'provider', pass: card.provider.trim().length > 0, reason: 'provider must be recorded' },
    { key: 'model-id', pass: SAFE_ID.test(card.modelId), reason: 'modelId must be explicit' },
    { key: 'model-version', pass: SAFE_ID.test(card.modelVersion), reason: 'model version must be explicit' },
    { key: 'prompt-version', pass: SAFE_ID.test(card.promptVersion), reason: 'prompt version must be explicit' },
    { key: 'intended-use', pass: card.intendedUse.trim().length >= 12, reason: 'intended use must be stated' },
    { key: 'forbidden-uses', pass: nonEmptyList(card.forbiddenUses), reason: 'at least one forbidden use must be recorded' },
    { key: 'known-limitations', pass: nonEmptyList(card.knownLimitations), reason: 'known limitations must be recorded' },
    { key: 'safety-controls', pass: nonEmptyList(card.safetyControls), reason: 'safety controls must be recorded' },
    { key: 'change-summary', pass: card.changeSummary.trim().length >= 8, reason: 'release changes must be summarized' },
    {
      key: 'evaluation-reference',
      pass: !supervisedOrHigher || Boolean(card.evaluationDatasetRef && SAFE_ID.test(card.evaluationDatasetRef)),
      reason: 'supervised pilot and production-assistive stages require an evaluation dataset reference',
    },
    {
      key: 'metrics-reference',
      pass: !supervisedOrHigher || Boolean(card.metricsSnapshotRef && SAFE_ID.test(card.metricsSnapshotRef)),
      reason: 'supervised pilot and production-assistive stages require a metrics snapshot reference',
    },
    {
      key: 'source-registry-reference',
      pass: !supervisedOrHigher || Boolean(card.sourceRegistryRef && SAFE_ID.test(card.sourceRegistryRef)),
      reason: 'supervised pilot and production-assistive stages require an evidence/source-registry reference',
    },
    {
      key: 'human-review',
      pass: !supervisedOrHigher || acceptedReview,
      reason: 'supervised pilot and production-assistive stages require accepted human review',
    },
    {
      key: 'human-reviewers',
      pass: !supervisedOrHigher || (card.humanReviewerIds.length > 0 && card.humanReviewerIds.every((id) => SAFE_ID.test(id))),
      reason: 'supervised pilot and production-assistive stages require opaque reviewer identifiers',
    },
    {
      key: 'no-rejected-production',
      pass: !production || card.humanReviewState !== 'rejected',
      reason: 'a rejected release cannot be promoted to production-assistive',
    },
  ]
}

export function modelReleaseGatePass(card: ModelReleaseCard): boolean {
  return validateModelReleaseCard(card).every((check) => check.pass)
}

export function modelReleaseMetadataCompleteness(card: ModelReleaseCard): number {
  const checks = validateModelReleaseCard(card)
  return checks.filter((check) => check.pass).length / checks.length
}

export const MODEL_RELEASE_FORMULAS = {
  metadataCompleteness: 'ModelReleaseCompleteness = passed release-card checks / total release-card checks',
  releaseGate: 'ReleaseGatePass = all stage-applicable release-card checks pass',
} as const

export const MODEL_RELEASE_BOUNDARY =
  'A passing release card is a software-governance gate only. It does not establish clinical validity, safety, efficacy, regulatory clearance, or suitability for autonomous medical decision-making. Production-assistive means clinician-supporting software with the documented human-control boundary intact.'
