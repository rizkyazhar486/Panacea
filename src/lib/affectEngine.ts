/**
 * Panacea Affect Engine
 *
 * A bounded UX-state engine for anticipation -> effort -> peak -> release ->
 * recognition -> gratitude -> calm.
 *
 * IMPORTANT:
 * - This does NOT infer, measure or manipulate dopamine, oxytocin, cortisol,
 *   testosterone or any other hormone/neurotransmitter.
 * - "Reward" and "arousal" here are interaction-design abstractions only.
 * - Engagement telemetry must never be promoted into suicide/self-harm risk;
 *   explicit mental-health safety continues to live in mentalHealthSafety.ts.
 * - No variable-ratio gambling mechanic: reward intensity is deterministic,
 *   inspectable and decreases when compulsion risk rises.
 */

export type AffectPhase =
  | 'curiosity'
  | 'anticipation'
  | 'effort'
  | 'peak'
  | 'release'
  | 'recognition'
  | 'gratitude'
  | 'calm'

export type AffectTrigger =
  | 'feed'
  | 'effort'
  | 'achievement'
  | 'match'
  | 'recognition'
  | 'loss'
  | 'gratitude'
  | 'return'

export type AffectEventType =
  | 'feed_reveal'
  | 'mode_switch'
  | 'social_reaction'
  | 'social_reveal'
  | 'achievement_view'
  | 'match_view'
  | 'gratitude'
  | 'pause'
  | 'return'

export interface AffectInputs {
  trigger: AffectTrigger
  rewardObserved?: number
  expectedReward?: number
  nextStateValue?: number
  personalEffort?: number
  personalMeaning?: number
  socialRelevance?: number
  evidenceConfidence?: number
  lossStreak?: number
  rapidLoops?: number
  sessionMinutes?: number
  recoveryPct?: number
  explicitNegativeAffect?: number
  gratitudeCompleted?: boolean
  recentPeak?: boolean
}

export interface AffectDecision {
  phase: AffectPhase
  predictionError: number
  positiveSurprise: number
  affectiveImpact: number
  compulsionRisk: number
  rewardIntensity: number
  noveltyBudget: number
  shouldOfferPause: boolean
  shouldThrottleDiscovery: boolean
  shouldPromptGratitude: boolean
  cooldownMinutes: number
  policy: 'meaning-over-compulsion'
  hormoneClaim: 'none'
}

export interface AffectEvent {
  type: AffectEventType
  at: string
  value?: number
}

export interface AffectSessionSummary {
  sessionMinutes: number
  rapidLoops: number
  reactions: number
  reveals: number
  gratitudeCompleted: boolean
}

const EVENT_KEY = 'pmd_affect_events_v1'
const SESSION_KEY = 'pmd_affect_session_started_v1'
const MAX_EVENTS = 200
const MINUTE_MS = 60_000

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
const safe = (value: number | undefined, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

function normalizedLossStreak(value = 0) {
  return clamp01(Math.max(0, value) / 3)
}

function normalizedRapidLoops(value = 0) {
  return clamp01(Math.max(0, value) / 12)
}

function normalizedSession(value = 0) {
  return clamp01(Math.max(0, value) / 45)
}

function recoveryRisk(recoveryPct?: number) {
  if (typeof recoveryPct !== 'number' || !Number.isFinite(recoveryPct)) return 0
  return clamp01((60 - recoveryPct) / 60)
}

function selectPhase(
  input: AffectInputs,
  compulsionRisk: number,
  rewardIntensity: number,
): AffectPhase {
  if (input.gratitudeCompleted || input.trigger === 'gratitude') return 'calm'
  if (compulsionRisk >= 0.65 || safe(input.sessionMinutes, 0) >= 60) return 'calm'
  if (input.recentPeak) return 'release'
  if (input.trigger === 'recognition') return 'recognition'
  if (input.trigger === 'match') return rewardIntensity >= 0.45 ? 'peak' : 'anticipation'
  if (input.trigger === 'achievement') return rewardIntensity >= 0.45 ? 'peak' : 'recognition'
  if (input.trigger === 'effort') return 'effort'
  if (input.trigger === 'loss') return 'anticipation'
  if (input.trigger === 'return') return 'curiosity'
  return rewardIntensity >= 0.60 ? 'anticipation' : 'curiosity'
}

/**
 * Temporal-difference style reward prediction error:
 *   delta = r + gamma * V(next) - V(expected)
 *
 * This is used only as an inspectable UX salience signal.
 */
export function deriveAffectDecision(input: AffectInputs): AffectDecision {
  const rewardObserved = clamp01(safe(input.rewardObserved, 0))
  const expectedReward = clamp01(safe(input.expectedReward, 0.45))
  const nextStateValue = clamp01(safe(input.nextStateValue, 0.5))
  const gamma = 0.85
  const predictionError = Math.max(-1, Math.min(1, rewardObserved + gamma * nextStateValue - expectedReward))
  const positiveSurprise = Math.max(0, predictionError)

  const effort = clamp01(safe(input.personalEffort, 0.5))
  const meaning = clamp01(safe(input.personalMeaning, 0.5))
  const social = clamp01(safe(input.socialRelevance, 0.3))
  const confidence = clamp01(safe(input.evidenceConfidence, 0.6))

  // N = positive surprise × bounded effort × meaning × social × confidence.
  // Floors prevent any single absent signal from collapsing the UX state.
  const affectiveImpact = clamp01(
    positiveSurprise
      * (0.35 + 0.65 * effort)
      * (0.40 + 0.60 * meaning)
      * (0.50 + 0.50 * social)
      * (0.50 + 0.50 * confidence),
  )

  const compulsionRisk = clamp01(
    0.30 * normalizedLossStreak(input.lossStreak)
      + 0.25 * normalizedRapidLoops(input.rapidLoops)
      + 0.20 * normalizedSession(input.sessionMinutes)
      + 0.15 * recoveryRisk(input.recoveryPct)
      + 0.10 * clamp01(safe(input.explicitNegativeAffect, 0)),
  )

  // Reward output is actively damped as compulsion risk rises.
  const rewardIntensity = clamp01(affectiveImpact * (1 - 0.75 * compulsionRisk))
  const noveltyBudget = clamp01(
    1
      - 0.70 * compulsionRisk
      - 0.20 * normalizedSession(input.sessionMinutes)
      - 0.10 * recoveryRisk(input.recoveryPct),
  )

  const shouldOfferPause = compulsionRisk >= 0.45 || safe(input.sessionMinutes, 0) >= 25
  const shouldThrottleDiscovery = compulsionRisk >= 0.70 || safe(input.sessionMinutes, 0) >= 60
  const shouldPromptGratitude =
    !input.gratitudeCompleted
    && (input.trigger === 'achievement' || input.trigger === 'match' || input.trigger === 'recognition')
  const cooldownMinutes = compulsionRisk >= 0.75 ? 20 : compulsionRisk >= 0.55 ? 10 : 0

  return Object.freeze({
    phase: selectPhase(input, compulsionRisk, rewardIntensity),
    predictionError,
    positiveSurprise,
    affectiveImpact,
    compulsionRisk,
    rewardIntensity,
    noveltyBudget,
    shouldOfferPause,
    shouldThrottleDiscovery,
    shouldPromptGratitude,
    cooldownMinutes,
    policy: 'meaning-over-compulsion',
    hormoneClaim: 'none',
  })
}

function readEvents(): AffectEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(EVENT_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((event): event is AffectEvent =>
      !!event
      && typeof event.type === 'string'
      && typeof event.at === 'string'
      && Number.isFinite(Date.parse(event.at)),
    ).slice(-MAX_EVENTS)
  } catch {
    return []
  }
}

function sessionStarted(nowMs: number) {
  if (typeof window === 'undefined') return nowMs
  try {
    const stored = Number(window.sessionStorage.getItem(SESSION_KEY))
    if (Number.isFinite(stored) && stored > 0 && stored <= nowMs) return stored
    window.sessionStorage.setItem(SESSION_KEY, String(nowMs))
  } catch { /* privacy/storage restricted */ }
  return nowMs
}

export function recordAffectEvent(type: AffectEventType, value?: number, now = new Date()) {
  if (typeof window === 'undefined') return
  const events = readEvents()
  events.push({
    type,
    at: now.toISOString(),
    value: typeof value === 'number' && Number.isFinite(value) ? value : undefined,
  })
  try {
    window.localStorage.setItem(EVENT_KEY, JSON.stringify(events.slice(-MAX_EVENTS)))
    window.dispatchEvent(new CustomEvent('panacea-affect-event', { detail: { type } }))
  } catch { /* best-effort local telemetry only */ }
}

export function summarizeAffectSession(now = new Date()): AffectSessionSummary {
  const nowMs = now.getTime()
  const started = sessionStarted(nowMs)
  const sessionMinutes = Math.max(0, (nowMs - started) / MINUTE_MS)
  const recentWindow = nowMs - 5 * MINUTE_MS
  const sessionEvents = readEvents().filter((event) => Date.parse(event.at) >= started)
  const recent = sessionEvents.filter((event) => Date.parse(event.at) >= recentWindow)
  const reveals = recent.filter((event) =>
    event.type === 'feed_reveal' || event.type === 'social_reveal' || event.type === 'mode_switch',
  ).length
  const reactions = recent.filter((event) => event.type === 'social_reaction').length

  return Object.freeze({
    sessionMinutes,
    rapidLoops: reveals + reactions,
    reactions,
    reveals,
    gratitudeCompleted: sessionEvents.some((event) => event.type === 'gratitude'),
  })
}

export function resetAffectSession(now = new Date()) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SESSION_KEY, String(now.getTime()))
    window.dispatchEvent(new CustomEvent('panacea-affect-event', { detail: { type: 'return' } }))
  } catch { /* ignore */ }
}
