export const STUDY_CALCULATOR_MAX_RATINGS = 20
export const STUDY_CALCULATOR_MIN_SCORE = 1
export const STUDY_CALCULATOR_MAX_SCORE = 5
export const STUDY_CALCULATOR_SOURCE = 'user-self-rating' as const
export const STUDY_CALCULATOR_INTERPRETATION = 'personal-descriptive-self-rating-only' as const
export const STUDY_CALCULATOR_BOUNDARY = 'not-mastery-competence-or-clinical-score' as const

export type StudyRatingCalculation = Readonly<{
  topicId: string
  status: 'invalid-input' | 'ready'
  count: number
  sum: number | null
  mean: number | null
  percentOfScaleMaximum: number | null
  min: number | null
  max: number | null
  sourceIdentity: typeof STUDY_CALCULATOR_SOURCE
  interpretation: typeof STUDY_CALCULATOR_INTERPRETATION
  boundary: typeof STUDY_CALCULATOR_BOUNDARY
  formulas: Readonly<{
    mean: 'sum(scores) / count'
    percentOfScaleMaximum: '100 * sum(scores) / (5 * count)'
  }>
  error: string | null
}>

const FORMULAS = Object.freeze({
  mean: 'sum(scores) / count',
  percentOfScaleMaximum: '100 * sum(scores) / (5 * count)',
} as const)

function invalid(topicId: string, error: string): StudyRatingCalculation {
  return {
    topicId,
    status: 'invalid-input',
    count: 0,
    sum: null,
    mean: null,
    percentOfScaleMaximum: null,
    min: null,
    max: null,
    sourceIdentity: STUDY_CALCULATOR_SOURCE,
    interpretation: STUDY_CALCULATOR_INTERPRETATION,
    boundary: STUDY_CALCULATOR_BOUNDARY,
    formulas: FORMULAS,
    error,
  }
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function calculateStudyRatingSummary(
  topicId: string,
  ratings: readonly number[],
): StudyRatingCalculation {
  const cleanTopicId = topicId.trim()
  if (!cleanTopicId) return invalid('', 'A non-empty study topic is required.')
  if (!Array.isArray(ratings) || ratings.length === 0) {
    return invalid(cleanTopicId, 'At least one explicit self-rating is required.')
  }
  if (ratings.length > STUDY_CALCULATOR_MAX_RATINGS) {
    return invalid(cleanTopicId, `At most ${STUDY_CALCULATOR_MAX_RATINGS} self-ratings can be calculated at once.`)
  }
  if (ratings.some((score) =>
    !Number.isInteger(score) ||
    score < STUDY_CALCULATOR_MIN_SCORE ||
    score > STUDY_CALCULATOR_MAX_SCORE
  )) {
    return invalid(cleanTopicId, 'Every study self-rating must be an integer from 1 to 5.')
  }

  const sum = ratings.reduce((total, score) => total + score, 0)
  const count = ratings.length
  const mean = round(sum / count, 2)
  const percentOfScaleMaximum = round((100 * sum) / (STUDY_CALCULATOR_MAX_SCORE * count), 1)

  return {
    topicId: cleanTopicId,
    status: 'ready',
    count,
    sum,
    mean,
    percentOfScaleMaximum,
    min: Math.min(...ratings),
    max: Math.max(...ratings),
    sourceIdentity: STUDY_CALCULATOR_SOURCE,
    interpretation: STUDY_CALCULATOR_INTERPRETATION,
    boundary: STUDY_CALCULATOR_BOUNDARY,
    formulas: FORMULAS,
    error: null,
  }
}
