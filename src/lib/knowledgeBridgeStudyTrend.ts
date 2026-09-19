import {
  STUDY_BASELINE_MIN_POINTS,
  STUDY_BASELINE_UNIT,
  type StudyBaseline,
} from './knowledgeBridgeStudyBaseline'

export const STUDY_TREND_METHOD = 'ordinary-least-squares-slope-over-observation-index'
export const STUDY_TREND_INTERPRETATION = 'personal-descriptive-self-rating-trend-only'
// Below this absolute slope (rating points per observation) the trend reads as
// noise rather than a directional change, given the 1-5 self-rating scale.
export const STUDY_TREND_STABLE_SLOPE_THRESHOLD = 0.15

export type StudyTrendDirection = 'insufficient' | 'improving' | 'declining' | 'stable'

export type StudyTrend = Readonly<{
  topicId: string
  status: 'insufficient' | 'ready'
  count: number
  direction: StudyTrendDirection
  slopePerObservation: number | null
  recentChange: number | null
  firstScore: number | null
  lastScore: number | null
  firstRecordedAt: string | null
  lastRecordedAt: string | null
  unit: typeof STUDY_BASELINE_UNIT
  method: typeof STUDY_TREND_METHOD
  interpretation: typeof STUDY_TREND_INTERPRETATION
}>

// This reuses the already-validated, sorted, bounded points from
// buildStudyBaseline rather than re-validating raw input, so trend and
// baseline can never disagree about which observations are admissible.
export function buildStudyTrend(baseline: StudyBaseline): StudyTrend {
  const common = {
    topicId: baseline.topicId,
    count: baseline.count,
    firstRecordedAt: baseline.firstRecordedAt,
    lastRecordedAt: baseline.lastRecordedAt,
    unit: STUDY_BASELINE_UNIT,
    method: STUDY_TREND_METHOD,
    interpretation: STUDY_TREND_INTERPRETATION,
  } as const

  if (baseline.status !== 'ready' || baseline.points.length < STUDY_BASELINE_MIN_POINTS) {
    return {
      ...common,
      status: 'insufficient',
      direction: 'insufficient',
      slopePerObservation: null,
      recentChange: null,
      firstScore: null,
      lastScore: null,
    }
  }

  const scores = baseline.points.map((point) => point.score)
  const n = scores.length
  const meanX = (n - 1) / 2
  const meanY = scores.reduce((sum, value) => sum + value, 0) / n

  let numerator = 0
  let denominator = 0
  scores.forEach((y, x) => {
    numerator += (x - meanX) * (y - meanY)
    denominator += (x - meanX) ** 2
  })
  const slope = denominator === 0 ? 0 : numerator / denominator

  const firstScore = scores[0]
  const lastScore = scores[n - 1]
  const direction: StudyTrendDirection =
    Math.abs(slope) < STUDY_TREND_STABLE_SLOPE_THRESHOLD
      ? 'stable'
      : slope > 0
        ? 'improving'
        : 'declining'

  return {
    ...common,
    status: 'ready',
    direction,
    slopePerObservation: slope,
    recentChange: lastScore - firstScore,
    firstScore,
    lastScore,
  }
}
