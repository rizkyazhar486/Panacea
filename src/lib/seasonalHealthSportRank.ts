/**
 * Panacea Seasonal Health & Sport Rank Engine
 *
 * Game-like progression without turning illness, disability, injury or planned
 * recovery into a punishment. Visible rank resets every 3 calendar months.
 * Rank points are derived from observed, source-bound health/training evidence.
 */

export type RankedMode = 'health' | 'sport'
export type RankTierId = 'master' | 'grandmaster' | 'epic' | 'legend' | 'mythic' | 'mythic-immortal'

export interface RankTier {
  id: RankTierId
  label: string
  minPoints: number
  accent: string
  glyph: string
}

export const RANK_TIERS: readonly RankTier[] = Object.freeze([
  { id: 'master', label: 'Master', minPoints: 0, accent: 'from-slate-400 to-slate-200', glyph: '◆' },
  { id: 'grandmaster', label: 'Grandmaster', minPoints: 500, accent: 'from-amber-500 to-yellow-200', glyph: '✦' },
  { id: 'epic', label: 'Epic', minPoints: 1100, accent: 'from-fuchsia-600 to-violet-300', glyph: '⬢' },
  { id: 'legend', label: 'Legend', minPoints: 1700, accent: 'from-orange-500 to-amber-200', glyph: '✧' },
  { id: 'mythic', label: 'Mythic', minPoints: 2300, accent: 'from-cyan-500 to-blue-300', glyph: '✺' },
  { id: 'mythic-immortal', label: 'Mythic Immortal', minPoints: 2900, accent: 'from-emerald-400 via-cyan-300 to-violet-400', glyph: '✹' },
])

export interface SeasonWindow {
  id: string
  index: 1 | 2 | 3 | 4
  year: number
  start: Date
  end: Date
  resetAt: Date
}

export interface RankedWorkoutEvidence {
  id: string
  startedAt: string
  durationMinutes: number
  paceSecondsPerKm?: number
  speedKmh?: number
  rpe?: number
}

export interface RankedHealthEvidence {
  recoveryPct?: number
  sleepHours?: number
  updatedAt?: string
  history?: readonly {
    date: string
    recoveryPct?: number
    sleepH?: number
  }[]
}

export interface RankedEvidence {
  workouts: readonly RankedWorkoutEvidence[]
  health?: RankedHealthEvidence
}

export interface RankComponents {
  consistency: number
  activity: number
  recovery: number
  progression: number
  evidence: number
}

export interface SeasonalRankResult {
  mode: RankedMode
  season: SeasonWindow
  points: number
  score: number
  components: RankComponents
  currentTier: RankTier
  nextTier: RankTier | null
  division: 'V' | 'IV' | 'III' | 'II' | 'I' | null
  progressToNext: number
  pointsToNext: number
  eligibleWeeks: number
  workoutCount: number
  evidenceLabel: 'insufficient' | 'limited' | 'moderate' | 'strong'
  promotionFocus: readonly string[]
  safetyPolicy: 'recovery-protected'
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))
const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS

function validDate(value: string): Date | null {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function getSeasonWindow(now = new Date()): SeasonWindow {
  const year = now.getFullYear()
  const index = (Math.floor(now.getMonth() / 3) + 1) as 1 | 2 | 3 | 4
  const startMonth = (index - 1) * 3
  const start = new Date(year, startMonth, 1, 0, 0, 0, 0)
  const resetAt = new Date(year, startMonth + 3, 1, 0, 0, 0, 0)
  const end = new Date(resetAt.getTime() - 1)
  return {
    id: `${year}-S${index}`,
    index,
    year,
    start,
    end,
    resetAt,
  }
}

export function daysUntilSeasonReset(now = new Date()): number {
  const { resetAt } = getSeasonWindow(now)
  return Math.max(0, Math.ceil((resetAt.getTime() - now.getTime()) / DAY_MS))
}

function workoutDate(w: RankedWorkoutEvidence): Date | null {
  return validDate(w.startedAt)
}

function inSeason(w: RankedWorkoutEvidence, season: SeasonWindow): boolean {
  const d = workoutDate(w)
  return !!d && d >= season.start && d < season.resetAt
}

function weekIndex(date: Date, season: SeasonWindow): number {
  return Math.max(0, Math.floor((date.getTime() - season.start.getTime()) / WEEK_MS))
}

function median(values: readonly number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function progressionScore(workouts: readonly RankedWorkoutEvidence[]): number {
  const pace = workouts
    .map((w) => ({ date: workoutDate(w), value: w.paceSecondsPerKm }))
    .filter((x): x is { date: Date; value: number } => !!x.date && typeof x.value === 'number' && x.value > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const speed = workouts
    .map((w) => ({ date: workoutDate(w), value: w.speedKmh }))
    .filter((x): x is { date: Date; value: number } => !!x.date && typeof x.value === 'number' && x.value > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const series = pace.length >= 4 ? pace : speed.length >= 4 ? speed : []
  if (series.length < 4) return 50

  const block = Math.max(2, Math.floor(series.length / 3))
  const first = median(series.slice(0, block).map((x) => x.value))
  const last = median(series.slice(-block).map((x) => x.value))
  if (!first || !last) return 50

  // Pace improves downward; speed improves upward.
  const fractionalChange = pace.length >= 4
    ? (first - last) / first
    : (last - first) / first

  // ±5% meaningful change maps to approximately 0–100 without letting one
  // extreme session dominate a 3-month season.
  return clamp(50 + fractionalChange * 1000)
}

function recoveryScore(health?: RankedHealthEvidence, season?: SeasonWindow): number {
  if (!health) return 50
  const history = (health.history ?? [])
    .filter((x) => {
      if (!season) return true
      const d = validDate(x.date)
      return !!d && d >= season.start && d < season.resetAt
    })

  const recoveryValues = history
    .map((x) => x.recoveryPct)
    .filter((x): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 100)

  if (recoveryValues.length >= 3) {
    return clamp(recoveryValues.reduce((a, b) => a + b, 0) / recoveryValues.length)
  }

  if (typeof health.recoveryPct === 'number' && Number.isFinite(health.recoveryPct)) {
    return clamp(health.recoveryPct)
  }

  const sleepValues = history
    .map((x) => x.sleepH)
    .filter((x): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0)

  const sleep = sleepValues.length
    ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length
    : health.sleepHours

  if (typeof sleep !== 'number' || !Number.isFinite(sleep) || sleep <= 0) return 50

  // Neutral fallback, not a diagnosis: 7–9 h gets full adherence credit;
  // shorter/longer durations taper rather than becoming a punitive loss.
  if (sleep >= 7 && sleep <= 9) return 100
  return clamp(100 - Math.min(Math.abs(sleep < 7 ? 7 - sleep : sleep - 9), 4) * 20)
}

function evidenceScore(workouts: readonly RankedWorkoutEvidence[], health?: RankedHealthEvidence): number {
  let score = 0
  if (workouts.length >= 3) score += 25
  if (workouts.length >= 8) score += 20
  if (workouts.some((w) => (w.durationMinutes ?? 0) > 0)) score += 10
  if (workouts.some((w) => (w.paceSecondsPerKm ?? 0) > 0 || (w.speedKmh ?? 0) > 0)) score += 15
  if (typeof health?.recoveryPct === 'number' || typeof health?.sleepHours === 'number') score += 15
  if ((health?.history?.length ?? 0) >= 7) score += 15
  return clamp(score)
}

function rankTierForPoints(points: number): RankTier {
  let tier = RANK_TIERS[0]
  for (const candidate of RANK_TIERS) {
    if (points >= candidate.minPoints) tier = candidate
  }
  return tier
}

function divisionFor(points: number, tier: RankTier, next: RankTier | null): 'V' | 'IV' | 'III' | 'II' | 'I' | null {
  if (!next) return null
  const span = Math.max(1, next.minPoints - tier.minPoints)
  const p = clamp(((points - tier.minPoints) / span) * 100)
  if (p < 20) return 'V'
  if (p < 40) return 'IV'
  if (p < 60) return 'III'
  if (p < 80) return 'II'
  return 'I'
}

function promotionFocus(components: RankComponents): readonly string[] {
  const labels: Array<[keyof RankComponents, string]> = [
    ['consistency', 'Build a safer, repeatable weekly training rhythm.'],
    ['activity', 'Accumulate enough verified weekly activity before adding more intensity.'],
    ['recovery', 'Protect sleep/recovery; planned recovery still counts as good play.'],
    ['progression', 'Repeat comparable sessions so improvement can be measured rather than guessed.'],
    ['evidence', 'Connect or import more source-bound data to strengthen rank confidence.'],
  ]
  return labels
    .sort((a, b) => components[a[0]] - components[b[0]])
    .slice(0, 2)
    .map((x) => x[1])
}

export function calculateSeasonalRank(
  input: RankedEvidence,
  mode: RankedMode = 'health',
  now = new Date(),
): SeasonalRankResult {
  const season = getSeasonWindow(now)
  const workouts = input.workouts
    .filter((w) => inSeason(w, season))
    .filter((w) => Number.isFinite(w.durationMinutes) && w.durationMinutes >= 0)
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt))

  const elapsedWeeks = Math.max(1, Math.min(13, Math.ceil((now.getTime() - season.start.getTime() + 1) / WEEK_MS)))
  const weekMap = new Map<number, RankedWorkoutEvidence[]>()
  for (const workout of workouts) {
    const d = workoutDate(workout)
    if (!d) continue
    const index = weekIndex(d, season)
    const current = weekMap.get(index) ?? []
    current.push(workout)
    weekMap.set(index, current)
  }

  let activeDayTotal = 0
  let activityScoreTotal = 0
  for (let i = 0; i < elapsedWeeks; i++) {
    const week = weekMap.get(i) ?? []
    const activeDays = new Set(
      week
        .map((w) => workoutDate(w))
        .filter((d): d is Date => !!d)
        .map((d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`),
    ).size
    activeDayTotal += Math.min(activeDays, 4)
    const minutes = week.reduce((sum, w) => sum + Math.max(0, w.durationMinutes || 0), 0)
    // WHO adult baseline is 150 min/week moderate activity. Rank credit caps at
    // the target so excessive volume cannot be gamed for unlimited points.
    activityScoreTotal += clamp((minutes / 150) * 100)
  }

  const consistency = clamp((activeDayTotal / (elapsedWeeks * 4)) * 100)
  const activity = clamp(activityScoreTotal / elapsedWeeks)
  const recovery = recoveryScore(input.health, season)
  const progression = progressionScore(workouts)
  const evidence = evidenceScore(workouts, input.health)

  const components: RankComponents = { consistency, activity, recovery, progression, evidence }
  const weights = mode === 'health'
    ? { consistency: 0.30, activity: 0.25, recovery: 0.25, progression: 0.10, evidence: 0.10 }
    : { consistency: 0.25, activity: 0.20, recovery: 0.15, progression: 0.30, evidence: 0.10 }

  const score = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + components[key as keyof RankComponents] * weight,
    0,
  )

  // Each eligible week contributes up to 250 RP. A perfect 13-week season
  // yields 3250 RP, enough to reach Mythic Immortal without rewarding unsafe
  // volume beyond the activity cap.
  const points = Math.round(score * elapsedWeeks * 2.5)
  const currentTier = rankTierForPoints(points)
  const tierIndex = RANK_TIERS.findIndex((tier) => tier.id === currentTier.id)
  const nextTier = RANK_TIERS[tierIndex + 1] ?? null
  const division = divisionFor(points, currentTier, nextTier)
  const progressToNext = nextTier
    ? clamp(((points - currentTier.minPoints) / Math.max(1, nextTier.minPoints - currentTier.minPoints)) * 100)
    : 100
  const pointsToNext = nextTier ? Math.max(0, nextTier.minPoints - points) : 0
  const evidenceLabel: SeasonalRankResult['evidenceLabel'] =
    evidence < 25 ? 'insufficient' : evidence < 50 ? 'limited' : evidence < 75 ? 'moderate' : 'strong'

  return {
    mode,
    season,
    points,
    score: Math.round(score),
    components,
    currentTier,
    nextTier,
    division,
    progressToNext,
    pointsToNext,
    eligibleWeeks: elapsedWeeks,
    workoutCount: workouts.length,
    evidenceLabel,
    promotionFocus: promotionFocus(components),
    safetyPolicy: 'recovery-protected',
  }
}

/**
 * Matchmaking can preserve some skill memory while the visible rank resets.
 * This value is deliberately separate from visible health rank.
 */
export function softResetHiddenRating(previous: number, center = 1500, retention = 0.55): number {
  const safeRetention = Math.max(0, Math.min(1, retention))
  return Math.round(center + (previous - center) * safeRetention)
}
