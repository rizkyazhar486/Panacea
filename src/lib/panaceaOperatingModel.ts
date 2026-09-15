export type EvidenceTier = 'A' | 'B' | 'C' | 'D' | 'X'
export type DeliveryGateState = 'support-eligible' | 'clinician-review-required' | 'research-only' | 'blocked'

export type EvidenceTierDefinition = {
  tier: EvidenceTier
  label: string
  meaning: string
  defaultGate: DeliveryGateState
}

export type HealthGraphDomain = {
  key: string
  label: string
  examples: string
}

export type RevenueLayer = {
  name: string
  role: string
  monetization: string
}

export const PANACEA_POSITIONING =
  'Intelligence-first health operating system: data → understanding → decision support → care → intervention → measurement → outcomes.'

export const HEALTH_GRAPH_DOMAINS: HealthGraphDomain[] = [
  { key: 'history', label: 'History', examples: 'conditions, procedures, family history, allergies' },
  { key: 'medications', label: 'Medications', examples: 'active drugs, adherence, interactions, prior response' },
  { key: 'labs', label: 'Laboratory', examples: 'longitudinal biomarkers, trends, reference context' },
  { key: 'imaging', label: 'Imaging', examples: 'reports, measurements, modality history, provenance' },
  { key: 'wearables', label: 'Wearables', examples: 'sleep, activity, heart rate, recovery, training' },
  { key: 'symptoms', label: 'Symptoms', examples: 'structured intake, onset, trajectory, severity' },
  { key: 'lifestyle', label: 'Lifestyle', examples: 'nutrition, exercise, sleep, tobacco, alcohol, environment' },
  { key: 'genomics', label: 'Genomics', examples: 'verified variants and family-risk context only' },
  { key: 'care', label: 'Care decisions', examples: 'clinician decisions, referrals, follow-up and rationale' },
  { key: 'outcomes', label: 'Outcomes', examples: 'response, adverse events, adherence and repeated measurements' },
]

export const VALUE_LOOP = [
  'Ingest',
  'Normalize',
  'Understand',
  'Prioritize',
  'Clinician review',
  'Act',
  'Measure',
  'Learn',
] as const

export const EVIDENCE_TIERS: EvidenceTierDefinition[] = [
  {
    tier: 'A',
    label: 'Established',
    meaning: 'Multiple strong guidelines, high-quality syntheses or consistent randomized evidence.',
    defaultGate: 'support-eligible',
  },
  {
    tier: 'B',
    label: 'Supported',
    meaning: 'Moderate-quality evidence or guideline-supported practice with meaningful limitations.',
    defaultGate: 'support-eligible',
  },
  {
    tier: 'C',
    label: 'Emerging',
    meaning: 'Promising but incomplete evidence; suitable for transparent discussion, not autonomous action.',
    defaultGate: 'clinician-review-required',
  },
  {
    tier: 'D',
    label: 'Experimental',
    meaning: 'Research-stage intervention, mechanism or hypothesis without adequate clinical validation.',
    defaultGate: 'research-only',
  },
  {
    tier: 'X',
    label: 'Insufficient / unsafe',
    meaning: 'Evidence is inadequate, contradictory, materially unsafe or outside Panacea publication rules.',
    defaultGate: 'blocked',
  },
]

export const REVENUE_LAYERS: RevenueLayer[] = [
  { name: 'Panacea Free', role: 'Acquisition', monetization: 'Free entry, education, basic organization and discovery.' },
  { name: 'Panacea Core', role: 'Recurring consumer', monetization: 'Health Graph, integrations, summaries and longitudinal intelligence subscription.' },
  { name: 'Panacea Precision', role: 'Diagnostics orchestration', monetization: 'Transparent marketplace/referral economics where legally permitted.' },
  { name: 'Panacea Care', role: 'Clinical services layer', monetization: 'Consultation and care-orchestration platform fees.' },
  { name: 'Panacea Pro', role: 'Clinician SaaS', monetization: 'CDSS, summaries, evidence workflows, monitoring and documentation tools.' },
  { name: 'Panacea Enterprise', role: 'Institutions', monetization: 'Hospitals, clinics, employers and population-health contracts.' },
  { name: 'Panacea API', role: 'Infrastructure', monetization: 'Clinical-intelligence APIs and licensed workflow components.' },
  { name: 'Body Exposure', role: 'Education/licensing', monetization: 'Professional education, institutional licensing and simulation modules.' },
]

export const DEFENSIBILITY_FLYWHEEL = [
  'More users and clinicians',
  'Richer consented longitudinal data',
  'Better calibrated models and workflows',
  'More useful decisions and explanations',
  'Better measurable outcomes',
  'More trust and distribution',
] as const

export function healthGraphCoverage(observedDomains: number, totalDomains = HEALTH_GRAPH_DOMAINS.length) {
  if (!Number.isFinite(observedDomains) || !Number.isFinite(totalDomains) || totalDomains <= 0) return undefined
  const observed = Math.max(0, Math.min(observedDomains, totalDomains))
  return Math.round((observed / totalDomains) * 100)
}

export function estimateLtv(monthlyArpu: number, grossMarginRate: number, monthlyChurnRate: number) {
  if (
    !Number.isFinite(monthlyArpu) ||
    !Number.isFinite(grossMarginRate) ||
    !Number.isFinite(monthlyChurnRate) ||
    monthlyArpu < 0 ||
    grossMarginRate < 0 ||
    grossMarginRate > 1 ||
    monthlyChurnRate <= 0 ||
    monthlyChurnRate > 1
  ) return undefined

  return (monthlyArpu * grossMarginRate) / monthlyChurnRate
}

export function estimateCacPaybackMonths(cac: number, monthlyArpu: number, grossMarginRate: number) {
  if (
    !Number.isFinite(cac) ||
    !Number.isFinite(monthlyArpu) ||
    !Number.isFinite(grossMarginRate) ||
    cac < 0 ||
    monthlyArpu <= 0 ||
    grossMarginRate <= 0 ||
    grossMarginRate > 1
  ) return undefined

  return cac / (monthlyArpu * grossMarginRate)
}

export function deliveryGate(
  tier: EvidenceTier,
  options: { patientSpecific?: boolean; clinicianReviewed?: boolean } = {},
): DeliveryGateState {
  if (tier === 'X') return 'blocked'
  if (tier === 'D') return 'research-only'
  if (tier === 'C') return 'clinician-review-required'
  if (options.patientSpecific && !options.clinicianReviewed) return 'clinician-review-required'
  return 'support-eligible'
}

export function ltvCacRatio(ltv: number, cac: number) {
  if (!Number.isFinite(ltv) || !Number.isFinite(cac) || ltv < 0 || cac <= 0) return undefined
  return ltv / cac
}
