// The Care Episode Graph: the minimal structural piece that turns a single
// clinical plan (Planning.tsx) into a trackable end-to-end journey —
// problem -> diagnosis -> plan -> provider -> cost -> schedule -> treatment
// -> recovery -> follow-up -> outcome. See CareEpisode in ./types.
//
// Deliberately small: this is stage 1 of the white-space prototype
// (the "Care Episode" data model), not the full graph/marketplace/logistics
// system. It reuses the existing EMRRecord rather than adding a parallel
// store, per the "smallest architectural change" principle.

import { HOSPITALS, type Hospital } from './hospitals'
import type {
  CareEpisode,
  CareEpisodeStage,
  CareEpisodeStageId,
  CareEpisodeStageStatus,
  CostItem,
  EMRRecord,
  ProviderCandidate,
} from './types'

export const CARE_EPISODE_STAGES: CareEpisodeStageId[] = [
  'problem',
  'diagnosis',
  'plan',
  'provider',
  'cost',
  'schedule',
  'treatment',
  'recovery',
  'followUp',
  'outcome',
]

// Real care journeys aren't strictly linear: recovery and follow-up both
// start once treatment is done, and can proceed independently of each
// other — a patient can complete physiotherapy before their follow-up
// appointment happens, or vice versa. This map is the source of truth for
// activation order; CARE_EPISODE_STAGES above stays a flat list purely for
// display order. Every stage not listed here depends on the one before it.
const STAGE_DEPENDENCIES: Partial<Record<CareEpisodeStageId, CareEpisodeStageId[]>> = {
  recovery: ['treatment'],
  followUp: ['treatment'],
  outcome: ['recovery', 'followUp'],
}

function dependenciesOf(stage: CareEpisodeStageId): CareEpisodeStageId[] {
  const explicit = STAGE_DEPENDENCIES[stage]
  if (explicit) return explicit
  const idx = CARE_EPISODE_STAGES.indexOf(stage)
  return idx > 0 ? [CARE_EPISODE_STAGES[idx - 1]] : []
}

export const STAGE_LABEL: Record<CareEpisodeStageId, string> = {
  problem: 'Problem',
  diagnosis: 'Diagnosis',
  plan: 'Plan',
  provider: 'Provider',
  cost: 'Cost',
  schedule: 'Schedule',
  treatment: 'Treatment',
  recovery: 'Recovery',
  followUp: 'Follow-up',
  outcome: 'Outcome',
}

export const STATUS_LABEL: Record<CareEpisodeStageStatus, string> = {
  pending: 'Pending',
  active: 'In progress',
  done: 'Done',
  blocked: 'Blocked',
}

export function newCareEpisode(title: string, problemId?: string): CareEpisode {
  const now = new Date().toISOString()
  return {
    id: `ce_${Math.random().toString(36).slice(2, 10)}`,
    title,
    createdAt: now,
    updatedAt: now,
    problemId,
    currency: 'IDR',
    stages: CARE_EPISODE_STAGES.map((stage, i): CareEpisodeStage => ({
      stage,
      status: i === 0 ? 'active' : 'pending',
      updatedAt: i === 0 ? now : undefined,
    })),
  }
}

// The single most useful thing this graph can answer: "what should happen
// next?" — every stage that's currently actionable. Since recovery and
// follow-up can run in parallel, this can return more than one stage at a
// time; blocked stages are listed first since they're what's actually
// stalling the journey.
export function nextStages(episode: CareEpisode): CareEpisodeStage[] {
  const blocked = episode.stages.filter((s) => s.status === 'blocked')
  const active = episode.stages.filter((s) => s.status === 'active')
  if (blocked.length || active.length) return [...blocked, ...active]
  const pending = episode.stages.find((s) => s.status === 'pending')
  return pending ? [pending] : []
}

export function isComplete(episode: CareEpisode): boolean {
  return episode.stages.every((s) => s.status === 'done')
}

export function setStageStatus(
  episode: CareEpisode,
  stage: CareEpisodeStageId,
  status: CareEpisodeStageStatus,
  extra?: { note?: string; blockedReason?: string },
): CareEpisode {
  const now = new Date().toISOString()
  const stages = episode.stages.map((s): CareEpisodeStage =>
    s.stage === stage
      ? {
          ...s,
          status,
          note: extra?.note ?? s.note,
          blockedReason: status === 'blocked' ? extra?.blockedReason ?? s.blockedReason : undefined,
          updatedAt: now,
        }
      : s,
  )
  // Moving a stage to 'done' activates every pending stage whose
  // dependencies are now all satisfied — not just the next one in display
  // order, so parallel branches (recovery + follow-up) both switch on as
  // soon as treatment finishes, independently of each other from then on.
  if (status === 'done') {
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i]
      if (s.status !== 'pending') continue
      const deps = dependenciesOf(s.stage)
      if (deps.every((dep) => stages.find((x) => x.stage === dep)?.status === 'done')) {
        stages[i] = { ...s, status: 'active' }
      }
    }
  }
  return { ...episode, stages, updatedAt: now }
}

// The moment a doctor verifies a plan item, the journey has already left
// "planning" and entered the real world — the problem and diagnosis are
// settled, and the plan itself is now underway (not finished — there may
// be more items to verify yet, which is why 'plan' is left active rather
// than done). This finds-or-creates the matching episode from the record's
// primaryDiagnosis and fast-forwards it to that point, so the patient
// doesn't have to start a journey by hand for something that's already
// begun. Returns the record unchanged if there's no primary diagnosis yet,
// or if it's already been seeded once.
export function ensureEpisodeFromVerifiedPlan(record: EMRRecord): EMRRecord {
  const dx = record.primaryDiagnosis
  if (!dx) return record
  const episodes = record.careEpisodes ?? []
  if (episodes.some((e) => e.diagnosisCode === dx.code)) return record

  let episode = newCareEpisode(dx.title)
  episode = { ...episode, diagnosisCode: dx.code, problemId: record.problems[0]?.id }
  episode = setStageStatus(episode, 'problem', 'done')
  episode = setStageStatus(episode, 'diagnosis', 'done') // cascades 'plan' to active

  return { ...record, careEpisodes: [...episodes, episode] }
}

export function formatCostRange(episode: CareEpisode): string | undefined {
  const { estimatedCostLow: lo, estimatedCostHigh: hi, currency = 'IDR' } = episode
  if (lo == null && hi == null) return undefined
  const fmt = (n: number) => n.toLocaleString('en-US')
  const range = lo != null && hi != null && lo !== hi ? `${currency} ${fmt(lo)}–${fmt(hi)}` : `${currency} ${fmt(lo ?? hi ?? 0)}`
  return episode.costConfidence === 'verified' ? range : `~${range}`
}

// Real facility directory the Provider stage picks from (see lib/hospitals.ts)
// — never a made-up name. The Cost stage stays a manual entry: this app has
// no real price feed to wire in yet, so making up a number would violate the
// "never fabricate prices" rule. What CAN be enforced instead is provenance:
// every cost figure must carry a confidence level and, ideally, a source.
export function providerOptions(): Hospital[] {
  return HOSPITALS
}

function activate(episode: CareEpisode, stage: CareEpisodeStageId): CareEpisodeStage[] {
  const now = new Date().toISOString()
  return episode.stages.map((s): CareEpisodeStage =>
    s.stage === stage && s.status === 'pending' ? { ...s, status: 'active', updatedAt: now } : s,
  )
}

export function setProvider(episode: CareEpisode, facilityId: string): CareEpisode {
  const facility = HOSPITALS.find((h) => h.id === facilityId)
  if (!facility) return episode
  return {
    ...episode,
    facilityId,
    facilityName: facility.name,
    providerName: facility.name,
    stages: activate(episode, 'provider'),
    updatedAt: new Date().toISOString(),
  }
}

export function setCostEstimate(
  episode: CareEpisode,
  input: { low?: number; high?: number; confidence: 'estimated' | 'verified'; source?: string },
): CareEpisode {
  return {
    ...episode,
    estimatedCostLow: input.low,
    estimatedCostHigh: input.high,
    costConfidence: input.confidence,
    costSource: input.source,
    stages: activate(episode, 'cost'),
    updatedAt: new Date().toISOString(),
  }
}

// Total Cost of Care: don't show only the professional fee. Break the real
// cost into its actual components and let the total be their sum, not a
// separate guess — see CareEpisode.costItems in ./types.
export const COST_ITEM_PRESETS = [
  'Professional fee',
  'Facility/room',
  'Laboratory',
  'Imaging',
  'Medication',
  'Transportation',
  'Follow-up',
] as const

function recomputeFromItems(episode: CareEpisode): CareEpisode {
  const items = episode.costItems ?? []
  const withLow = items.filter((i) => i.low != null)
  const withHigh = items.filter((i) => i.high != null)
  const low = withLow.length ? withLow.reduce((sum, i) => sum + (i.low ?? 0), 0) : undefined
  const high = withHigh.length ? withHigh.reduce((sum, i) => sum + (i.high ?? 0), 0) : undefined
  const priced = items.filter((i) => i.low != null || i.high != null)
  const confidence: 'estimated' | 'verified' =
    priced.length > 0 && priced.every((i) => i.confidence === 'verified') ? 'verified' : 'estimated'
  return {
    ...episode,
    estimatedCostLow: low,
    estimatedCostHigh: high,
    costConfidence: confidence,
    costSource: `${priced.length} of ${items.length} component${items.length === 1 ? '' : 's'} priced`,
    stages: activate(episode, 'cost'),
    updatedAt: new Date().toISOString(),
  }
}

export function addCostItem(episode: CareEpisode, label: string): CareEpisode {
  const item: CostItem = { id: `ci_${Math.random().toString(36).slice(2, 10)}`, label }
  return recomputeFromItems({ ...episode, costItems: [...(episode.costItems ?? []), item] })
}

export function updateCostItem(episode: CareEpisode, id: string, patch: Partial<CostItem>): CareEpisode {
  const costItems = (episode.costItems ?? []).map((i) => (i.id === id ? { ...i, ...patch } : i))
  return recomputeFromItems({ ...episode, costItems })
}

export function removeCostItem(episode: CareEpisode, id: string): CareEpisode {
  const costItems = (episode.costItems ?? []).filter((i) => i.id !== id)
  return recomputeFromItems({ ...episode, costItems })
}

// Provider comparison: the patient adds a few real facilities as candidates,
// enters what each one quoted (or an estimate, tagged as such), compares
// them side by side by distance/rating/price, then picks one — instead of
// jumping straight to a single provider with no visibility into alternatives.

export interface CandidateView extends ProviderCandidate {
  facility: Hospital
}

// Sorted by distance — the one thing that's always real and comparable even
// before any price has been entered.
export function candidateViews(episode: CareEpisode): CandidateView[] {
  return (episode.candidates ?? [])
    .map((c) => ({ ...c, facility: HOSPITALS.find((h) => h.id === c.facilityId) }))
    .filter((c): c is CandidateView => !!c.facility)
    .sort((a, b) => a.facility.distanceKm - b.facility.distanceKm)
}

export function addCandidate(episode: CareEpisode, facilityId: string): CareEpisode {
  const candidates = episode.candidates ?? []
  if (candidates.some((c) => c.facilityId === facilityId)) return episode
  return { ...episode, candidates: [...candidates, { facilityId }], updatedAt: new Date().toISOString() }
}

export function removeCandidate(episode: CareEpisode, facilityId: string): CareEpisode {
  return {
    ...episode,
    candidates: (episode.candidates ?? []).filter((c) => c.facilityId !== facilityId),
    updatedAt: new Date().toISOString(),
  }
}

export function updateCandidateCost(
  episode: CareEpisode,
  facilityId: string,
  cost: { low?: number; high?: number; confidence: 'estimated' | 'verified'; source?: string },
): CareEpisode {
  const candidates = (episode.candidates ?? []).map((c): ProviderCandidate =>
    c.facilityId === facilityId
      ? { ...c, estimatedCostLow: cost.low, estimatedCostHigh: cost.high, costConfidence: cost.confidence, costSource: cost.source }
      : c,
  )
  return { ...episode, candidates, updatedAt: new Date().toISOString() }
}

// Picking a candidate promotes it to the episode's actual provider + cost —
// the comparison is over, this is the choice.
export function chooseCandidate(episode: CareEpisode, facilityId: string): CareEpisode {
  const candidate = (episode.candidates ?? []).find((c) => c.facilityId === facilityId)
  let next = setProvider(episode, facilityId)
  if (candidate) {
    next = setCostEstimate(next, {
      low: candidate.estimatedCostLow,
      high: candidate.estimatedCostHigh,
      confidence: candidate.costConfidence ?? 'estimated',
      source: candidate.costSource,
    })
  }
  return next
}

// Care failure detection: there's no real scheduling/reminder data to check
// a stage against ("did the patient miss their 2pm appointment?"), so this
// doesn't pretend to know that. What IS real: every stage's `updatedAt` is
// the timestamp it actually became active, and how long a step like
// "choose a provider" or "have the surgery" should reasonably take is a
// fact about the step itself, not the patient. Comparing the two — genuine
// elapsed time against a stated expectation — is an honest stall signal,
// distinct from a "blocked" stage the patient or clinician marked by hand.
export const STAGE_EXPECTED_DAYS: Record<CareEpisodeStageId, number> = {
  problem: 1,
  diagnosis: 2,
  plan: 3,
  provider: 5,
  cost: 5,
  schedule: 7,
  treatment: 21,
  recovery: 21,
  followUp: 21,
  outcome: 14,
}

export type StallSeverity = 'watch' | 'stalled'

export interface StageStall {
  stage: CareEpisodeStageId
  daysSinceUpdate: number
  expectedDays: number
  severity: StallSeverity
}

// Only 'active' stages can stall — 'blocked' already says why it's stuck,
// 'pending'/'done' aren't in motion. 'watch' at 70% of the expected time,
// 'stalled' past 100%, so the UI can warn before it's actually a problem.
export function detectStalls(episode: CareEpisode, now: Date = new Date()): StageStall[] {
  const out: StageStall[] = []
  for (const s of episode.stages) {
    if (s.status !== 'active' || !s.updatedAt) continue
    const daysSinceUpdate = (now.getTime() - new Date(s.updatedAt).getTime()) / 86_400_000
    const expectedDays = STAGE_EXPECTED_DAYS[s.stage]
    if (daysSinceUpdate >= expectedDays) out.push({ stage: s.stage, daysSinceUpdate, expectedDays, severity: 'stalled' })
    else if (daysSinceUpdate >= expectedDays * 0.7) out.push({ stage: s.stage, daysSinceUpdate, expectedDays, severity: 'watch' })
  }
  return out
}

export type EpisodeHealth = 'on_track' | 'at_risk' | 'stalled'

export function episodeHealth(episode: CareEpisode): EpisodeHealth {
  if (isComplete(episode)) return 'on_track'
  if (episode.stages.some((s) => s.status === 'blocked')) return 'stalled'
  const stalls = detectStalls(episode)
  if (stalls.some((s) => s.severity === 'stalled')) return 'stalled'
  if (stalls.length > 0) return 'at_risk'
  return 'on_track'
}

export function stallReason(stall: StageStall): string {
  const days = Math.floor(stall.daysSinceUpdate)
  const verb = stall.severity === 'stalled' ? 'No update in' : 'Been open'
  return `${verb} ${days} day${days === 1 ? '' : 's'} on ${STAGE_LABEL[stall.stage]} — usually takes about ${stall.expectedDays} day${stall.expectedDays === 1 ? '' : 's'}.`
}
