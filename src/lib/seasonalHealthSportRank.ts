/**
 * Panacea Seasonal Health & Sport Rank Engine
 *
 * Competitive-game abstraction:
 * - one verified workout/effort is a "match"
 * - active calories are the base currency
 * - the AI-sized star reflects how demanding that energy cost was for this
 *   specific human, not how impressive one raw pace/power/load number looks
 * - visible rank resets every 3 calendar months
 *
 * Safety invariants:
 * - no calorie evidence -> no star (fail closed)
 * - body-size normalisation reduces raw-kcal bias
 * - very hard / low-recovery sessions never earn an unlimited multiplier
 * - every session is capped at 3 stars so grinding cannot dominate the ladder
 */

export type RankedMode = 'health' | 'sport'
export type RankTierId = 'master' | 'grandmaster' | 'epic' | 'legend' | 'mythic' | 'mythic-immortal'
export type EffortStarSize = 'spark' | 'standard' | 'large' | 'heroic' | 'legendary'

export interface RankTier {
  id: RankTierId
  label: string
  minStars: number
  accent: string
  glyph: string
}

export const RANK_TIERS: readonly RankTier[] = Object.freeze([
  { id: 'master', label: 'Master', minStars: 0, accent: 'from-slate-400 to-slate-200', glyph: '◆' },
  { id: 'grandmaster', label: 'Grandmaster', minStars: 8, accent: 'from-amber-500 to-yellow-200', glyph: '✦' },
  { id: 'epic', label: 'Epic', minStars: 20, accent: 'from-fuchsia-600 to-violet-300', glyph: '⬢' },
  { id: 'legend', label: 'Legend', minStars: 35, accent: 'from-orange-500 to-amber-200', glyph: '✧' },
  { id: 'mythic', label: 'Mythic', minStars: 55, accent: 'from-cyan-500 to-blue-300', glyph: '✺' },
  { id: 'mythic-immortal', label: 'Mythic Immortal', minStars: 80, accent: 'from-emerald-400 via-cyan-300 to-violet-400', glyph: '✹' },
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
  activeKcal?: number
  paceSecondsPerKm?: number
  speedKmh?: number
  avgHr?: number
  maxHr?: number
  rpe?: number
}

export interface RankedHealthEvidence {
  weightKg?: number
  restingHr?: number
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

export interface EffortStarComponents {
  energy: number
  personalDifficulty: number
  internalLoad: number
  progression: number
  recoveryProtection: number
  evidenceConfidence: number
}

export interface EffortStar {
  workoutId: string
  startedAt: string
  calories: number
  kcalPerKg: number
  stars: number
  size: EffortStarSize
  victoryScore: number
  components: EffortStarComponents
  rationale: readonly string[]
}

export interface RankComponents {
  consistency: number
  energy: number
  recovery: number
  progression: number
  evidence: number
}

export interface SeasonalRankResult {
  mode: RankedMode
  season: SeasonWindow
  stars: number
  score: number
  components: RankComponents
  effortWins: readonly EffortStar[]
  currentTier: RankTier
  nextTier: RankTier | null
  division: 'V' | 'IV' | 'III' | 'II' | 'I' | null
  progressToNext: number
  starsToNext: number
  eligibleWeeks: number
  workoutCount: number
  calorieVerifiedWorkoutCount: number
  evidenceLabel: 'insufficient' | 'limited' | 'moderate' | 'strong'
  promotionFocus: readonly string[]
  safetyPolicy: 'recovery-protected'
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))
const clampUnit = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
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
  return { id: `${year}-S${index}`, index, year, start, end, resetAt }
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

function median(values: readonly number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function roundedQuarter(value: number): number {
  return Math.round(value * 4) / 4
}

function starSize(stars: number): EffortStarSize {
  if (stars >= 2.5) return 'legendary'
  if (stars >= 1.75) return 'heroic'
  if (stars >= 1.25) return 'large'
  if (stars >= 0.75) return 'standard'
  return 'spark'
}

function rollingPerformanceModifier(
  workout: RankedWorkoutEvidence,
  previous: readonly RankedWorkoutEvidence[],
): { modifier: number; score: number; note: string } {
  const pace = typeof workout.paceSecondsPerKm === 'number' && workout.paceSecondsPerKm > 0
    ? workout.paceSecondsPerKm
    : null
  const speed = typeof workout.speedKmh === 'number' && workout.speedKmh > 0
    ? workout.speedKmh
    : null

  if (pace != null) {
    const baseline = median(previous
      .map((w) => w.paceSecondsPerKm)
      .filter((v): v is number => typeof v === 'number' && v > 0))
    if (!baseline || previous.length < 3) return { modifier: 1, score: 50, note: 'Pace context is still building.' }
    const improvement = (baseline - pace) / baseline
    return {
      modifier: clampUnit(1 + improvement * 1.5, 0.9, 1.1),
      score: clamp(50 + improvement * 500),
      note: improvement > 0.01 ? 'Performance improved versus your own recent baseline.' : 'Performance was compared with your own recent baseline.',
    }
  }

  if (speed != null) {
    const baseline = median(previous
      .map((w) => w.speedKmh)
      .filter((v): v is number => typeof v === 'number' && v > 0))
    if (!baseline || previous.length < 3) return { modifier: 1, score: 50, note: 'Speed context is still building.' }
    const improvement = (speed - baseline) / baseline
    return {
      modifier: clampUnit(1 + improvement * 1.5, 0.9, 1.1),
      score: clamp(50 + improvement * 500),
      note: improvement > 0.01 ? 'Performance improved versus your own recent baseline.' : 'Performance was compared with your own recent baseline.',
    }
  }

  return { modifier: 1, score: 50, note: 'No comparable pace/speed signal was available; no performance bonus was invented.' }
}

function recoveryProtection(health?: RankedHealthEvidence): { modifier: number; score: number; note: string } {
  const recovery = health?.recoveryPct
  if (typeof recovery !== 'number' || !Number.isFinite(recovery)) {
    return { modifier: 0.96, score: 50, note: 'Recovery context is missing, so the star is slightly confidence-limited.' }
  }
  const bounded = clamp(recovery)
  if (bounded < 35) return { modifier: 0.78, score: bounded, note: 'Low recovery suppresses reward; Panacea does not reward pushing through a red state.' }
  if (bounded < 55) return { modifier: 0.88, score: bounded, note: 'Reduced recovery limits the reward rather than making suffering more valuable.' }
  if (bounded < 75) return { modifier: 0.96, score: bounded, note: 'Moderate recovery keeps the effort valid without adding a bonus.' }
  return { modifier: 1, score: bounded, note: 'Recovery supported the effort; no extra multiplier is granted for simply being fresh.' }
}

function evidenceConfidence(
  workout: RankedWorkoutEvidence,
  health?: RankedHealthEvidence,
): number {
  let confidence = 0.48 // calories + duration are mandatory for any non-zero star
  if (typeof health?.weightKg === 'number' && health.weightKg > 0) confidence += 0.18
  if (typeof workout.rpe === 'number' && workout.rpe >= 1 && workout.rpe <= 10) confidence += 0.10
  if ((workout.paceSecondsPerKm ?? 0) > 0 || (workout.speedKmh ?? 0) > 0) confidence += 0.10
  if ((workout.avgHr ?? 0) > 0 || (workout.maxHr ?? 0) > 0) confidence += 0.06
  if (typeof health?.recoveryPct === 'number' || typeof health?.sleepHours === 'number') confidence += 0.08
  return clampUnit(confidence, 0, 1)
}

/**
 * Convert one real effort into a variable-size game star.
 *
 * Base energy:
 *   E = active_kcal / body_mass_kg
 *
 * Star mass:
 *   ★ = Q0.25[
 *     (E / 4 kcal·kg⁻¹)
 *     × D_personal
 *     × I_internal
 *     × P_progress
 *     × R_safe
 *     × C_evidence
 *   ]
 *
 * where C_evidence = 0.75 + 0.25 × evidenceConfidence.
 *
 * The 4 kcal/kg anchor makes roughly 280 kcal for a 70-kg person approximately
 * one base star before context modifiers. It is a game calibration constant,
 * not a medical threshold.
 */
export function calculateEffortStar(
  workout: RankedWorkoutEvidence,
  previous: readonly RankedWorkoutEvidence[],
  health?: RankedHealthEvidence,
): EffortStar {
  const calories = typeof workout.activeKcal === 'number' && Number.isFinite(workout.activeKcal) && workout.activeKcal > 0
    ? workout.activeKcal
    : 0

  if (calories <= 0 || !Number.isFinite(workout.durationMinutes) || workout.durationMinutes <= 0) {
    return {
      workoutId: workout.id,
      startedAt: workout.startedAt,
      calories: 0,
      kcalPerKg: 0,
      stars: 0,
      size: 'spark',
      victoryScore: 0,
      components: {
        energy: 0,
        personalDifficulty: 0,
        internalLoad: 0,
        progression: 0,
        recoveryProtection: 0,
        evidenceConfidence: 0,
      },
      rationale: Object.freeze(['No verified active-calorie evidence: no competitive star was awarded.']),
    }
  }

  const weightKnown = typeof health?.weightKg === 'number' && Number.isFinite(health.weightKg) && health.weightKg > 25
  const bodyWeight = weightKnown ? health!.weightKg! : 70
  const kcalPerKg = calories / bodyWeight
  const energyBase = clampUnit(kcalPerKg / 4, 0, 3)

  const previousEnergy = previous
    .filter((w) => typeof w.activeKcal === 'number' && w.activeKcal > 0)
    .map((w) => (w.activeKcal as number) / bodyWeight)
  const personalMedian = median(previousEnergy)
  const relativeEnergy = personalMedian && previousEnergy.length >= 3
    ? kcalPerKg / personalMedian
    : 1
  const personalDifficulty = clampUnit(0.9 + (relativeEnergy - 1) * 0.22, 0.78, 1.18)

  const rpe = typeof workout.rpe === 'number' && workout.rpe >= 1 && workout.rpe <= 10
    ? workout.rpe
    : null
  // RPE refines the estimate but is intentionally a small multiplier so people
  // are never encouraged to report maximal suffering to gain stars.
  const internalLoad = rpe == null ? 1 : clampUnit(0.94 + (rpe - 5) * 0.025, 0.88, 1.06)

  const progress = rollingPerformanceModifier(workout, previous)
  const recovery = recoveryProtection(health)
  const confidence = evidenceConfidence(workout, health)
  const confidenceMultiplier = 0.75 + confidence * 0.25

  const rawStars = energyBase
    * personalDifficulty
    * internalLoad
    * progress.modifier
    * recovery.modifier
    * confidenceMultiplier

  const stars = clampUnit(roundedQuarter(rawStars), 0, 3)
  const energyScore = clamp((energyBase / 2) * 100)
  const personalScore = clamp(((personalDifficulty - 0.78) / (1.18 - 0.78)) * 100)
  const internalScore = rpe == null ? 50 : clamp(rpe * 10)
  const victoryScore = clamp((stars / 3) * 100)

  const rationale = [
    `${Math.round(calories)} active kcal became ${kcalPerKg.toFixed(1)} kcal/kg ${weightKnown ? 'using your recorded body mass' : 'using a provisional 70-kg reference because body mass is missing'}.`,
    previousEnergy.length >= 3
      ? `Energy demand was ${Math.round(relativeEnergy * 100)}% of your recent personal median.`
      : 'The personal energy baseline is still building; no novelty bonus was invented.',
    progress.note,
    recovery.note,
    `Evidence confidence: ${Math.round(confidence * 100)}%.`,
  ]

  return {
    workoutId: workout.id,
    startedAt: workout.startedAt,
    calories,
    kcalPerKg,
    stars,
    size: starSize(stars),
    victoryScore,
    components: {
      energy: energyScore,
      personalDifficulty: personalScore,
      internalLoad: internalScore,
      progression: progress.score,
      recoveryProtection: recovery.score,
      evidenceConfidence: confidence * 100,
    },
    rationale: Object.freeze(rationale),
  }
}

function buildEffortWins(
  workouts: readonly RankedWorkoutEvidence[],
  health?: RankedHealthEvidence,
): readonly EffortStar[] {
  const sorted = [...workouts].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt))
  return Object.freeze(sorted.map((workout, index) => calculateEffortStar(workout, sorted.slice(0, index), health)))
}

function recoveryScore(health?: RankedHealthEvidence, season?: SeasonWindow): number {
  if (!health) return 50
  const history = (health.history ?? []).filter((x) => {
    if (!season) return true
    const d = validDate(x.date)
    return !!d && d >= season.start && d < season.resetAt
  })
  const values = history
    .map((x) => x.recoveryPct)
    .filter((x): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 100)
  if (values.length >= 3) return clamp(values.reduce((a, b) => a + b, 0) / values.length)
  if (typeof health.recoveryPct === 'number' && Number.isFinite(health.recoveryPct)) return clamp(health.recoveryPct)

  const sleepValues = history
    .map((x) => x.sleepH)
    .filter((x): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0)
  const sleep = sleepValues.length
    ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length
    : health.sleepHours
  if (typeof sleep !== 'number' || !Number.isFinite(sleep) || sleep <= 0) return 50
  if (sleep >= 7 && sleep <= 9) return 100
  return clamp(100 - Math.min(Math.abs(sleep < 7 ? 7 - sleep : sleep - 9), 4) * 20)
}

function rankTierForStars(stars: number): RankTier {
  let tier = RANK_TIERS[0]
  for (const candidate of RANK_TIERS) {
    if (stars >= candidate.minStars) tier = candidate
  }
  return tier
}

function divisionFor(stars: number, tier: RankTier, next: RankTier | null): 'V' | 'IV' | 'III' | 'II' | 'I' | null {
  if (!next) return null
  const span = Math.max(0.25, next.minStars - tier.minStars)
  const p = clamp(((stars - tier.minStars) / span) * 100)
  if (p < 20) return 'V'
  if (p < 40) return 'IV'
  if (p < 60) return 'III'
  if (p < 80) return 'II'
  return 'I'
}

function promotionFocus(components: RankComponents): readonly string[] {
  const labels: Array<[keyof RankComponents, string]> = [
    ['consistency', 'Build a safer, repeatable rhythm instead of chasing one giant workout.'],
    ['energy', 'Accumulate verified active-energy efforts; calories without source evidence do not count competitively.'],
    ['recovery', 'Protect sleep/recovery; a red recovery state suppresses reward rather than making suffering valuable.'],
    ['progression', 'Repeat comparable efforts so improvement can be judged against your own baseline.'],
    ['evidence', 'Connect richer source data so the AI can size each star with higher confidence.'],
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

  const effortWins = buildEffortWins(workouts, input.health)
  const stars = roundedQuarter(effortWins.reduce((sum, effort) => sum + effort.stars, 0))
  const calorieVerifiedWorkoutCount = effortWins.filter((effort) => effort.calories > 0).length
  const elapsedWeeks = Math.max(1, Math.min(13, Math.ceil((now.getTime() - season.start.getTime() + 1) / WEEK_MS)))

  const activeDays = new Set(workouts
    .map((w) => workoutDate(w))
    .filter((d): d is Date => !!d)
    .map((d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)).size
  const consistency = clamp((activeDays / (elapsedWeeks * 4)) * 100)

  const energy = calorieVerifiedWorkoutCount
    ? clamp((stars / Math.max(1, elapsedWeeks * 6)) * 100)
    : 0
  const recovery = recoveryScore(input.health, season)
  const progressionValues = effortWins
    .filter((effort) => effort.stars > 0)
    .map((effort) => effort.components.progression)
  const progression = progressionValues.length
    ? progressionValues.reduce((a, b) => a + b, 0) / progressionValues.length
    : 0
  const evidenceValues = effortWins
    .filter((effort) => effort.calories > 0)
    .map((effort) => effort.components.evidenceConfidence)
  const evidence = evidenceValues.length
    ? evidenceValues.reduce((a, b) => a + b, 0) / evidenceValues.length
    : 0

  const components: RankComponents = { consistency, energy, recovery, progression, evidence }
  const scoreWeights = mode === 'health'
    ? { consistency: 0.20, energy: 0.25, recovery: 0.25, progression: 0.10, evidence: 0.20 }
    : { consistency: 0.15, energy: 0.30, recovery: 0.15, progression: 0.20, evidence: 0.20 }
  const score = Object.entries(scoreWeights).reduce(
    (sum, [key, weight]) => sum + components[key as keyof RankComponents] * weight,
    0,
  )

  const currentTier = rankTierForStars(stars)
  const tierIndex = RANK_TIERS.findIndex((tier) => tier.id === currentTier.id)
  const nextTier = RANK_TIERS[tierIndex + 1] ?? null
  const division = divisionFor(stars, currentTier, nextTier)
  const progressToNext = nextTier
    ? clamp(((stars - currentTier.minStars) / Math.max(0.25, nextTier.minStars - currentTier.minStars)) * 100)
    : 100
  const starsToNext = nextTier ? Math.max(0, roundedQuarter(nextTier.minStars - stars)) : 0
  const evidenceLabel: SeasonalRankResult['evidenceLabel'] =
    evidence < 35 ? 'insufficient' : evidence < 55 ? 'limited' : evidence < 75 ? 'moderate' : 'strong'

  return {
    mode,
    season,
    stars,
    score: Math.round(score),
    components,
    effortWins,
    currentTier,
    nextTier,
    division,
    progressToNext,
    starsToNext,
    eligibleWeeks: elapsedWeeks,
    workoutCount: workouts.length,
    calorieVerifiedWorkoutCount,
    evidenceLabel,
    promotionFocus: promotionFocus(components),
    safetyPolicy: 'recovery-protected',
  }
}

/**
 * Clan contribution is star mass, not raw calories. A daily cap prevents one
 * high-volume member from overwhelming the whole clan.
 */
export function clanStarContribution(efforts: readonly EffortStar[], dailyCap = 4): number {
  const byDay = new Map<string, number>()
  for (const effort of efforts) {
    if (effort.stars <= 0) continue
    const d = validDate(effort.startedAt)
    if (!d) continue
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    byDay.set(key, Math.min(dailyCap, (byDay.get(key) ?? 0) + effort.stars))
  }
  return roundedQuarter([...byDay.values()].reduce((sum, value) => sum + value, 0))
}

/**
 * Matchmaking can preserve some skill memory while visible stars reset.
 */
export function softResetHiddenRating(previous: number, center = 1500, retention = 0.55): number {
  const safeRetention = Math.max(0, Math.min(1, retention))
  return Math.round(center + (previous - center) * safeRetention)
}
