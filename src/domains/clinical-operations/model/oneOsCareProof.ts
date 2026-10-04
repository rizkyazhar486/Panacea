export type OneOsReviewState = 'not-required' | 'pending' | 'verified' | 'signed' | 'rejected'

export interface OneOsEvidenceFragment {
  id: string
  patientId: string
  sourceId: string
  dataClass: string
  recordedAt: string
  provenancePresent: boolean
  normalized: boolean
  requiresClinicalReview: boolean
  reviewState: OneOsReviewState
}

export interface OneOsWorkflowBenchmark {
  baselineSeconds: number
  oneOsSeconds: number
  baselineSteps?: number
  oneOsSteps?: number
}

export interface OneOsUnderstandingBenchmark {
  baselineCorrect: number
  baselineTotal: number
  oneOsCorrect: number
  oneOsTotal: number
}

export interface OneOsProofInput {
  targetPatientId: string
  evaluatedAt: string
  fragments: readonly OneOsEvidenceFragment[]
  requiredDataClasses: readonly string[]
  workflow?: OneOsWorkflowBenchmark
  understanding?: OneOsUnderstandingBenchmark
}

export interface OneOsProofResult {
  sourceCount: number
  fragmentCount: number
  unresolvedFragmentCount: number
  trustworthyFragmentCount: number
  trustCoverage: number | null
  requiredDataClassCount: number
  presentRequiredDataClassCount: number
  completenessCoverage: number | null
  missingRequiredDataClasses: string[]
  workflowTimeReductionPct: number | null
  workflowStepReductionPct: number | null
  understandingBaselinePct: number | null
  understandingOneOsPct: number | null
  understandingGainPercentagePoints: number | null
  claimState: {
    speed: 'measured' | 'unmeasured'
    completeness: 'structural-measure' | 'unmeasured'
    trust: 'structural-measure' | 'unmeasured'
    understanding: 'measured' | 'unmeasured'
  }
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null
}

function normalizeClass(value: string) {
  return value.trim().toLowerCase()
}

function finitePositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be a finite positive number`)
}

function validScore(correct: number, total: number, label: string) {
  if (!Number.isInteger(correct) || !Number.isInteger(total) || total <= 0 || correct < 0 || correct > total) {
    throw new Error(`${label} must use integer correct/total values with 0 <= correct <= total and total > 0`)
  }
}

function trustworthyFragment(
  fragment: OneOsEvidenceFragment,
  targetPatientId: string,
  evaluatedAtMs: number,
): boolean {
  const recordedAtMs = Date.parse(fragment.recordedAt)
  const timestampValid = Number.isFinite(recordedAtMs) && recordedAtMs <= evaluatedAtMs
  const identityValid = fragment.patientId.trim() !== '' && fragment.patientId === targetPatientId
  const sourceValid = fragment.sourceId.trim() !== ''
  const dataClassValid = fragment.dataClass.trim() !== ''
  const reviewValid =
    fragment.reviewState !== 'rejected' &&
    (
      !fragment.requiresClinicalReview ||
      fragment.reviewState === 'verified' ||
      fragment.reviewState === 'signed'
    )

  return Boolean(
    timestampValid &&
    identityValid &&
    sourceValid &&
    dataClassValid &&
    fragment.provenancePresent &&
    fragment.normalized &&
    reviewValid,
  )
}

/**
 * Evidence harness for the immutable One OS proof obligation.
 *
 * This function does not decide whether care is clinically correct or safe.
 * It measures whether fragmented inputs have been reconciled into a structurally
 * trustworthy context, and only reports speed/understanding gains when an
 * explicit comparative benchmark is supplied.
 */
export function evaluateOneOsCareProof(input: OneOsProofInput): OneOsProofResult {
  const targetPatientId = input.targetPatientId.trim()
  if (!targetPatientId) throw new Error('targetPatientId is required')

  const evaluatedAtMs = Date.parse(input.evaluatedAt)
  if (!Number.isFinite(evaluatedAtMs)) throw new Error('evaluatedAt must be a valid timestamp')

  const trusted = input.fragments.filter((fragment) =>
    trustworthyFragment(fragment, targetPatientId, evaluatedAtMs),
  )
  const unresolvedFragmentCount = input.fragments.length - trusted.length

  const sourceCount = new Set(
    input.fragments
      .map((fragment) => fragment.sourceId.trim())
      .filter(Boolean),
  ).size

  const requiredMap = new Map<string, string>()
  for (const item of input.requiredDataClasses) {
    const label = item.trim()
    if (!label) continue
    const key = normalizeClass(label)
    if (!requiredMap.has(key)) requiredMap.set(key, label)
  }

  const trustedClasses = new Set(trusted.map((fragment) => normalizeClass(fragment.dataClass)))
  const missingRequiredDataClasses = [...requiredMap.entries()]
    .filter(([key]) => !trustedClasses.has(key))
    .map(([, label]) => label)

  const requiredDataClassCount = requiredMap.size
  const presentRequiredDataClassCount = requiredDataClassCount - missingRequiredDataClasses.length

  let workflowTimeReductionPct: number | null = null
  let workflowStepReductionPct: number | null = null
  if (input.workflow) {
    finitePositive(input.workflow.baselineSeconds, 'baselineSeconds')
    finitePositive(input.workflow.oneOsSeconds, 'oneOsSeconds')
    workflowTimeReductionPct =
      ((input.workflow.baselineSeconds - input.workflow.oneOsSeconds) / input.workflow.baselineSeconds) * 100

    if (input.workflow.baselineSteps !== undefined || input.workflow.oneOsSteps !== undefined) {
      if (input.workflow.baselineSteps === undefined || input.workflow.oneOsSteps === undefined) {
        throw new Error('baselineSteps and oneOsSteps must be supplied together')
      }
      finitePositive(input.workflow.baselineSteps, 'baselineSteps')
      finitePositive(input.workflow.oneOsSteps, 'oneOsSteps')
      workflowStepReductionPct =
        ((input.workflow.baselineSteps - input.workflow.oneOsSteps) / input.workflow.baselineSteps) * 100
    }
  }

  let understandingBaselinePct: number | null = null
  let understandingOneOsPct: number | null = null
  let understandingGainPercentagePoints: number | null = null
  if (input.understanding) {
    validScore(input.understanding.baselineCorrect, input.understanding.baselineTotal, 'baseline understanding')
    validScore(input.understanding.oneOsCorrect, input.understanding.oneOsTotal, 'One OS understanding')
    understandingBaselinePct = (input.understanding.baselineCorrect / input.understanding.baselineTotal) * 100
    understandingOneOsPct = (input.understanding.oneOsCorrect / input.understanding.oneOsTotal) * 100
    understandingGainPercentagePoints = understandingOneOsPct - understandingBaselinePct
  }

  return {
    sourceCount,
    fragmentCount: input.fragments.length,
    unresolvedFragmentCount,
    trustworthyFragmentCount: trusted.length,
    trustCoverage: ratio(trusted.length, input.fragments.length),
    requiredDataClassCount,
    presentRequiredDataClassCount,
    completenessCoverage: ratio(presentRequiredDataClassCount, requiredDataClassCount),
    missingRequiredDataClasses,
    workflowTimeReductionPct,
    workflowStepReductionPct,
    understandingBaselinePct,
    understandingOneOsPct,
    understandingGainPercentagePoints,
    claimState: {
      speed: input.workflow ? 'measured' : 'unmeasured',
      completeness: requiredDataClassCount > 0 ? 'structural-measure' : 'unmeasured',
      trust: input.fragments.length > 0 ? 'structural-measure' : 'unmeasured',
      understanding: input.understanding ? 'measured' : 'unmeasured',
    },
  }
}
