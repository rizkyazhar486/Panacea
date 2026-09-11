export const STUDY_BASELINE_MAX_POINTS = 12
export const STUDY_BASELINE_MIN_POINTS = 3
export const STUDY_BASELINE_UNIT = 'self-rated confidence / 5'
export const STUDY_BASELINE_SOURCE = 'user-self-rating'
export const STUDY_BASELINE_METHOD = 'median + nearest-rank observed quartiles'
export const STUDY_BASELINE_INTERPRETATION = 'personal-descriptive-self-rating-only'

export type StudyBaselinePoint = Readonly<{
  topicId: string
  score: number
  recordedAt: string
  sourceIdentity: typeof STUDY_BASELINE_SOURCE
}>

export type StudyBaseline = Readonly<{
  topicId: string
  status: 'insufficient' | 'ready'
  count: number
  median: number | null
  observedQ1: number | null
  observedQ3: number | null
  unit: typeof STUDY_BASELINE_UNIT
  sourceIdentity: typeof STUDY_BASELINE_SOURCE
  method: typeof STUDY_BASELINE_METHOD
  firstRecordedAt: string | null
  lastRecordedAt: string | null
  points: readonly StudyBaselinePoint[]
  interpretation: typeof STUDY_BASELINE_INTERPRETATION
}>

export type StudyBaselineComparison = Readonly<{
  score: number
  deltaFromMedian: number | null
  position:
    | 'insufficient-baseline'
    | 'below-observed-quartile-band'
    | 'within-observed-quartile-band'
    | 'above-observed-quartile-band'
  unit: typeof STUDY_BASELINE_UNIT
  method: typeof STUDY_BASELINE_METHOD
  interpretation: typeof STUDY_BASELINE_INTERPRETATION
}>

function validTimestamp(value: string): boolean {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value))
}

function validPoint(point: StudyBaselinePoint, topicId: string): boolean {
  return topicId.length > 0 &&
    point.topicId === topicId &&
    point.sourceIdentity === STUDY_BASELINE_SOURCE &&
    Number.isInteger(point.score) &&
    point.score >= 1 &&
    point.score <= 5 &&
    validTimestamp(point.recordedAt)
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

// This is intentionally a transparent summary of the user's observed points,
// not a population reference interval. Percentile conventions differ; Panacea
// pins this simple nearest-rank method so the output stays deterministic.
function nearestRank(values: readonly number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.max(1, Math.ceil(percentile * sorted.length))
  return sorted[rank - 1]
}

export function buildStudyBaseline(
  topicId: string,
  input: readonly StudyBaselinePoint[],
): StudyBaseline {
  const cleanTopicId = topicId.trim()
  const points = cleanTopicId.length === 0
    ? []
    : input
        .filter((point) => validPoint(point, cleanTopicId))
        .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt))
        .slice(-STUDY_BASELINE_MAX_POINTS)

  const count = points.length
  const common = {
    topicId: cleanTopicId,
    count,
    unit: STUDY_BASELINE_UNIT,
    sourceIdentity: STUDY_BASELINE_SOURCE,
    method: STUDY_BASELINE_METHOD,
    firstRecordedAt: points[0]?.recordedAt ?? null,
    lastRecordedAt: count > 0 ? points[count - 1].recordedAt : null,
    points,
    interpretation: STUDY_BASELINE_INTERPRETATION,
  } as const

  if (count < STUDY_BASELINE_MIN_POINTS) {
    return {
      ...common,
      status: 'insufficient',
      median: null,
      observedQ1: null,
      observedQ3: null,
    }
  }

  const scores = points.map((point) => point.score)
  return {
    ...common,
    status: 'ready',
    median: median(scores),
    observedQ1: nearestRank(scores, 0.25),
    observedQ3: nearestRank(scores, 0.75),
  }
}

export function compareStudyScore(
  baseline: StudyBaseline,
  score: number,
): StudyBaselineComparison {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new RangeError('Study self-rating must be an integer from 1 to 5.')
  }

  if (
    baseline.status !== 'ready' ||
    baseline.median === null ||
    baseline.observedQ1 === null ||
    baseline.observedQ3 === null
  ) {
    return {
      score,
      deltaFromMedian: null,
      position: 'insufficient-baseline',
      unit: STUDY_BASELINE_UNIT,
      method: STUDY_BASELINE_METHOD,
      interpretation: STUDY_BASELINE_INTERPRETATION,
    }
  }

  return {
    score,
    deltaFromMedian: score - baseline.median,
    position: score < baseline.observedQ1
      ? 'below-observed-quartile-band'
      : score > baseline.observedQ3
        ? 'above-observed-quartile-band'
        : 'within-observed-quartile-band',
    unit: STUDY_BASELINE_UNIT,
    method: STUDY_BASELINE_METHOD,
    interpretation: STUDY_BASELINE_INTERPRETATION,
  }
}
