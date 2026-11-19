/**
 * Pure deterministic Reproducible Scientific Validation & Ethical Open-Core Engine.
 *
 * Domain Purity Invariant:
 * - Zero DOM, storage, clock, RNG, or network calls.
 * - E3 / E4 evidence tiers MUST fail closed unless an external validation manifest
 *   with verified SHA-256 protocol digest and n >= 30 is attached.
 * - Zero-denominator metrics return `null` rather than misleading `0`.
 * - Enforces permanent Humanitarian Free-Forever Core (no emergency/education paywalls).
 */
import { sha256Hex } from '../../lib/export/autoExportEngine.ts'
import { computeRepeatedMeasuresAnova, type AnovaAnalysisResult } from '../analytics/fullBodyAnovaEngine.ts'

export type EvidenceTier = 'E0' | 'E1' | 'E2' | 'E3' | 'E4'
export type CommercialTierId = 'free_core' | 'pro_twin' | 'clinic_saas' | 'research_api'

export interface CalibrationBinSummary {
  readonly binIndex: number
  readonly count: number
  readonly meanConfidence: number | null
  readonly observedRate: number | null
}

export interface BinaryConfusionCounts {
  readonly tp: number
  readonly fp: number
  readonly tn: number
  readonly fn: number
}

export interface ExternalValidationManifest {
  readonly datasetRef: string
  readonly sampleSizeN: number
  readonly ethicsApprovalRef: string
  readonly protocolVersion: string
  readonly reproductionCommand: string
  readonly manifestSha256: string
}

export interface EvidenceMaturityEvaluation {
  readonly requestedTier: EvidenceTier
  readonly grantedTier: EvidenceTier
  readonly validated: boolean
  readonly blockers: readonly string[]
  readonly expectedManifestSha256: string | null
  readonly clinicallyReviewed: false
  readonly truthClass: 'measured' | 'estimated'
}

export interface OpenCoreEntitlementDecision {
  readonly featureId: string
  readonly tier: CommercialTierId
  readonly allowed: boolean
  readonly humanitarianFreeCore: boolean
  readonly paywallProhibited: boolean
  readonly personalDataSaleAllowed: false
  readonly emergencySafetyPaywallAllowed: false
  readonly reason: string
}

export const HUMANITARIAN_FREE_CORE_FEATURES = Object.freeze([
  'simple_voice_mode',
  'hippocratic_dual_lens',
  'emergency_red_flag_triage',
  'offline_universal_health_qr',
  'core_body_exposure_explorer',
] as const)

export type HumanitarianFreeCoreFeatureId = (typeof HUMANITARIAN_FREE_CORE_FEATURES)[number]

const round = (v: number, d = 4): number => Number(v.toFixed(d))

export function computeBrierScore(
  predictions: readonly number[],
  outcomes: readonly (0 | 1 | number)[],
): { readonly ok: true; readonly brierScore: number; readonly n: number } | { readonly ok: false; readonly error: string } {
  if (!Array.isArray(predictions) || !Array.isArray(outcomes) || predictions.length === 0 || predictions.length !== outcomes.length) {
    return { ok: false, error: 'Predictions and binary outcomes must be non-empty arrays of identical length.' }
  }
  let sumSq = 0
  for (let i = 0; i < predictions.length; i++) {
    const p = predictions[i]
    const y = outcomes[i]
    if (typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) {
      return { ok: false, error: `Predicted probability at index ${i} must lie in [0..1].` }
    }
    if (y !== 0 && y !== 1) {
      return { ok: false, error: `Observed outcome at index ${i} must strictly be 0 or 1.` }
    }
    sumSq += (p - y) ** 2
  }
  return { ok: true, brierScore: round(sumSq / predictions.length, 4), n: predictions.length }
}

export function computeExpectedCalibrationError(
  predictions: readonly number[],
  outcomes: readonly (0 | 1 | number)[],
  binCount = 10,
): { readonly ok: true; readonly ece: number; readonly bins: readonly CalibrationBinSummary[]; readonly n: number } | { readonly ok: false; readonly error: string } {
  if (!Number.isInteger(binCount) || binCount < 2 || binCount > 50) {
    return { ok: false, error: 'binCount must be an integer in [2..50].' }
  }
  const brier = computeBrierScore(predictions, outcomes)
  if (!brier.ok) return brier

  const n = predictions.length
  const accConf = new Array<number>(binCount).fill(0)
  const accOut = new Array<number>(binCount).fill(0)
  const counts = new Array<number>(binCount).fill(0)

  for (let i = 0; i < n; i++) {
    const p = predictions[i]
    const y = outcomes[i]
    const b = Math.min(binCount - 1, Math.floor(p * binCount))
    counts[b] += 1
    accConf[b] += p
    accOut[b] += y
  }

  let ece = 0
  const bins: CalibrationBinSummary[] = []
  for (let b = 0; b < binCount; b++) {
    const c = counts[b]
    if (c === 0) {
      bins.push({ binIndex: b, count: 0, meanConfidence: null, observedRate: null })
      continue
    }
    const meanConf = accConf[b] / c
    const obsRate = accOut[b] / c
    ece += (c / n) * Math.abs(obsRate - meanConf)
    bins.push({ binIndex: b, count: c, meanConfidence: round(meanConf, 4), observedRate: round(obsRate, 4) })
  }

  return { ok: true, ece: round(ece, 4), bins, n }
}

export function computeBinaryClassificationMetrics(
  counts: BinaryConfusionCounts,
):
  | {
      readonly ok: true
      readonly n: number
      readonly sensitivity: number | null
      readonly specificity: number | null
      readonly ppv: number | null
      readonly npv: number | null
      readonly accuracy: number | null
      readonly f1: number | null
    }
  | { readonly ok: false; readonly error: string } {
  if (!counts || typeof counts !== 'object') {
    return { ok: false, error: 'Confusion matrix counts required.' }
  }
  const vals = [counts.tp, counts.fp, counts.tn, counts.fn]
  if (vals.some((v) => typeof v !== 'number' || !Number.isInteger(v) || v < 0)) {
    return { ok: false, error: 'All confusion counts (tp, fp, tn, fn) must be non-negative integers.' }
  }
  const { tp, fp, tn, fn } = counts
  const n = tp + fp + tn + fn
  if (n === 0) {
    return { ok: false, error: 'At least one observation is required.' }
  }
  const safeDiv = (num: number, den: number): number | null => (den > 0 ? round(num / den, 4) : null)
  const sensitivity = safeDiv(tp, tp + fn)
  const specificity = safeDiv(tn, tn + fp)
  const ppv = safeDiv(tp, tp + fp)
  const npv = safeDiv(tn, tn + fn)
  const accuracy = safeDiv(tp + tn, n)
  const f1 = ppv !== null && sensitivity !== null && ppv + sensitivity > 0 ? round((2 * ppv * sensitivity) / (ppv + sensitivity), 4) : safeDiv(2 * tp, 2 * tp + fp + fn)
  return { ok: true, n, sensitivity, specificity, ppv, npv, accuracy, f1 }
}

export function computeBlandAltman(
  referenceValues: readonly number[],
  candidateValues: readonly number[],
):
  | {
      readonly ok: true
      readonly n: number
      readonly bias: number
      readonly sdDiff: number
      readonly loaLower: number
      readonly loaUpper: number
    }
  | { readonly ok: false; readonly error: string } {
  if (!Array.isArray(referenceValues) || !Array.isArray(candidateValues) || referenceValues.length !== candidateValues.length) {
    return { ok: false, error: 'Reference and candidate arrays must have identical length.' }
  }
  const n = referenceValues.length
  if (n < 3) {
    return { ok: false, error: 'Bland-Altman agreement requires n >= 3 paired measurements (failing closed).' }
  }
  const diffs: number[] = []
  for (let i = 0; i < n; i++) {
    const r = referenceValues[i]
    const c = candidateValues[i]
    if (typeof r !== 'number' || !Number.isFinite(r) || typeof c !== 'number' || !Number.isFinite(c)) {
      return { ok: false, error: `Non-finite measurement at index ${i}.` }
    }
    diffs.push(c - r)
  }
  const bias = diffs.reduce((a, b) => a + b, 0) / n
  const variance = diffs.reduce((acc, d) => acc + (d - bias) ** 2, 0) / (n - 1)
  const sdDiff = Math.sqrt(variance)
  return {
    ok: true,
    n,
    bias: round(bias, 4),
    sdDiff: round(sdDiff, 4),
    loaLower: round(bias - 1.96 * sdDiff, 4),
    loaUpper: round(bias + 1.96 * sdDiff, 4),
  }
}

export function verifyLongitudinalRepeatedMeasures(
  sessionLabels: readonly string[],
  matchedMatrix: readonly (readonly number[])[],
  alpha = 0.05,
): AnovaAnalysisResult {
  return computeRepeatedMeasuresAnova(sessionLabels, matchedMatrix, alpha)
}

export function computeValidationManifestSha256(
  manifest: Omit<ExternalValidationManifest, 'manifestSha256'>,
): string {
  const canonicalPayload = JSON.stringify({
    datasetRef: manifest.datasetRef.trim(),
    ethicsApprovalRef: manifest.ethicsApprovalRef.trim(),
    protocolVersion: manifest.protocolVersion.trim(),
    reproductionCommand: manifest.reproductionCommand.trim(),
    sampleSizeN: manifest.sampleSizeN,
  })
  return sha256Hex(canonicalPayload)
}

export function evaluateEvidenceMaturity(input: {
  readonly requestedTier: EvidenceTier
  readonly internalCanaryPassed: boolean
  readonly externalValidationManifest?: ExternalValidationManifest | null
}): EvidenceMaturityEvaluation {
  const blockers: string[] = []
  const reqTier = input.requestedTier

  if (!input.internalCanaryPassed) {
    blockers.push('Internal canary/reference verification has not passed.')
    return {
      requestedTier: reqTier,
      grantedTier: 'E0',
      validated: false,
      blockers,
      expectedManifestSha256: null,
      clinicallyReviewed: false,
      truthClass: 'estimated',
    }
  }

  if (reqTier === 'E0' || reqTier === 'E1' || reqTier === 'E2') {
    return {
      requestedTier: reqTier,
      grantedTier: reqTier,
      validated: false,
      blockers,
      expectedManifestSha256: null,
      clinicallyReviewed: false,
      truthClass: 'estimated',
    }
  }

  const m = input.externalValidationManifest
  if (!m) {
    blockers.push(`Cannot grant ${reqTier} without an external validation manifest.`)
    return {
      requestedTier: reqTier,
      grantedTier: 'E2',
      validated: false,
      blockers,
      expectedManifestSha256: null,
      clinicallyReviewed: false,
      truthClass: 'estimated',
    }
  }

  const sampleSizeNum = typeof m.sampleSizeN === 'number' && Number.isFinite(m.sampleSizeN) ? m.sampleSizeN : -1
  const expectedHash = computeValidationManifestSha256({
    datasetRef: String(m.datasetRef || ''),
    sampleSizeN: sampleSizeNum,
    ethicsApprovalRef: String(m.ethicsApprovalRef || ''),
    protocolVersion: String(m.protocolVersion || ''),
    reproductionCommand: String(m.reproductionCommand || ''),
  })

  if (!m.datasetRef?.trim()) blockers.push('Missing external datasetRef.')
  if (!Number.isInteger(sampleSizeNum) || sampleSizeNum < 30) blockers.push('External validation sampleSizeN must be >= 30.')
  if (!m.ethicsApprovalRef?.trim()) blockers.push('Missing ethicsApprovalRef (IRB/EC approval).')
  if (!m.protocolVersion?.trim()) blockers.push('Missing protocolVersion.')
  if (!m.reproductionCommand?.trim()) blockers.push('Missing deterministic reproductionCommand.')
  if (!m.manifestSha256 || m.manifestSha256.toLowerCase() !== expectedHash.toLowerCase()) {
    blockers.push('External validation manifestSha256 digest mismatch.')
  }

  if (blockers.length > 0) {
    return {
      requestedTier: reqTier,
      grantedTier: 'E2',
      validated: false,
      blockers,
      expectedManifestSha256: expectedHash,
      clinicallyReviewed: false,
      truthClass: 'estimated',
    }
  }

  return {
    requestedTier: reqTier,
    grantedTier: reqTier,
    validated: true,
    blockers: [],
    expectedManifestSha256: expectedHash,
    clinicallyReviewed: false,
    truthClass: 'measured',
  }
}

export function evaluateEthicalOpenCoreEntitlement(
  tier: CommercialTierId,
  featureId: string,
): OpenCoreEntitlementDecision {
  const cleanFeature = String(featureId || '').trim()
  const isHumanitarianCore = (HUMANITARIAN_FREE_CORE_FEATURES as readonly string[]).includes(cleanFeature)

  if (isHumanitarianCore) {
    return {
      featureId: cleanFeature,
      tier,
      allowed: true,
      humanitarianFreeCore: true,
      paywallProhibited: true,
      personalDataSaleAllowed: false,
      emergencySafetyPaywallAllowed: false,
      reason: 'Permanently free under the Hippocratic & Universal Humanitarian Covenant.',
    }
  }

  const paidAllowed =
    (cleanFeature === 'pro_twin_cloud_sync' && (tier === 'pro_twin' || tier === 'clinic_saas' || tier === 'research_api')) ||
    (cleanFeature === 'clinic_satusehat_visit_os' && tier === 'clinic_saas') ||
    (cleanFeature === 'consented_research_api' && tier === 'research_api')

  return {
    featureId: cleanFeature,
    tier,
    allowed: paidAllowed,
    humanitarianFreeCore: false,
    paywallProhibited: false,
    personalDataSaleAllowed: false,
    emergencySafetyPaywallAllowed: false,
    reason: paidAllowed
      ? `Authorized under ethical commercial tier "${tier}".`
      : `Commercial/enterprise feature "${cleanFeature}" requires matching ethical tier (never affects free humanitarian care).`,
  }
}
