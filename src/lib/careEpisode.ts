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
// next?" — the first stage that isn't done yet. Blocked stages take
// priority since they're what's actually stalling the journey.
export function nextStage(episode: CareEpisode): CareEpisodeStage | undefined {
  return (
    episode.stages.find((s) => s.status === 'blocked') ??
    episode.stages.find((s) => s.status === 'active') ??
    episode.stages.find((s) => s.status === 'pending')
  )
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
  // Moving a stage to 'done' activates the next pending stage automatically,
  // so the journey keeps advancing without manual bookkeeping.
  const idx = CARE_EPISODE_STAGES.indexOf(stage)
  if (status === 'done' && idx >= 0 && idx + 1 < stages.length && stages[idx + 1].status === 'pending') {
    stages[idx + 1] = { ...stages[idx + 1], status: 'active' }
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
