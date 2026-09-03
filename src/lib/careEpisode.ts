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
import type { CareEpisode, CareEpisodeStage, CareEpisodeStageId, CareEpisodeStageStatus, EMRRecord } from './types'

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

export function setProvider(episode: CareEpisode, facilityId: string): CareEpisode {
  const facility = HOSPITALS.find((h) => h.id === facilityId)
  if (!facility) return episode
  const now = new Date().toISOString()
  const stages = episode.stages.map((s): CareEpisodeStage =>
    s.stage === 'provider' && s.status === 'pending' ? { ...s, status: 'active', updatedAt: now } : s,
  )
  return { ...episode, facilityId, facilityName: facility.name, providerName: facility.name, stages, updatedAt: now }
}

export function setCostEstimate(
  episode: CareEpisode,
  input: { low?: number; high?: number; confidence: 'estimated' | 'verified'; source?: string },
): CareEpisode {
  const now = new Date().toISOString()
  const stages = episode.stages.map((s): CareEpisodeStage =>
    s.stage === 'cost' && s.status === 'pending' ? { ...s, status: 'active', updatedAt: now } : s,
  )
  return {
    ...episode,
    estimatedCostLow: input.low,
    estimatedCostHigh: input.high,
    costConfidence: input.confidence,
    costSource: input.source,
    stages,
    updatedAt: now,
  }
}
