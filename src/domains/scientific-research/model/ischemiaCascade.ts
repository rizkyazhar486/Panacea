import { rk4, type Sample } from './numerics'
import { MODEL_VERSION } from './scientificGraph'

export interface CascadeParameters { delivery: number; responseGain: number; reperfusion: boolean }
export interface CascadePoint { t: number; reserve: number; stress: number; response: number }
export interface CascadeRun {
  points: CascadePoint[]
  sensitivity: { t: number; low: number; high: number }[]
  parameters: CascadeParameters
  modelVersion: string
  mode: 'illustrative'
  timeUnit: 'model-time'
  clinically_reviewed: false
}

export const CASCADE_ASSUMPTIONS = {
  initial: [1, 0, 0] as const, start: 0, disturbanceAt: 4, restorationAt: 12, end: 24, step: 0.1,
  rateUnit: '1/model-time', stateUnit: 'dimensionless toy index',
  rates: { reserveRecovery: 0.35, reserveLoss: 0.2, stressGeneration: 0.3, stressRecovery: 0.2, responseRecovery: 0.15 },
  parameterSource: 'Illustrative design choices; no physiological calibration or observation mapping.',
  sensitivityMeaning: 'Imposed response-gain range of ±20%, bounded to [0,1]; not a confidence interval or measured biological uncertainty.',
} as const

function validateParameters(p: CascadeParameters): void {
  if (!p || Object.keys(p).some(key => !['delivery', 'responseGain', 'reperfusion'].includes(key)) || !Number.isFinite(p.delivery) || p.delivery < 0 || p.delivery > 1 || !Number.isFinite(p.responseGain) || p.responseGain < 0 || p.responseGain > 1 || typeof p.reperfusion !== 'boolean') throw new RangeError('INVALID_CASCADE_PARAMETERS')
}

function simulate(p: CascadeParameters, gain = p.responseGain): CascadePoint[] {
  const a = CASCADE_ASSUMPTIONS
  const rates = a.rates
  let initial: readonly number[] = a.initial
  const samples: Sample[] = []
  // Batas fase diintegrasikan terpisah agar diskontinuitas tidak dirata-ratakan RK4.
  const phases = [
    { start: a.start, end: a.disturbanceAt, delivery: 1 },
    { start: a.disturbanceAt, end: a.restorationAt, delivery: p.delivery },
    { start: a.restorationAt, end: a.end, delivery: p.reperfusion ? 1 : p.delivery },
  ]
  for (const phase of phases) {
    const u = phase.delivery
    const part = rk4({ initial, ...phase, step: a.step, drift: (_t, [e, s, r]) => [
      rates.reserveRecovery * u * (1 - e) - rates.reserveLoss * (1 - u) * e,
      rates.stressGeneration * (1 - e) * (1 - s) - rates.stressRecovery * u * s,
      gain * s * (1 - r) - rates.responseRecovery * r,
    ] })
    samples.push(...(samples.length ? part.slice(1) : part))
    initial = part[part.length - 1].state
  }
  return samples.map(({ t, state: [reserve, stress, response] }) => {
    if ([reserve, stress, response].some(v => v < 0 || v > 1)) throw new RangeError('CASCADE_INVARIANT')
    return { t, reserve, stress, response }
  })
}

export function runCascade(parameters: CascadeParameters): CascadeRun {
  validateParameters(parameters)
  const p = { delivery: parameters.delivery, responseGain: parameters.responseGain, reperfusion: parameters.reperfusion }
  const points = simulate(p)
  const low = simulate(p, p.responseGain * 0.8)
  const high = simulate(p, Math.min(1, p.responseGain * 1.2))
  return {
    points, parameters: p, sensitivity: low.map((v, i) => ({ t: v.t, low: v.response, high: high[i].response })),
    modelVersion: MODEL_VERSION, mode: 'illustrative', timeUnit: 'model-time', clinically_reviewed: false,
  }
}

// Ambang sintetis hanya untuk inspeksi model, bukan waktu kejadian klinis.
export function firstCrossing(points: readonly CascadePoint[], field: 'stress' | 'response', threshold: number): number | null {
  if (!['stress', 'response'].includes(field) || !Number.isFinite(threshold) || threshold < 0 || threshold > 1 || !points.length || points.length > 10_000) throw new RangeError('INVALID_THRESHOLD_INPUT')
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    if (![p.t, p[field]].every(Number.isFinite) || p[field] < 0 || p[field] > 1 || (i > 0 && p.t <= points[i - 1].t)) throw new RangeError('INVALID_THRESHOLD_SERIES')
  }
  const i = points.findIndex(p => p[field] >= threshold)
  if (i < 0) return null
  if (i === 0) return points[0].t
  const before = points[i - 1]
  const after = points[i]
  const ratio = (threshold - before[field]) / (after[field] - before[field])
  const crossing = (1 - ratio) * before.t + ratio * after.t
  if (!Number.isFinite(crossing)) throw new RangeError('INVALID_THRESHOLD_SERIES')
  return crossing
}
