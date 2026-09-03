// The Care Episode Graph: the minimal structural piece that turns a single
// clinical plan (Planning.tsx) into a trackable end-to-end journey —
// problem -> diagnosis -> plan -> provider -> cost -> schedule -> treatment
// -> recovery -> follow-up -> outcome. See CareEpisode in ./types.
//
// Deliberately small: this is stage 1 of the white-space prototype
// (the "Care Episode" data model), not the full graph/marketplace/logistics
// system. It reuses the existing EMRRecord rather than adding a parallel
// store, per the "smallest architectural change" principle.

import type { CareEpisode, CareEpisodeStage, CareEpisodeStageId, CareEpisodeStageStatus } from './types'

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

export function formatCostRange(episode: CareEpisode): string | undefined {
  const { estimatedCostLow: lo, estimatedCostHigh: hi, currency = 'IDR' } = episode
  if (lo == null && hi == null) return undefined
  const fmt = (n: number) => n.toLocaleString('en-US')
  if (lo != null && hi != null && lo !== hi) return `${currency} ${fmt(lo)}–${fmt(hi)}`
  return `${currency} ${fmt(lo ?? hi ?? 0)}`
}
