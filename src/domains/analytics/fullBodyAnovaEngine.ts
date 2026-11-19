/**
 * Pure deterministic Full-Body Statistical ANOVA Engine
 * (One-Way & Repeated-Measures ANOVA with F-distribution p-value & eta-squared).
 *
 * Domain Purity Invariant:
 * - Zero DOM, storage, clock, RNG, or network calls.
 * - Fails closed (`Insufficient Samples`) when n < 3 or groups < 2.
 * - Explicit `truthClass: 'estimated'` and `clinicallyReviewed: false`.
 */

export type AnovaVerdict =
  | 'Significant Improvement'
  | 'Stable'
  | 'Asymmetry Alert'
  | 'Insufficient Samples'

export interface AnovaGroupSample {
  readonly label: string
  readonly values: readonly number[]
}

export interface AnovaTableMetrics {
  readonly ssBetween: number
  readonly ssWithin: number
  readonly ssTotal: number
  readonly df1: number
  readonly df2: number
  readonly msBetween: number
  readonly msWithin: number
  readonly fStatistic: number
  readonly pValue: number
  readonly etaSquared: number
}

export interface AnovaGroupSummary {
  readonly label: string
  readonly n: number
  readonly mean: number
  readonly sd: number
}

export interface AnovaAnalysisResult {
  readonly ok: boolean
  readonly design: 'one_way' | 'repeated_measures'
  readonly verdict: AnovaVerdict
  readonly totalSamples: number
  readonly groups: readonly AnovaGroupSummary[]
  readonly table: AnovaTableMetrics | null
  readonly truthClass: 'estimated'
  readonly clinicallyReviewed: false
  readonly epistemicNotice: string
}

const round = (v: number, d = 4): number => Number(v.toFixed(d))

/** Lanczos approximation for ln(Gamma(z)) accurate to ~1e-12 for z > 0. */
function logGamma(z: number): number {
  const coeff = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.001208650973866179,
    -0.000005395239384953,
  ]
  let x = z
  let y = z
  let tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015
  for (let j = 0; j < coeff.length; j++) {
    y += 1
    ser += coeff[j] / y
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x)
}

/** Lentz continued fraction for regularized incomplete beta I_x(a, b). */
function betaContinuedFraction(a: number, b: number, x: number): number {
  const maxIter = 200
  const eps = 3e-12
  const fpMin = 1e-30
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < fpMin) d = fpMin
  d = 1 / d
  let h = d
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < fpMin) d = fpMin
    c = 1 + aa / c
    if (Math.abs(c) < fpMin) c = fpMin
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < fpMin) d = fpMin
    c = 1 + aa / c
    if (Math.abs(c) < fpMin) c = fpMin
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < eps) break
  }
  return h
}

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  )
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(a, b, x)) / a
  }
  return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b
}

/** Upper-tail p-value P(F_{df1, df2} >= f). */
export function fDistributionUpperPValue(f: number, df1: number, df2: number): number {
  if (!Number.isFinite(f) || f <= 0 || df1 <= 0 || df2 <= 0) return 1
  const x = df2 / (df2 + df1 * f)
  const p = regularizedIncompleteBeta(x, df2 / 2, df1 / 2)
  return Math.max(0, Math.min(1, p))
}

function cleanValues(values: readonly number[]): number[] {
  return (values ?? []).filter((v) => typeof v === 'number' && Number.isFinite(v))
}

function summarizeGroup(label: string, vals: readonly number[]): AnovaGroupSummary {
  const n = vals.length
  const mean = n > 0 ? vals.reduce((a, b) => a + b, 0) / n : 0
  const variance = n > 1 ? vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1) : 0
  return { label, n, mean: round(mean, 2), sd: round(Math.sqrt(variance), 2) }
}

export function computeOneWayAnova(
  rawGroups: readonly AnovaGroupSample[],
  options?: { readonly mode?: 'longitudinal' | 'bilateral'; readonly alpha?: number },
): AnovaAnalysisResult {
  const mode = options?.mode ?? 'longitudinal'
  const alpha = options?.alpha ?? 0.05

  const validGroups = (rawGroups ?? [])
    .map((g, i) => ({
      label: typeof g?.label === 'string' && g.label.trim() ? g.label.trim() : `Group ${i + 1}`,
      values: cleanValues(g?.values ?? []),
    }))
    .filter((g) => g.values.length > 0)

  const totalSamples = validGroups.reduce((sum, g) => sum + g.values.length, 0)
  const summaries = validGroups.map((g) => summarizeGroup(g.label, g.values))

  // Fail closed when fewer than 2 groups or fewer than 3 total observations (df2 < 1)
  if (validGroups.length < 2 || totalSamples < 3 || totalSamples <= validGroups.length) {
    return {
      ok: false,
      design: 'one_way',
      verdict: 'Insufficient Samples',
      totalSamples,
      groups: summaries,
      table: null,
      truthClass: 'estimated',
      clinicallyReviewed: false,
      epistemicNotice:
        'At least 2 groups and >= 3 finite samples (with df2 >= 1) are required for valid one-way ANOVA. Failing closed rather than guessing.',
    }
  }

  const grandMean =
    validGroups.reduce((sum, g) => sum + g.values.reduce((a, b) => a + b, 0), 0) / totalSamples

  let ssBetween = 0
  let ssWithin = 0
  for (const g of validGroups) {
    const gMean = g.values.reduce((a, b) => a + b, 0) / g.values.length
    ssBetween += g.values.length * (gMean - grandMean) ** 2
    for (const v of g.values) {
      ssWithin += (v - gMean) ** 2
    }
  }

  const ssTotal = ssBetween + ssWithin
  const df1 = validGroups.length - 1
  const df2 = totalSamples - validGroups.length
  const msBetween = ssBetween / df1
  const msWithin = ssWithin / df2
  const fStatistic = msWithin > 1e-12 ? msBetween / msWithin : ssBetween > 1e-12 ? 999.99 : 0
  const pValue = msWithin > 1e-12 ? fDistributionUpperPValue(fStatistic, df1, df2) : ssBetween > 1e-12 ? 0.0001 : 1
  const etaSquared = ssTotal > 1e-12 ? ssBetween / ssTotal : 0

  const firstMean = summaries[0].mean
  const lastMean = summaries[summaries.length - 1].mean

  let verdict: AnovaVerdict = 'Stable'
  if (pValue < alpha) {
    if (mode === 'bilateral') {
      verdict = 'Asymmetry Alert'
    } else {
      verdict = lastMean >= firstMean ? 'Significant Improvement' : 'Asymmetry Alert'
    }
  }

  return {
    ok: true,
    design: 'one_way',
    verdict,
    totalSamples,
    groups: summaries,
    table: {
      ssBetween: round(ssBetween, 4),
      ssWithin: round(ssWithin, 4),
      ssTotal: round(ssTotal, 4),
      df1,
      df2,
      msBetween: round(msBetween, 4),
      msWithin: round(msWithin, 4),
      fStatistic: round(fStatistic, 3),
      pValue: round(pValue, 4),
      etaSquared: round(etaSquared, 3),
    },
    truthClass: 'estimated',
    clinicallyReviewed: false,
    epistemicNotice:
      'Exploratory within-user statistical variance summary (One-Way ANOVA). Not a clinical trial or medical diagnosis.',
  }
}

/**
 * Repeated-Measures ANOVA across k sessions for n matched subjects/metrics.
 * Input matrix: `rows[subjectIndex][sessionIndex]`.
 */
export function computeRepeatedMeasuresAnova(
  sessionLabels: readonly string[],
  matchedMatrix: readonly (readonly number[])[],
  alpha = 0.05,
): AnovaAnalysisResult {
  const k = sessionLabels.length
  const validRows = (matchedMatrix ?? []).filter(
    (row) => Array.isArray(row) && row.length === k && row.every((v) => typeof v === 'number' && Number.isFinite(v)),
  )
  const n = validRows.length
  const totalSamples = n * k

  const summaries: AnovaGroupSummary[] = sessionLabels.map((label, col) =>
    summarizeGroup(label, validRows.map((r) => r[col])),
  )

  if (k < 2 || n < 3 || totalSamples < 6) {
    return {
      ok: false,
      design: 'repeated_measures',
      verdict: 'Insufficient Samples',
      totalSamples,
      groups: summaries,
      table: null,
      truthClass: 'estimated',
      clinicallyReviewed: false,
      epistemicNotice:
        'Repeated-measures ANOVA requires >= 2 sessions and >= 3 matched longitudinal observations per session. Failing closed.',
    }
  }

  const grandMean =
    validRows.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0) / totalSamples

  const colMeans = sessionLabels.map((_, c) => validRows.reduce((s, r) => s + r[c], 0) / n)
  const rowMeans = validRows.map((r) => r.reduce((a, b) => a + b, 0) / k)

  let ssTreatment = 0
  for (let c = 0; c < k; c++) ssTreatment += n * (colMeans[c] - grandMean) ** 2

  let ssSubjects = 0
  for (let i = 0; i < n; i++) ssSubjects += k * (rowMeans[i] - grandMean) ** 2

  let ssTotal = 0
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < k; c++) {
      ssTotal += (validRows[i][c] - grandMean) ** 2
    }
  }

  const ssError = Math.max(0, ssTotal - ssTreatment - ssSubjects)
  const df1 = k - 1
  const df2 = (n - 1) * (k - 1)
  const msBetween = ssTreatment / df1
  const msWithin = ssError / df2
  const fStatistic = msWithin > 1e-12 ? msBetween / msWithin : ssTreatment > 1e-12 ? 999.99 : 0
  const pValue = msWithin > 1e-12 ? fDistributionUpperPValue(fStatistic, df1, df2) : ssTreatment > 1e-12 ? 0.0001 : 1
  const etaSquared = ssTreatment + ssError > 1e-12 ? ssTreatment / (ssTreatment + ssError) : 0

  const verdict: AnovaVerdict =
    pValue < alpha
      ? colMeans[k - 1] >= colMeans[0]
        ? 'Significant Improvement'
        : 'Asymmetry Alert'
      : 'Stable'

  return {
    ok: true,
    design: 'repeated_measures',
    verdict,
    totalSamples,
    groups: summaries,
    table: {
      ssBetween: round(ssTreatment, 4),
      ssWithin: round(ssError, 4),
      ssTotal: round(ssTotal, 4),
      df1,
      df2,
      msBetween: round(msBetween, 4),
      msWithin: round(msWithin, 4),
      fStatistic: round(fStatistic, 3),
      pValue: round(pValue, 4),
      etaSquared: round(etaSquared, 3),
    },
    truthClass: 'estimated',
    clinicallyReviewed: false,
    epistemicNotice:
      'Repeated-measures longitudinal ANOVA across matched multi-system indices. Exploratory statistical feedback; not clinician-reviewed.',
  }
}
