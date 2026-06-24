// Approximate WHO/CDC growth reference curves for ages 2–19 years.
// Each entry: [age (years), P3, P50, P97]. These are smoothed reference values
// for in-app charting & interpretation; the AI computes exact LMS z-scores in a
// full workup. Curves are clearly labelled as references in the UI.

export type Tri = [number, number, number, number] // age, p3, p50, p97

export interface GrowthSet {
  weightForAge: Tri[] // BB/U (kg)
  heightForAge: Tri[] // TB/U (cm)
  bmiForAge: Tri[] // IMT/U (kg/m²)
}

const boys: GrowthSet = {
  weightForAge: [
    [2, 9.7, 12.5, 16.3],
    [3, 11.3, 14.3, 18.3],
    [4, 12.7, 16.3, 21.2],
    [5, 14.1, 18.3, 24.2],
    [6, 15.9, 20.5, 27.8],
    [7, 17.7, 22.9, 31.8],
    [8, 19.5, 25.4, 36.4],
    [9, 21.3, 28.1, 41.5],
    [10, 23.2, 31.2, 47.2],
    [11, 25.4, 34.7, 53.0],
    [12, 28.2, 38.7, 58.7],
    [13, 31.8, 43.4, 64.2],
    [14, 36.0, 48.8, 69.0],
    [15, 40.3, 54.0, 73.0],
    [16, 44.0, 58.0, 76.5],
    [17, 47.0, 61.0, 79.0],
    [18, 49.0, 63.0, 81.0],
    [19, 50.0, 65.0, 83.0],
  ],
  heightForAge: [
    [2, 81.7, 87.1, 92.9],
    [3, 89.0, 96.1, 103.5],
    [4, 95.0, 103.3, 111.5],
    [5, 101.0, 110.0, 119.0],
    [6, 106.5, 116.0, 125.8],
    [7, 111.8, 121.7, 132.0],
    [8, 116.9, 127.3, 138.6],
    [9, 121.5, 132.6, 144.6],
    [10, 125.6, 137.8, 150.5],
    [11, 129.7, 143.1, 156.2],
    [12, 134.0, 149.1, 162.5],
    [13, 139.5, 156.0, 169.0],
    [14, 147.0, 163.2, 175.5],
    [15, 153.0, 169.0, 180.5],
    [16, 157.5, 172.6, 183.5],
    [17, 160.0, 174.5, 185.0],
    [18, 161.2, 175.7, 186.0],
    [19, 162.0, 176.5, 187.0],
  ],
  bmiForAge: [
    [2, 14.7, 16.0, 18.2],
    [3, 14.0, 15.6, 17.8],
    [4, 13.7, 15.3, 17.6],
    [5, 13.5, 15.3, 17.9],
    [6, 13.4, 15.3, 18.5],
    [7, 13.5, 15.5, 19.2],
    [8, 13.7, 15.7, 20.1],
    [9, 13.9, 16.0, 21.1],
    [10, 14.2, 16.4, 22.1],
    [11, 14.6, 16.9, 23.2],
    [12, 15.0, 17.5, 24.2],
    [13, 15.5, 18.2, 25.1],
    [14, 16.0, 19.0, 25.9],
    [15, 16.5, 19.8, 26.8],
    [16, 17.0, 20.5, 27.5],
    [17, 17.5, 21.1, 28.0],
    [18, 17.8, 21.7, 28.6],
    [19, 18.0, 22.0, 29.0],
  ],
}

const girls: GrowthSet = {
  weightForAge: [
    [2, 9.0, 11.9, 15.5],
    [3, 10.8, 13.9, 18.1],
    [4, 12.3, 16.1, 21.5],
    [5, 13.7, 18.2, 24.9],
    [6, 15.3, 20.2, 28.9],
    [7, 16.8, 22.4, 33.3],
    [8, 18.6, 25.0, 38.3],
    [9, 20.8, 28.2, 43.8],
    [10, 23.3, 31.9, 49.6],
    [11, 26.1, 36.0, 55.0],
    [12, 29.4, 40.0, 59.5],
    [13, 32.7, 44.0, 63.3],
    [14, 35.8, 47.6, 66.5],
    [15, 38.0, 50.0, 68.8],
    [16, 39.5, 51.8, 70.5],
    [17, 40.5, 52.9, 71.8],
    [18, 41.0, 54.0, 72.5],
    [19, 41.5, 55.0, 73.0],
  ],
  heightForAge: [
    [2, 80.0, 85.7, 91.5],
    [3, 87.4, 95.1, 102.7],
    [4, 94.1, 102.7, 111.3],
    [5, 99.9, 109.4, 118.9],
    [6, 105.0, 115.1, 125.4],
    [7, 109.9, 120.8, 131.7],
    [8, 115.0, 126.6, 138.2],
    [9, 120.3, 132.5, 144.7],
    [10, 125.8, 138.6, 151.4],
    [11, 131.7, 145.0, 158.3],
    [12, 137.6, 151.2, 164.8],
    [13, 142.5, 156.4, 168.6],
    [14, 145.9, 159.8, 171.3],
    [15, 147.5, 161.7, 172.8],
    [16, 148.3, 162.5, 173.5],
    [17, 148.7, 162.9, 173.8],
    [18, 149.0, 163.1, 174.0],
    [19, 149.2, 163.2, 174.2],
  ],
  bmiForAge: [
    [2, 14.4, 15.7, 18.0],
    [3, 13.9, 15.4, 17.8],
    [4, 13.6, 15.3, 17.9],
    [5, 13.5, 15.2, 18.3],
    [6, 13.4, 15.3, 19.1],
    [7, 13.4, 15.4, 20.0],
    [8, 13.6, 15.7, 21.0],
    [9, 13.8, 16.1, 22.2],
    [10, 14.2, 16.6, 23.4],
    [11, 14.6, 17.2, 24.6],
    [12, 15.1, 18.0, 25.7],
    [13, 15.6, 18.8, 26.8],
    [14, 16.2, 19.6, 27.6],
    [15, 16.6, 20.2, 28.2],
    [16, 17.0, 20.7, 28.6],
    [17, 17.2, 21.0, 28.9],
    [18, 17.4, 21.3, 29.1],
    [19, 17.5, 21.5, 29.3],
  ],
}

export function growthSet(sex: 'L' | 'P'): GrowthSet {
  return sex === 'L' ? boys : girls
}

export type GrowthMetric = 'weightForAge' | 'heightForAge' | 'bmiForAge'

export const METRIC_LABEL: Record<GrowthMetric, { title: string; unit: string; short: string }> = {
  weightForAge: { title: 'Berat Badan menurut Umur (BB/U)', unit: 'kg', short: 'BB/U' },
  heightForAge: { title: 'Tinggi Badan menurut Umur (TB/U)', unit: 'cm', short: 'TB/U' },
  bmiForAge: { title: 'IMT menurut Umur (IMT/U)', unit: 'kg/m²', short: 'IMT/U' },
}

// ---------------------------------------------------------------------------
// LMS z-score engine (Cole's method, used by WHO/CDC growth standards).
//   value(z) = M · (1 + L·S·z)^(1/L)   (L≠0)
//   z(value) = ((value/M)^L − 1) / (L·S)
// We recover (L, M, S) per reference row from the tabulated P3/P50/P97 points,
// so z-scores are computed exactly rather than by crude banding.
// ---------------------------------------------------------------------------

export interface LMS {
  L: number
  M: number
  S: number
}

const Z3 = 1.8807936 // |z| at the 3rd / 97th percentile

// Fit (L, M, S) so the curve passes through P3, P50 (=M) and P97.
function fitLMS(p3: number, p50: number, p97: number): LMS {
  const M = p50
  const rp = p97 / M
  const rm = p3 / M
  const h = (L: number) => Math.pow(rp, L) + Math.pow(rm, L) - 2

  // Direction of the non-zero root is set by the sign of h'(0) = ln(rp·rm).
  const slope0 = Math.log(rp * rm)
  let L: number
  if (Math.abs(slope0) < 1e-6) {
    L = 1e-4 // near-symmetric → effectively log-normal
  } else {
    let lo = slope0 < 0 ? 1e-4 : -6
    let hi = slope0 < 0 ? 6 : -1e-4
    // bisection for the crossing (h(lo)·h(hi) < 0 by construction)
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2
      const hm = h(mid)
      if (h(lo) * hm <= 0) hi = mid
      else lo = mid
    }
    L = (lo + hi) / 2
  }
  const S = Math.abs(L) < 1e-4 ? Math.log(rp) / Z3 : (Math.pow(rp, L) - 1) / (L * Z3)
  return { L, M, S }
}

// Pre-fit LMS for every tabulated row, once.
type LmsTable = { age: number; lms: LMS }[]
const lmsCache = new Map<string, LmsTable>()
function lmsTable(set: GrowthSet, metric: GrowthMetric, key: string): LmsTable {
  const k = `${key}:${metric}`
  let t = lmsCache.get(k)
  if (!t) {
    t = set[metric].map((r) => ({ age: r[0], lms: fitLMS(r[1], r[2], r[3]) }))
    lmsCache.set(k, t)
  }
  return t
}

export function lmsAt(set: GrowthSet, metric: GrowthMetric, ageYears: number, sexKey: string): LMS {
  const t = lmsTable(set, metric, sexKey)
  const a = Math.max(t[0].age, Math.min(t[t.length - 1].age, ageYears))
  let lo = t[0]
  let hi = t[t.length - 1]
  for (let i = 0; i < t.length - 1; i++) {
    if (a >= t[i].age && a <= t[i + 1].age) {
      lo = t[i]
      hi = t[i + 1]
      break
    }
  }
  const f = hi.age === lo.age ? 0 : (a - lo.age) / (hi.age - lo.age)
  return {
    L: lo.lms.L + (hi.lms.L - lo.lms.L) * f,
    M: lo.lms.M + (hi.lms.M - lo.lms.M) * f,
    S: lo.lms.S + (hi.lms.S - lo.lms.S) * f,
  }
}

export function zscore(value: number, { L, M, S }: LMS): number {
  if (Math.abs(L) < 1e-4) return Math.log(value / M) / S
  return (Math.pow(value / M, L) - 1) / (L * S)
}

export function valueAtZ(z: number, { L, M, S }: LMS): number {
  if (Math.abs(L) < 1e-4) return M * Math.exp(S * z)
  return M * Math.pow(1 + L * S * z, 1 / L)
}

// Standard normal CDF → percentile.
export function percentile(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  p = z > 0 ? 1 - p : p
  return Math.round(p * 1000) / 10
}

export function classifyZ(
  metric: GrowthMetric,
  z: number,
): { kesan: string; tone: 'low' | 'normal' | 'high' | 'critical' } {
  if (metric === 'heightForAge') {
    if (z < -3) return { kesan: 'Sangat pendek (severely stunted)', tone: 'critical' }
    if (z < -2) return { kesan: 'Pendek (stunted)', tone: 'high' }
    if (z > 3) return { kesan: 'Tinggi (tall)', tone: 'normal' }
    return { kesan: 'Normal', tone: 'normal' }
  }
  if (metric === 'bmiForAge') {
    if (z < -3) return { kesan: 'Gizi buruk (severely wasted)', tone: 'critical' }
    if (z < -2) return { kesan: 'Gizi kurang (wasted)', tone: 'high' }
    if (z <= 1) return { kesan: 'Gizi baik (normal)', tone: 'normal' }
    if (z <= 2) return { kesan: 'Berisiko gizi lebih', tone: 'low' }
    if (z <= 3) return { kesan: 'Gizi lebih (overweight)', tone: 'high' }
    return { kesan: 'Obesitas', tone: 'critical' }
  }
  // weightForAge
  if (z < -3) return { kesan: 'Berat badan sangat kurang', tone: 'critical' }
  if (z < -2) return { kesan: 'Berat badan kurang (underweight)', tone: 'high' }
  if (z > 1) return { kesan: 'Risiko berat lebih', tone: 'low' }
  return { kesan: 'Normal', tone: 'normal' }
}
