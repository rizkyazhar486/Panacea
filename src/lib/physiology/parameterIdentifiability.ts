// Contrato de identifiabilitas para satu parameter pribadi (gain skalar θ pada y = θ·x + ε, ε ~ N(0, σ²)).
// Kenapa: personalisasi tanpa data cukup = overfitting. Modul ini hanya memutuskan apakah θ BOLEH
// dipersonalisasi; hasilnya model-derived dan tidak menulis balik ke kebenaran pasien.
// Referensi: informasi Fisher untuk model linear-Gaussian, I = Σx²/σ²; sd(θ̂) = 1/√I.

export interface IdentifiabilityObservation {
  /** Regressor (mis. input model pada waktu t). */
  x: number
  /** Nilai teramati (measured). */
  y: number
  /** Simpangan baku pengukuran, satuan y; wajib diketahui. */
  sigma: number
}

export interface IdentifiabilityPolicy {
  minObservations: number
  /** Setengah-lebar interval ~95% relatif terhadap |θ̂| yang masih diterima. */
  maxRelativeHalfWidth: number
}

export const DEFAULT_IDENTIFIABILITY_POLICY: IdentifiabilityPolicy = {
  minObservations: 5,
  maxRelativeHalfWidth: 0.5,
}

export type IdentifiabilityRefusal =
  | 'invalid-policy'
  | 'invalid-observation'
  | 'insufficient-observations'
  | 'no-excitation'
  | 'estimate-near-zero'
  | 'uncertainty-too-wide'

export type IdentifiabilityResult =
  | {
      ok: true
      truthClass: 'model-derived'
      estimate: number
      standardError: number
      halfWidth95: number
      relativeHalfWidth: number
      observationCount: number
    }
  | { ok: false; reason: IdentifiabilityRefusal; detail: string }

const Z95 = 1.959964

const refuse = (reason: IdentifiabilityRefusal, detail: string): IdentifiabilityResult => ({
  ok: false,
  reason,
  detail,
})

export function assessScalarGainIdentifiability(
  observations: readonly IdentifiabilityObservation[],
  policy: IdentifiabilityPolicy = DEFAULT_IDENTIFIABILITY_POLICY,
): IdentifiabilityResult {
  if (
    !Number.isInteger(policy.minObservations) ||
    policy.minObservations < 2 ||
    !Number.isFinite(policy.maxRelativeHalfWidth) ||
    policy.maxRelativeHalfWidth <= 0
  ) {
    return refuse('invalid-policy', 'minObservations must be an integer >= 2 and maxRelativeHalfWidth > 0')
  }
  for (const [i, o] of observations.entries()) {
    if (!Number.isFinite(o.x) || !Number.isFinite(o.y) || !Number.isFinite(o.sigma) || o.sigma <= 0) {
      return refuse('invalid-observation', `observation ${i} needs finite x, y and sigma > 0`)
    }
  }
  if (observations.length < policy.minObservations) {
    return refuse(
      'insufficient-observations',
      `${observations.length} observations, ${policy.minObservations} required`,
    )
  }
  // Kuadrat terbobot (WLS): θ̂ = Σ(xy/σ²) / Σ(x²/σ²).
  let information = 0
  let cross = 0
  for (const o of observations) {
    const w = 1 / (o.sigma * o.sigma)
    information += o.x * o.x * w
    cross += o.x * o.y * w
  }
  if (!(information > 0) || !Number.isFinite(information)) {
    return refuse('no-excitation', 'regressor is zero in every observation; theta is not identifiable')
  }
  const estimate = cross / information
  const standardError = 1 / Math.sqrt(information)
  const halfWidth95 = Z95 * standardError
  if (estimate === 0) {
    return refuse('estimate-near-zero', 'relative uncertainty is undefined at theta = 0')
  }
  const relativeHalfWidth = halfWidth95 / Math.abs(estimate)
  if (relativeHalfWidth > policy.maxRelativeHalfWidth) {
    return refuse(
      'uncertainty-too-wide',
      `relative 95% half-width ${relativeHalfWidth.toFixed(3)} exceeds ${policy.maxRelativeHalfWidth}`,
    )
  }
  return {
    ok: true,
    truthClass: 'model-derived',
    estimate,
    standardError,
    halfWidth95,
    relativeHalfWidth,
    observationCount: observations.length,
  }
}
