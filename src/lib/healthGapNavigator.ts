// Panacea Health Gap Navigator
//
// A deterministic, auditable bridge between a care plan and the patient's
// ability to understand and execute it. This is NOT a diagnostic or triage
// engine. It surfaces missing information, friction and unresolved questions
// so patients and clinicians can spend limited appointment time on the gaps
// that matter most.

export type GapDomain =
  | 'understanding'
  | 'safety'
  | 'medication'
  | 'continuity'
  | 'access'
  | 'evidence'
  | 'preferences'
  | 'records'

export type GapStatus = 'clear' | 'partial' | 'missing' | 'blocked'

export interface GapSignal {
  id: string
  domain: GapDomain
  label: string
  prompt: string
  status: GapStatus
  impact: 1 | 2 | 3
  actionability: 1 | 2 | 3
}

export interface GapFinding extends GapSignal {
  penalty: number
  priority: number
  question: string
}

export interface CareFrictionInput {
  waitingHours: number
  travelMinutes: number
  outOfPocketCost: number
  monthlyDisposableBudget: number
  numberOfSteps: number
  missedWorkHours: number
  digitalBarrier: 0 | 1 | 2 | 3 | 4 | 5
}

export interface CareFrictionResult {
  score: number
  level: 'low' | 'moderate' | 'high' | 'very-high'
  components: {
    waiting: number
    travel: number
    cost: number
    steps: number
    work: number
    digital: number
  }
}

export interface GapReport {
  bridgeScore: number
  openGapCount: number
  blockedCount: number
  findings: GapFinding[]
  topQuestions: GapFinding[]
  unknownLedger: string[]
}

const STATUS_WEIGHT: Record<GapStatus, number> = {
  clear: 0,
  partial: 0.45,
  missing: 0.8,
  blocked: 1,
}

const QUESTION_BY_DOMAIN: Record<GapDomain, string> = {
  understanding: 'Can you explain the main problem and the purpose of the next step in plain language?',
  safety: 'What specific change should make me seek help sooner instead of waiting for follow-up?',
  medication: 'Can we reconcile every medicine, dose, purpose, interaction concern and stop/hold instruction?',
  continuity: 'Who owns the next step, when should it happen, and what should I do if it does not happen on time?',
  access: 'Is there a medically reasonable lower-friction alternative if cost, travel or waiting time becomes a barrier?',
  evidence: 'Which parts of this plan are measured facts, guideline recommendations, research evidence or uncertainty?',
  preferences: 'Which parts of this decision depend on my goals, trade-offs or preferences?',
  records: 'Which original reports, images, pathology, genomics or medication records should travel with me to the next clinician?',
}

export const DEFAULT_GAP_SIGNALS: GapSignal[] = [
  {
    id: 'problem-understood',
    domain: 'understanding',
    label: 'Main problem understood',
    prompt: 'I can explain the main problem in my own words.',
    status: 'partial',
    impact: 3,
    actionability: 3,
  },
  {
    id: 'next-step-understood',
    domain: 'understanding',
    label: 'Next step + purpose understood',
    prompt: 'I know what happens next and what it is meant to achieve.',
    status: 'partial',
    impact: 3,
    actionability: 3,
  },
  {
    id: 'safety-net',
    domain: 'safety',
    label: 'Safety net is explicit',
    prompt: 'I know which change means I should seek help sooner.',
    status: 'missing',
    impact: 3,
    actionability: 3,
  },
  {
    id: 'med-reconciliation',
    domain: 'medication',
    label: 'Medication list reconciled',
    prompt: 'My medicines, doses, allergies and important interactions have been reconciled.',
    status: 'partial',
    impact: 3,
    actionability: 2,
  },
  {
    id: 'follow-up-owner',
    domain: 'continuity',
    label: 'Follow-up owner + date known',
    prompt: 'I know who owns the next step and when it should happen.',
    status: 'missing',
    impact: 3,
    actionability: 3,
  },
  {
    id: 'access-feasible',
    domain: 'access',
    label: 'Plan is feasible to access',
    prompt: 'Cost, travel, waiting time and logistics are feasible for me.',
    status: 'partial',
    impact: 2,
    actionability: 3,
  },
  {
    id: 'evidence-visible',
    domain: 'evidence',
    label: 'Evidence + uncertainty visible',
    prompt: 'I can see what is measured, recommended, uncertain or based on population evidence.',
    status: 'missing',
    impact: 2,
    actionability: 2,
  },
  {
    id: 'preferences-discussed',
    domain: 'preferences',
    label: 'Preferences discussed',
    prompt: 'My goals and trade-offs were included where the decision is preference-sensitive.',
    status: 'missing',
    impact: 2,
    actionability: 2,
  },
  {
    id: 'source-records',
    domain: 'records',
    label: 'Source records preserved',
    prompt: 'The original report, image, result or note stays attached to any simplified summary.',
    status: 'partial',
    impact: 2,
    actionability: 2,
  },
]

function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

export function scoreGap(signal: GapSignal): GapFinding {
  const priority = STATUS_WEIGHT[signal.status] * signal.impact * signal.actionability
  const penalty = priority
  return {
    ...signal,
    priority,
    penalty,
    question: QUESTION_BY_DOMAIN[signal.domain],
  }
}

export function buildGapReport(signals: GapSignal[]): GapReport {
  const findings = signals.map(scoreGap).sort((a, b) => b.priority - a.priority)
  const maxPenalty = signals.reduce((sum, signal) => sum + signal.impact * signal.actionability, 0)
  const actualPenalty = findings.reduce((sum, finding) => sum + finding.penalty, 0)
  const bridgeScore = maxPenalty > 0 ? Math.round(clamp(100 * (1 - actualPenalty / maxPenalty))) : 100
  const open = findings.filter((finding) => finding.status !== 'clear')
  return {
    bridgeScore,
    openGapCount: open.length,
    blockedCount: findings.filter((finding) => finding.status === 'blocked').length,
    findings,
    topQuestions: open.slice(0, 3),
    unknownLedger: open.map((finding) => finding.label),
  }
}

/**
 * Care Friction is deliberately NOT a clinical risk score. It estimates how
 * hard a plan may be to execute. Each component is normalized to 0-100 and the
 * final score is a weighted implementation burden index.
 */
export function careFriction(input: CareFrictionInput): CareFrictionResult {
  const waiting = clamp((Math.max(0, input.waitingHours) / 168) * 100)
  const travel = clamp((Math.max(0, input.travelMinutes) / 180) * 100)
  const budget = Math.max(1, input.monthlyDisposableBudget)
  const cost = clamp((Math.max(0, input.outOfPocketCost) / budget) * 100)
  const steps = clamp((Math.max(0, input.numberOfSteps - 1) / 7) * 100)
  const work = clamp((Math.max(0, input.missedWorkHours) / 16) * 100)
  const digital = clamp((Math.max(0, input.digitalBarrier) / 5) * 100)

  const score = Math.round(
    waiting * 0.18 +
    travel * 0.14 +
    cost * 0.26 +
    steps * 0.16 +
    work * 0.14 +
    digital * 0.12,
  )

  const level: CareFrictionResult['level'] =
    score < 25 ? 'low' : score < 50 ? 'moderate' : score < 75 ? 'high' : 'very-high'

  return { score, level, components: { waiting, travel, cost, steps, work, digital } }
}

export const GAP_NAVIGATOR_TRUTH_RULES = [
  'A gap is missing context or execution capacity; it is not a diagnosis.',
  'Never convert the bridge score or friction score into disease severity.',
  'Unknown information should remain unknown instead of being guessed by AI.',
  'Safety-net wording should come from the responsible clinical workflow or clinician.',
  'Cost and availability estimates need geography, source and timestamp.',
  'The original medical source must remain accessible beside any simplified explanation.',
] as const
