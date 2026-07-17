// Estimates where a user's key fitness/health numbers sit relative to the
// general adult population, using the SAME published age-adjusted norms
// already used in TrainingPlan's vo2Category (ACSM/Cooper Institute-derived),
// extended here to a continuous percentile via interpolation between the
// same category boundaries — no new/conflicting norms introduced.
//
// Honesty guardrail: this is an estimate against PUBLISHED POPULATION DATA,
// not a live comparison against other Panaceamed users (we don't have a large
// enough user base yet for that to be meaningful). Every consumer of this
// module must say so — see the disclaimer text exported below.

export type Sex = 'M' | 'F'

export interface BenchmarkItem {
  key: 'vo2max' | 'restingHr' | 'sleepH'
  label: string
  value: number
  unit: string
  percentileLabel: string
  categoryLabel: string
  tone: 'brand' | 'low' | 'neutral' | 'critical'
  note: string
}

export const BENCHMARK_DISCLAIMER =
  'Estimated from general population norms (ACSM/Cooper Institute), adjusted for age & sex — not a direct comparison with other Panaceamed users (our user base isn\'t yet large enough for that). For medical decisions, consult a doctor.'

// Same anchor table as TrainingPlan's vo2Category: [Cukup, Baik, Sangat Baik, Superior]
// boundaries in ml/kg/min for a 30-year-old, shifted -0.3/yr past age 30.
function vo2Anchors(age: number, sex: Sex): number[] {
  const base = sex === 'M' ? [32, 38, 44, 51] : [27, 33, 39, 45]
  const shift = Math.max(0, age - 30) * 0.3
  return base.map((b) => Math.max(10, b - shift))
}

// Piecewise-linear interpolation of percentile (0-99) against value, using the
// category boundaries as anchor points at approximate percentiles.
function interpolatePercentile(value: number, anchors: number[], anchorPercentiles: number[]): number {
  const xs = [anchors[0] * 0.6, ...anchors, anchors[anchors.length - 1] * 1.15]
  const ys = [5, ...anchorPercentiles, 99]
  if (value <= xs[0]) return ys[0]
  for (let i = 1; i < xs.length; i++) {
    if (value <= xs[i]) {
      const t = (value - xs[i - 1]) / (xs[i] - xs[i - 1])
      return Math.round(ys[i - 1] + t * (ys[i] - ys[i - 1]))
    }
  }
  return ys[ys.length - 1]
}

function percentileLabel(pct: number): string {
  if (pct >= 90) return 'Top ~10%'
  if (pct >= 75) return `Top ~${100 - pct}%`
  if (pct >= 50) return `Above average (≈P${pct})`
  if (pct >= 30) return `Near average (≈P${pct})`
  return `Below average (≈P${pct})`
}

export function benchmarkVo2max(value: number, age: number, sex: Sex): BenchmarkItem {
  const anchors = vo2Anchors(age, sex)
  const pct = interpolatePercentile(value, anchors, [40, 60, 85, 95])
  const cat = value >= anchors[3] ? 'Superior' : value >= anchors[2] ? 'Excellent' : value >= anchors[1] ? 'Good' : value >= anchors[0] ? 'Fair' : 'Building Foundation'
  const tone = pct >= 75 ? 'brand' : pct >= 40 ? 'low' : 'neutral'
  return {
    key: 'vo2max', label: 'VO₂max', value, unit: 'ml/kg/min',
    percentileLabel: percentileLabel(pct), categoryLabel: cat, tone,
    note: '#1 mortality predictor — raise it through Zone 2 + structured intervals.',
  }
}

// Lower resting HR is generally better cardiovascularly. Bands are the widely
// used generic categories (not age/sex-specific — variation there is smaller
// than for VO2max), mapped onto an approximate percentile scale.
export function benchmarkRestingHr(value: number): BenchmarkItem {
  let pct: number; let cat: string
  if (value < 60) { pct = 90; cat = 'Excellent (athletic)' }
  else if (value < 70) { pct = 70; cat = 'Good' }
  else if (value < 80) { pct = 50; cat = 'Average' }
  else if (value < 90) { pct = 25; cat = 'Below Average' }
  else { pct = 10; cat = 'Needs Attention' }
  const tone = pct >= 70 ? 'brand' : pct >= 50 ? 'low' : pct >= 25 ? 'neutral' : 'critical'
  return {
    key: 'restingHr', label: 'Resting HR', value, unit: 'bpm',
    percentileLabel: percentileLabel(pct), categoryLabel: cat, tone,
    note: 'Drops with consistent aerobic training (Zone 2) over a few months.',
  }
}

// Sleep isn't "more = better" past a point, so this reports adherence to the
// 7–9h adult recommendation (National Sleep Foundation) rather than a percentile.
export function benchmarkSleep(value: number): BenchmarkItem {
  const inRange = value >= 7 && value <= 9
  const tone = inRange ? 'brand' : value < 6 ? 'critical' : value < 7 || value > 9.5 ? 'neutral' : 'low'
  const cat = inRange ? 'On Target' : value < 7 ? 'Below Target' : 'Above Target'
  return {
    key: 'sleepH', label: 'Sleep', value, unit: 'hrs',
    percentileLabel: inRange ? 'Within 7–9h range' : value < 7 ? `${(7 - value).toFixed(1)}h below minimum` : `${(value - 9).toFixed(1)}h above typical maximum`,
    categoryLabel: cat, tone,
    note: 'Adult recommendation: 7–9 hours/night (National Sleep Foundation).',
  }
}
