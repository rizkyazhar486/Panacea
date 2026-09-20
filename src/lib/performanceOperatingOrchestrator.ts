/**
 * Panacea Performance Operating Orchestrator
 *
 * Canonical decision order:
 * Population Safety -> Objective Resilience -> Coaching -> Scientific Graphs
 */

import {
  evaluatePopulationSafety,
  type PopulationSafetyDecision,
  type PopulationSafetySignal,
} from './populationSafetyOS'
import {
  buildCoachingPlan,
  type CoachingPlan,
  type CoachingSignal,
} from './tacticalPerformanceCoach'
import {
  buildObservedPerformanceResilienceProfile,
  type ObservedPerformanceResilienceProfile,
  type PressureTrialObservation,
} from './performanceResilienceProfile'
import {
  listScientificGraphs,
  type ScientificGraphDefinition,
} from './universalSportOS'

export type PerformanceOperatingMode = 'safety-blocked' | 'safety-modified' | 'performance-enabled'

export interface PerformanceOperatingInput {
  sportId?: string
  safetySignals: readonly PopulationSafetySignal[]
  coachingSignals: readonly CoachingSignal[]
  resilienceTrials: readonly PressureTrialObservation[]
}

export interface PerformanceOperatingDecision {
  sportId?: string
  mode: PerformanceOperatingMode
  safety: PopulationSafetyDecision
  resilience: ObservedPerformanceResilienceProfile
  coaching: CoachingPlan
  scientificGraphs: readonly ScientificGraphDefinition[]
  nextActions: readonly string[]
  populationSafetyOverride: true
}

function suppressedCoachingPlan(sportId?: string, reason = 'Performance coaching is suppressed by the population-safety gate.'): CoachingPlan {
  return Object.freeze({
    sportId,
    actions: Object.freeze([]),
    dataCoverage: 0,
    confidence: 0,
    summary: reason,
    boundary:
      'Population safety overrides performance optimization. Coaching resumes only after the safety gate permits optimization.',
  })
}

export function buildPerformanceOperatingDecision(
  input: PerformanceOperatingInput,
): PerformanceOperatingDecision {
  const safety = evaluatePopulationSafety(input.safetySignals)
  const resilience = buildObservedPerformanceResilienceProfile(input.resilienceTrials)
  const scientificGraphs = input.sportId
    ? Object.freeze(listScientificGraphs(input.sportId))
    : Object.freeze([])

  let mode: PerformanceOperatingMode
  let coaching: CoachingPlan
  let nextActions: readonly string[]

  if (!safety.optimizePerformanceAllowed) {
    mode = safety.action === 'modify-activity' || safety.action === 'monitor'
      ? 'safety-modified'
      : 'safety-blocked'
    coaching = suppressedCoachingPlan(input.sportId)
    nextActions = safety.requiredNextSteps
  } else {
    mode = 'performance-enabled'
    coaching = buildCoachingPlan(input.coachingSignals, input.sportId)
    const firstHighPriority = coaching.actions.find((action) => action.priority === 'high-priority')
      ?? coaching.actions.find((action) => action.priority === 'develop')
      ?? coaching.actions[0]

    nextActions = firstHighPriority
      ? Object.freeze([
          firstHighPriority.title,
          ...firstHighPriority.procedure.slice(0, 3),
          `Reassess: ${firstHighPriority.reassess}`,
        ])
      : Object.freeze([
          'Continue safety monitoring and collect enough valid performance data for a coaching recommendation.',
        ])
  }

  return Object.freeze({
    sportId: input.sportId,
    mode,
    safety,
    resilience,
    coaching,
    scientificGraphs,
    nextActions,
    populationSafetyOverride: true,
  })
}

export const PERFORMANCE_OPERATING_POLICY = Object.freeze({
  populationSafetyAlwaysFirst: true as const,
  resilienceNeverOverridesSafety: true as const,
  coachingSuppressedWhenSafetyBlocks: true as const,
  scientificGraphsDoNotAuthorizeAction: true as const,
  recommendationsRequireValidSourceData: true as const,
})
