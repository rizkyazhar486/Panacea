// Panacea Knowledge Bridge Engine
//
// Goal: reduce the knowledge asymmetry between patients and clinicians without
// pretending that plain-language education is a diagnosis or medical order.
// This module is intentionally data-driven so UI, AI orchestration and export
// layers can reuse the same contracts.

export type BridgeModuleKey =
  | 'translator'
  | 'teach-back'
  | 'evidence-ladder'
  | 'shared-decision'
  | 'visit-copilot'
  | 'consent'
  | 'care-pathway'
  | 'second-opinion'

export type EvidenceLevel = 'measurement' | 'guideline' | 'trial' | 'observational' | 'expert' | 'uncertain'
export type Urgency = 'routine' | 'soon' | 'urgent' | 'emergency'

export interface KnowledgeBridgeModule {
  key: BridgeModuleKey
  label: string
  patientProblem: string
  clinicianValue: string
  outputs: string[]
  truthBoundary: string
}

export interface RiskComparison {
  controlRisk: number
  treatmentRisk: number
  absoluteRiskReduction: number
  relativeRiskReduction: number | null
  nnt: number | null
  controlPer1000: number
  treatmentPer1000: number
  preventedPer1000: number
}

export interface EvidenceClaim {
  id: string
  claim: string
  level: EvidenceLevel
  sourceLabel: string
  measuredAt?: string
  uncertainty?: string
}

export interface TeachBackPrompt {
  id: string
  prompt: string
  mustMention: string[]
  whyItMatters: string
}

export interface CarePathwayStep {
  id: string
  label: string
  actor: 'patient' | 'primary-care' | 'specialist' | 'lab' | 'radiology' | 'pharmacy' | 'hospital' | 'home-care'
  purpose: string
  estimatedCost?: number
  currency?: string
  waitingTimeHours?: number
  prerequisites: string[]
  alternatives: string[]
}

export interface VisitQuestion {
  id: string
  question: string
  reason: string
  priority: 'must-ask' | 'useful' | 'optional'
}

export const KNOWLEDGE_BRIDGE_MODULES: KnowledgeBridgeModule[] = [
  {
    key: 'translator',
    label: 'Doctor ↔ Patient Translator',
    patientProblem: 'Medical notes, imaging reports and jargon are difficult to understand and patients often cannot express symptoms in clinician-ready language.',
    clinicianValue: 'Receives a structured history and can share explanations without rewriting the same concept for every patient.',
    outputs: ['plain-language explanation', 'clinical-language mirror', 'term glossary', 'what-is-known vs what-is-uncertain'],
    truthBoundary: 'Translation preserves meaning; it must not create diagnoses or facts absent from the source.'
  },
  {
    key: 'teach-back',
    label: 'Teach-Back Loop',
    patientProblem: 'People can nod during a consultation while leaving without understanding what to do next.',
    clinicianValue: 'Shows which parts of a plan were understood, misunderstood or never explained.',
    outputs: ['three-question comprehension check', 'missed concept list', 're-explanation request', 'understanding confirmation'],
    truthBoundary: 'A comprehension check measures recall/understanding of the provided explanation, not medical competence.'
  },
  {
    key: 'evidence-ladder',
    label: 'Evidence Ladder',
    patientProblem: 'Patients often cannot distinguish a measured fact, guideline recommendation, trial result, expert opinion and speculation.',
    clinicianValue: 'Makes provenance and uncertainty visible before discussion.',
    outputs: ['claim provenance', 'evidence type', 'date/version', 'uncertainty badge', 'conflict-of-evidence flag'],
    truthBoundary: 'Evidence labels describe provenance; they do not automatically establish causality or patient-level applicability.'
  },
  {
    key: 'shared-decision',
    label: 'Shared Decision Matrix',
    patientProblem: 'Relative-risk headlines can sound dramatic while hiding the absolute difference that matters to an individual decision.',
    clinicianValue: 'Presents benefit, harm, burden and patient priorities in one auditable view.',
    outputs: ['absolute risk', 'relative risk', 'natural frequencies', 'NNT when mathematically valid', 'preference-sensitive trade-offs'],
    truthBoundary: 'Risk numbers are valid only for the population, outcome and time horizon of their source.'
  },
  {
    key: 'visit-copilot',
    label: 'Visit Copilot',
    patientProblem: 'Important questions are forgotten, symptoms are disorganized and appointment time is wasted reconstructing the story.',
    clinicianValue: 'Gets a concise timeline, medications, red flags, goals and unanswered questions before the visit.',
    outputs: ['one-page visit brief', 'timeline', 'medication reconciliation prompts', 'question shortlist', 'post-visit action list'],
    truthBoundary: 'The copilot organizes reported information; it does not replace history-taking or examination.'
  },
  {
    key: 'consent',
    label: 'Consent Simulator',
    patientProblem: 'Consent forms are usually signed after a dense explanation that is difficult to compare or remember.',
    clinicianValue: 'Can verify that indication, alternatives, material risks and recovery expectations were actually reviewed.',
    outputs: ['indication', 'benefits', 'material risks', 'alternatives', 'what-happens-if-no-treatment', 'teach-back checkpoint'],
    truthBoundary: 'Educational simulation supports consent; legal informed consent still requires the responsible clinical team and local rules.'
  },
  {
    key: 'care-pathway',
    label: 'Care + Cost Pathway',
    patientProblem: 'Patients rarely know the sequence, waiting time, alternatives or price implications of a care journey.',
    clinicianValue: 'Makes bottlenecks, prerequisites and lower-friction alternatives visible.',
    outputs: ['care graph', 'who-does-what', 'estimated wait', 'price range', 'coverage/eligibility hook', 'home-vs-facility alternatives'],
    truthBoundary: 'Costs and availability must be sourced and time-stamped; estimates are not quotations.'
  },
  {
    key: 'second-opinion',
    label: 'Second-Opinion Packet',
    patientProblem: 'Seeking another opinion means repeatedly retelling the story and manually collecting reports, images and medication lists.',
    clinicianValue: 'Receives a provenance-preserving packet instead of a narrative stripped of source context.',
    outputs: ['problem list', 'timeline', 'labs', 'imaging', 'pathology/genomics', 'treatments tried', 'open questions', 'source links'],
    truthBoundary: 'Panacea packages source material and questions; it must not manufacture a second opinion in the name of a clinician.'
  }
]

export const DEFAULT_TEACH_BACK: TeachBackPrompt[] = [
  {
    id: 'problem',
    prompt: 'In your own words, what is the main health problem being discussed?',
    mustMention: ['main problem'],
    whyItMatters: 'If the problem itself is misunderstood, every downstream decision is built on the wrong premise.'
  },
  {
    id: 'plan',
    prompt: 'What is the next step, and what is it meant to achieve?',
    mustMention: ['next step', 'purpose'],
    whyItMatters: 'A plan without a purpose is easy to abandon or execute incorrectly.'
  },
  {
    id: 'safety',
    prompt: 'What change would make you seek help sooner rather than waiting?',
    mustMention: ['safety-net'],
    whyItMatters: 'Safety-net understanding is a practical defense against delayed escalation.'
  }
]

export function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

/**
 * Convert two event probabilities into patient-facing absolute and relative
 * measures. Inputs are probabilities in [0,1], not percentages.
 */
export function compareRisks(controlRiskRaw: number, treatmentRiskRaw: number): RiskComparison {
  const controlRisk = clampProbability(controlRiskRaw)
  const treatmentRisk = clampProbability(treatmentRiskRaw)
  const absoluteRiskReduction = controlRisk - treatmentRisk
  const relativeRiskReduction = controlRisk > 0 ? absoluteRiskReduction / controlRisk : null
  const nnt = absoluteRiskReduction > 0 ? 1 / absoluteRiskReduction : null
  return {
    controlRisk,
    treatmentRisk,
    absoluteRiskReduction,
    relativeRiskReduction,
    nnt,
    controlPer1000: Math.round(controlRisk * 1000),
    treatmentPer1000: Math.round(treatmentRisk * 1000),
    preventedPer1000: Math.round(absoluteRiskReduction * 1000)
  }
}

export function evidenceWeight(level: EvidenceLevel): number {
  switch (level) {
    case 'measurement': return 1
    case 'guideline': return 0.9
    case 'trial': return 0.85
    case 'observational': return 0.65
    case 'expert': return 0.4
    case 'uncertain': return 0.15
  }
}

export function sortEvidence(claims: EvidenceClaim[]): EvidenceClaim[] {
  return [...claims].sort((a, b) => evidenceWeight(b.level) - evidenceWeight(a.level))
}

export function estimatedPathwayCost(steps: CarePathwayStep[], currency: string): number {
  return steps
    .filter((step) => step.currency === currency && typeof step.estimatedCost === 'number')
    .reduce((sum, step) => sum + (step.estimatedCost ?? 0), 0)
}

export function estimatedPathwayHours(steps: CarePathwayStep[]): number {
  return steps.reduce((sum, step) => sum + (step.waitingTimeHours ?? 0), 0)
}

export const KNOWLEDGE_BRIDGE_TRUTH_RULES = [
  'Never turn a missing source into a confident statement.',
  'Show absolute numbers before relative-risk framing when both are available.',
  'Separate measured patient data from population evidence.',
  'Keep the time horizon attached to every risk estimate.',
  'Preserve the original report/note alongside every simplified explanation.',
  'Escalation advice must be explicit when a workflow contains urgent or emergency red flags.',
  'Patient preferences can change a decision; they cannot change measured facts.',
  'Every cost/availability estimate requires source, geography and timestamp.'
] as const
