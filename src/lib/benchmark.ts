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
  'Estimasi berdasarkan norma populasi umum (ACSM/Cooper Institute), disesuaikan usia & jenis kelamin — bukan perbandingan langsung dengan pengguna Panaceamed lain (basis pengguna kami belum cukup besar untuk itu). Untuk keputusan medis, konsultasikan ke dokter.'

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
  if (pct >= 90) return 'Sekitar 10% teratas'
  if (pct >= 75) return `Sekitar ${100 - pct}% teratas`
  if (pct >= 50) return `Di atas rata-rata (≈P${pct})`
  if (pct >= 30) return `Mendekati rata-rata (≈P${pct})`
  return `Di bawah rata-rata (≈P${pct})`
}

export function benchmarkVo2max(value: number, age: number, sex: Sex): BenchmarkItem {
  const anchors = vo2Anchors(age, sex)
  const pct = interpolatePercentile(value, anchors, [40, 60, 85, 95])
  const cat = value >= anchors[3] ? 'Superior' : value >= anchors[2] ? 'Sangat Baik' : value >= anchors[1] ? 'Baik' : value >= anchors[0] ? 'Cukup' : 'Membangun Fondasi'
  const tone = pct >= 75 ? 'brand' : pct >= 40 ? 'low' : 'neutral'
  return {
    key: 'vo2max', label: 'VO₂max', value, unit: 'ml/kg/mnt',
    percentileLabel: percentileLabel(pct), categoryLabel: cat, tone,
    note: 'Prediktor mortalitas #1 — naikkan lewat Zone 2 + interval terstruktur.',
  }
}

// Lower resting HR is generally better cardiovascularly. Bands are the widely
// used generic categories (not age/sex-specific — variation there is smaller
// than for VO2max), mapped onto an approximate percentile scale.
export function benchmarkRestingHr(value: number): BenchmarkItem {
  let pct: number; let cat: string
  if (value < 60) { pct = 90; cat = 'Sangat Baik (atletis)' }
  else if (value < 70) { pct = 70; cat = 'Baik' }
  else if (value < 80) { pct = 50; cat = 'Rata-rata' }
  else if (value < 90) { pct = 25; cat = 'Di Bawah Rata-rata' }
  else { pct = 10; cat = 'Perlu Perhatian' }
  const tone = pct >= 70 ? 'brand' : pct >= 50 ? 'low' : pct >= 25 ? 'neutral' : 'critical'
  return {
    key: 'restingHr', label: 'HR Istirahat', value, unit: 'bpm',
    percentileLabel: percentileLabel(pct), categoryLabel: cat, tone,
    note: 'Turun seiring latihan aerobik konsisten (Zone 2) selama beberapa bulan.',
  }
}

// Sleep isn't "more = better" past a point, so this reports adherence to the
// 7–9h adult recommendation (National Sleep Foundation) rather than a percentile.
export function benchmarkSleep(value: number): BenchmarkItem {
  const inRange = value >= 7 && value <= 9
  const tone = inRange ? 'brand' : value < 6 ? 'critical' : value < 7 || value > 9.5 ? 'neutral' : 'low'
  const cat = inRange ? 'Sesuai Rekomendasi' : value < 7 ? 'Kurang dari Rekomendasi' : 'Lebih dari Rekomendasi'
  return {
    key: 'sleepH', label: 'Tidur', value, unit: 'jam',
    percentileLabel: inRange ? 'Dalam rentang 7–9 jam' : value < 7 ? `${(7 - value).toFixed(1)} jam di bawah minimum` : `${(value - 9).toFixed(1)} jam di atas maksimum umum`,
    categoryLabel: cat, tone,
    note: 'Rekomendasi dewasa: 7–9 jam/malam (National Sleep Foundation).',
  }
}
