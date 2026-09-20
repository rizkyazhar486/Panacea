/**
 * Panacea Population Safety OS
 *
 * Highest-priority safety gate shared by sport, tactical performance,
 * environment, rescue and event-operation layers.
 *
 * Policy hierarchy:
 * 1) life safety and emergency escalation
 * 2) participant / buddy / team / bystander protection
 * 3) location, communications and data integrity
 * 4) consent / privacy
 * 5) performance optimization
 *
 * This module consumes already-classified safety signals from authoritative or
 * validated upstream adapters. It does not invent medical diagnoses or venue
 * hazard thresholds.
 */

export type PopulationSafetyDomain =
  | 'medical-emergency'
  | 'heat-weather'
  | 'crowd-venue'
  | 'water-marine'
  | 'aviation'
  | 'motorsport'
  | 'missing-person'
  | 'communications'
  | 'location-integrity'
  | 'data-integrity'
  | 'privacy-consent'
  | 'infectious-disease'
  | 'general'

export type SafetySeverity = 'info' | 'caution' | 'high' | 'critical' | 'unknown'

export type SafetyAction =
  | 'continue'
  | 'monitor'
  | 'modify-activity'
  | 'suspend-activity'
  | 'stop-and-escalate'

export interface PopulationSafetySignal {
  id: string
  domain: PopulationSafetyDomain
  severity: SafetySeverity
  source: string
  capturedAt: string
  confidence: number
  affectedScope: 'individual' | 'team' | 'venue' | 'route' | 'population'
  rationale: string
  authoritativeClassification: boolean
}

export interface PopulationSafetyDecision {
  action: SafetyAction
  optimizePerformanceAllowed: boolean
  highestSeverity: SafetySeverity
  confidence: number
  signalIds: readonly string[]
  rationale: readonly string[]
  requiredNextSteps: readonly string[]
  boundary: string
}

const severityRank: Record<SafetySeverity, number> = {
  info: 0,
  caution: 1,
  unknown: 2,
  high: 3,
  critical: 4,
}

function validSignal(signal: PopulationSafetySignal) {
  return Boolean(
    signal.id.trim() &&
    signal.source.trim() &&
    Number.isFinite(Date.parse(signal.capturedAt)) &&
    Number.isFinite(signal.confidence) &&
    signal.confidence > 0 &&
    signal.confidence <= 1 &&
    signal.rationale.trim(),
  )
}

/**
 * Fail-safe rule:
 * - critical authoritative signal -> stop-and-escalate
 * - high authoritative signal -> suspend-activity
 * - unknown safety state in high-consequence domains -> modify/monitor, never optimize
 * - caution -> modify-activity
 * - info only -> continue
 */
export function evaluatePopulationSafety(
  signals: readonly PopulationSafetySignal[],
): PopulationSafetyDecision {
  const valid = signals.filter(validSignal)
  if (!valid.length) {
    return Object.freeze({
      action: 'monitor' as const,
      optimizePerformanceAllowed: false,
      highestSeverity: 'unknown' as const,
      confidence: 0,
      signalIds: Object.freeze([]),
      rationale: Object.freeze(['No valid population-safety signal is available.']),
      requiredNextSteps: Object.freeze([
        'Acquire or refresh authoritative safety, environment, location and communications context before optimization.',
      ]),
      boundary:
        'Absence of evidence is not evidence of safety. Performance optimization remains gated until sufficient safety context exists.',
    })
  }

  const ordered = [...valid].sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
  const highest = ordered[0].severity
  const authoritativeCritical = valid.some((s) => s.authoritativeClassification && s.severity === 'critical')
  const authoritativeHigh = valid.some((s) => s.authoritativeClassification && s.severity === 'high')
  const hasUnknownHighConsequence = valid.some(
    (s) =>
      s.severity === 'unknown' &&
      ['medical-emergency','heat-weather','water-marine','aviation','motorsport','missing-person','communications','location-integrity'].includes(s.domain),
  )
  const hasCaution = valid.some((s) => s.severity === 'caution')
  const confidence = valid.reduce((sum, s) => sum + s.confidence, 0) / valid.length

  let action: SafetyAction
  if (authoritativeCritical) action = 'stop-and-escalate'
  else if (authoritativeHigh) action = 'suspend-activity'
  else if (hasUnknownHighConsequence || hasCaution) action = 'modify-activity'
  else action = 'continue'

  const optimizePerformanceAllowed = action === 'continue'

  const requiredNextSteps: string[] = []
  if (action === 'stop-and-escalate') {
    requiredNextSteps.push(
      'Stop performance optimization immediately.',
      'Activate the appropriate qualified emergency / medical / rescue / venue response pathway.',
      'Preserve location, time, source and communications provenance for responders.',
    )
  } else if (action === 'suspend-activity') {
    requiredNextSteps.push(
      'Suspend the affected activity or route.',
      'Resolve the high-severity hazard with the responsible qualified authority before resuming.',
      'Reassess safety context using fresh data.',
    )
  } else if (action === 'modify-activity') {
    requiredNextSteps.push(
      'Reduce exposure, intensity, route complexity or participant density as appropriate to the authoritative hazard context.',
      'Increase monitoring and refresh uncertain safety data.',
      'Resume performance optimization only after the safety gate returns continue.',
    )
  } else {
    requiredNextSteps.push(
      'Continue monitoring safety, environment, communications and participant condition while performance coaching proceeds.',
    )
  }

  return Object.freeze({
    action,
    optimizePerformanceAllowed,
    highestSeverity: highest,
    confidence,
    signalIds: Object.freeze(valid.map((s) => s.id)),
    rationale: Object.freeze(valid.map((s) => s.rationale)),
    requiredNextSteps: Object.freeze(requiredNextSteps),
    boundary:
      'This gate prioritizes population safety and response escalation. It does not diagnose disease, replace emergency services, certify venue safety or override qualified authorities.',
  })
}

export interface PopulationSafetyPolicy {
  populationSafetyBeforePerformance: true
  bystanderSafetyEqualToParticipantSafety: true
  buddyTeamSafetyRequired: true
  privacyConsentBeforeTracking: true
  uncertainHighConsequenceStateBlocksOptimization: true
  authoritativeEmergencyPathOverridesCoach: true
  massGatheringAllHazardsPlanningRequired: true
  riskCommunicationRequired: true
  postEventLearningRequired: true
}

export const POPULATION_SAFETY_POLICY: PopulationSafetyPolicy = Object.freeze({
  populationSafetyBeforePerformance: true,
  bystanderSafetyEqualToParticipantSafety: true,
  buddyTeamSafetyRequired: true,
  privacyConsentBeforeTracking: true,
  uncertainHighConsequenceStateBlocksOptimization: true,
  authoritativeEmergencyPathOverridesCoach: true,
  massGatheringAllHazardsPlanningRequired: true,
  riskCommunicationRequired: true,
  postEventLearningRequired: true,
})

export interface SafetyPriorityOrder {
  rank: number
  concern: string
}

export const POPULATION_SAFETY_PRIORITY = Object.freeze([
  { rank: 1, concern: 'Immediate life safety and emergency escalation' },
  { rank: 2, concern: 'Participant, buddy, team and bystander protection' },
  { rank: 3, concern: 'Venue, route, environmental and crowd hazard control' },
  { rank: 4, concern: 'Location, communications and data integrity' },
  { rank: 5, concern: 'Consent, privacy and authorized tracking' },
  { rank: 6, concern: 'Performance, speed, ranking and optimization' },
] satisfies readonly SafetyPriorityOrder[])

export const POPULATION_SAFETY_SOURCE_REGISTRY = Object.freeze([
  {
    id: 'who-mass-gatherings',
    url: 'https://www.who.int/activities/managing-health-risks-during-mass-gatherings',
    note: 'WHO all-hazard mass-gathering risk assessment, surveillance, emergency planning, health advice and response preparedness.',
  },
  {
    id: 'who-safe-sport-events-2025',
    url: 'https://www.who.int/publications/m/item/epi-win-digest-34-safe-sporting-events-stronger-public-health-key-considerations-and-country-experiences-for-mass-gatherings',
    note: 'WHO pre-event risk assessment, surveillance, contingency planning, emergency response and post-event learning for safe sporting events.',
  },
  {
    id: 'who-heat-mass-gatherings-2026',
    url: 'https://www.who.int/news/item/06-07-2026-advancing-heat-health-preparedness-during-mass-gatherings--practical-tools',
    note: 'WHO heat-health early warning, event-specific assessment, escalation protocols and mitigation for mass gatherings.',
  },
  {
    id: 'cdc-heat-athletes',
    url: 'https://www.cdc.gov/heat-health/risk-factors/heat-and-athletes.html',
    note: 'CDC athlete heat-safety guidance including buddy monitoring and stopping activity when faint or weak.',
  },
])
