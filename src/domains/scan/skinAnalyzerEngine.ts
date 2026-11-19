/**
 * Pure deterministic Dubai Longevium-Grade Optical Skin Analyzer Engine.
 *
 * Domain Purity Invariant:
 * - Zero DOM, Canvas, storage, clock, RNG, or network calls.
 * - Strictly separates visible optical surface proxies (`truthClass: 'estimated'`)
 *   from unseen dermatological diagnoses (which are NEVER claimed).
 */

export interface OpticalSkinInput {
  readonly chronologicalAgeYears: number
  /** Mean normalized luminance [0..1] from camera ROI; fails closed if too dark/blown out. */
  readonly meanLuminance01: number
  /** Luminance standard deviation across facial ROI [0..0.5]. */
  readonly toneStdDev01: number
  /** Red-minus-green chromaticity index [-0.5..0.5] (visible erythema proxy). */
  readonly redGreenDelta: number
  /** High-frequency edge/gradient energy [0..1] (visible texture/pore contrast proxy). */
  readonly edgeEnergy01: number
  /** Local dark-spot pigment variance [0..1]. */
  readonly pigmentContrast01: number
  /** Specular micro-gloss uniformity [0..1] (visible hydration/barrier proxy). */
  readonly specularUniformity01: number
}

export interface OpticalSkinScores {
  readonly toneUniformity: number
  readonly erythemaProxy: number
  readonly pigmentClarity: number
  readonly textureSmoothness: number
  readonly barrierHydration: number
  readonly estimatedOpticalSkinAgeYears: number
  readonly opticalAgeDeltaYears: number
}

export type OpticalSkinResult =
  | {
      readonly ok: true
      readonly scores: OpticalSkinScores
      readonly truthClass: 'estimated'
      readonly clinicallyReviewed: false
      readonly visibleFactsOnly: true
      readonly epistemicNotice: string
    }
  | { readonly ok: false; readonly error: string }

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))
const round = (v: number, d = 1): number => Number(v.toFixed(d))
const isFiniteIn = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi

export function evaluateOpticalSkinScan(input: OpticalSkinInput): OpticalSkinResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Skin optical input must be an object.' }
  }
  if (!isFiniteIn(input.chronologicalAgeYears, 12, 110)) {
    return { ok: false, error: 'chronologicalAgeYears must be within [12..110].' }
  }
  if (!isFiniteIn(input.meanLuminance01, 0.14, 0.92)) {
    return { ok: false, error: 'Lighting out of optical range (meanLuminance01 must be within [0.14..0.92]).' }
  }
  if (
    !isFiniteIn(input.toneStdDev01, 0, 0.5) ||
    !isFiniteIn(input.redGreenDelta, -0.5, 0.5) ||
    !isFiniteIn(input.edgeEnergy01, 0, 1) ||
    !isFiniteIn(input.pigmentContrast01, 0, 1) ||
    !isFiniteIn(input.specularUniformity01, 0, 1)
  ) {
    return { ok: false, error: 'One or more optical ROI indicators are outside physical bounds.' }
  }

  const toneUniformity = Math.round(clamp(100 - input.toneStdDev01 * 210, 20, 99))
  const erythemaProxy = Math.round(clamp(100 - Math.max(0, input.redGreenDelta - 0.04) * 240, 20, 99))
  const pigmentClarity = Math.round(clamp(100 - input.pigmentContrast01 * 92, 20, 99))
  const textureSmoothness = Math.round(clamp(100 - input.edgeEnergy01 * 88, 20, 99))
  const barrierHydration = Math.round(clamp(34 + input.specularUniformity01 * 62, 20, 99))

  const compositeSurfaceIndex =
    toneUniformity * 0.24 +
    pigmentClarity * 0.24 +
    textureSmoothness * 0.26 +
    barrierHydration * 0.16 +
    erythemaProxy * 0.1

  // Visible surface proxy relative to age baseline (bounded [-6..+8] yrs)
  const opticalAgeDeltaYears = round(clamp((78 - compositeSurfaceIndex) * 0.18, -6, 8), 1)
  const estimatedOpticalSkinAgeYears = round(
    clamp(input.chronologicalAgeYears + opticalAgeDeltaYears, 14, 110),
    1,
  )

  return {
    ok: true,
    scores: {
      toneUniformity,
      erythemaProxy,
      pigmentClarity,
      textureSmoothness,
      barrierHydration,
      estimatedOpticalSkinAgeYears,
      opticalAgeDeltaYears,
    },
    truthClass: 'estimated',
    clinicallyReviewed: false,
    visibleFactsOnly: true,
    epistemicNotice:
      'Visible optical surface proxies only (truthClass=estimated). Cannot detect subsurface pathology, melanoma, or clinical dermatologic disease; consult a dermatologist for any changing lesion.',
  }
}
