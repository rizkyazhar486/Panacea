// Deterministic synthetic clinical-case state machine for reasoning practice. Pure: no clock/RNG/DOM; every transition is explicit and exhaustive.
// SYNTHETIC patients only — never real patient data. Findings appear only when the learner performs the (authorised) action; anything not in the case
// stays `not_available` (unknown ≠ normal). Scores are educational feedback, NOT evidence of clinical competence, and nothing here directs patient care.
import type { ConceptGraph } from '../../biological-concept-graph/index.ts'

export const CASE_SCHEMA_VERSION = '1.0.0' as const
export const CASE_PHASES = ['presentation', 'history', 'examination', 'differential', 'investigation', 'interpretation', 'management', 'feedback', 'reflection', 'complete'] as const
export type CasePhase = (typeof CASE_PHASES)[number]
export const EDUCATIONAL_ONLY = 'Educational feedback on a synthetic case. Not proof of clinical competence and not guidance for any real patient.' as const

export interface CaseItem { id: string; label: string; result: string }
export interface Investigation extends CaseItem { highValue: boolean }
export interface ManagementOption { id: string; label: string; appropriate: boolean; rationale: string }
export interface Diagnosis { id: string; label: string }
export interface ClinicalCase {
  id: string; version: string; synthetic: true
  presentation: string
  conceptIds: readonly string[]; referenceIds: readonly string[]
  history: readonly (CaseItem & { key: boolean })[]
  examination: readonly (CaseItem & { key: boolean })[]
  candidates: readonly Diagnosis[]
  trueDiagnosisId: string
  investigations: readonly Investigation[]
  management: readonly ManagementOption[]
  maxDifferential: number
}

export interface CaseState {
  caseId: string; caseVersion: string; schemaVersion: string
  phase: CasePhase
  asked: readonly string[]; examined: readonly string[]; ordered: readonly string[]; unavailableRequests: readonly string[]
  differential: readonly string[]; leadingDiagnosis: string | null; management: readonly string[]
  reflection: string | null
  seq: number
}
export type Transition<T = object> = ({ ok: true; state: CaseState } & T) | { ok: false; reason: TransitionError }
export type TransitionError = 'wrong_phase' | 'unknown_item' | 'empty_selection' | 'too_many' | 'unknown_diagnosis' | 'not_in_differential' | 'duplicate_selection' | 'empty_text' | 'incomplete' | 'schema_mismatch' | 'invalid_state'

export function validateCase(c: ClinicalCase, g: ConceptGraph): readonly string[] {
  const e: string[] = []
  if (!c.synthetic) e.push('case must be marked synthetic')
  const ids = [...c.history, ...c.examination, ...c.investigations, ...c.candidates, ...c.management].map((x) => x.id)
  if (new Set(ids).size !== ids.length) e.push('duplicate item id')
  if (!c.candidates.some((d) => d.id === c.trueDiagnosisId)) e.push('true diagnosis not among candidates')
  if (c.candidates.length < 3) e.push('need at least 3 candidate diagnoses')
  if (!c.management.some((m) => m.appropriate) || !c.management.some((m) => !m.appropriate)) e.push('management needs appropriate and inappropriate options')
  if (!c.investigations.some((i) => i.highValue)) e.push('no high-value investigation')
  if (c.maxDifferential < 1) e.push('maxDifferential')
  for (const k of c.conceptIds) if (!g.nodes.has(k)) e.push(`unknown concept ${k}`)
  if (!c.referenceIds.length) e.push('no reference')
  for (const r of c.referenceIds) if (!g.references.has(r)) e.push(`unknown reference ${r}`)
  for (const x of [...c.history, ...c.examination, ...c.investigations]) if (!x.result.trim()) e.push(`empty result ${x.id}`)
  return e
}

export const startCase = (c: ClinicalCase): CaseState => ({ caseId: c.id, caseVersion: c.version, schemaVersion: CASE_SCHEMA_VERSION, phase: 'presentation', asked: [], examined: [], ordered: [], unavailableRequests: [], differential: [], leadingDiagnosis: null, management: [], reflection: null, seq: 0 })

const bump = (s: CaseState, patch: Partial<CaseState>): CaseState => ({ ...s, ...patch, seq: s.seq + 1 })
const nextPhase = (p: CasePhase): CasePhase => CASE_PHASES[Math.min(CASE_PHASES.indexOf(p) + 1, CASE_PHASES.length - 1)]!

/** Move to the next phase when its exit condition holds. `feedback`→`reflection`→`complete` are driven by their own actions. */
export function advance(c: ClinicalCase, s: CaseState): Transition {
  switch (s.phase) {
    case 'presentation': case 'history': case 'examination': return { ok: true, state: bump(s, { phase: nextPhase(s.phase) }) }
    case 'differential': return s.differential.length ? { ok: true, state: bump(s, { phase: 'investigation' }) } : { ok: false, reason: 'incomplete' }
    case 'investigation': return { ok: true, state: bump(s, { phase: 'interpretation' }) }
    case 'interpretation': return s.leadingDiagnosis ? { ok: true, state: bump(s, { phase: 'management' }) } : { ok: false, reason: 'incomplete' }
    case 'management': return s.management.length ? { ok: true, state: bump(s, { phase: 'feedback' }) } : { ok: false, reason: 'incomplete' }
    case 'feedback': return { ok: true, state: bump(s, { phase: 'reflection' }) }
    case 'reflection': case 'complete': return { ok: false, reason: 'wrong_phase' }
  }
}

export function ask(c: ClinicalCase, s: CaseState, itemId: string): Transition<{ answer: string }> {
  if (s.phase !== 'history') return { ok: false, reason: 'wrong_phase' }
  const it = c.history.find((h) => h.id === itemId); if (!it) return { ok: false, reason: 'unknown_item' }
  return { ok: true, answer: it.result, state: s.asked.includes(itemId) ? s : bump(s, { asked: [...s.asked, itemId] }) }
}
export function examine(c: ClinicalCase, s: CaseState, itemId: string): Transition<{ finding: string }> {
  if (s.phase !== 'examination') return { ok: false, reason: 'wrong_phase' }
  const it = c.examination.find((h) => h.id === itemId); if (!it) return { ok: false, reason: 'unknown_item' }
  return { ok: true, finding: it.result, state: s.examined.includes(itemId) ? s : bump(s, { examined: [...s.examined, itemId] }) }
}
/** A request the case does not define: recorded as an information gap, answered `not_available`, never fabricated. */
export function requestUnlisted(s: CaseState, label: string): Transition<{ answer: 'not_available' }> {
  if (s.phase !== 'history' && s.phase !== 'examination' && s.phase !== 'investigation') return { ok: false, reason: 'wrong_phase' }
  const l = label.trim().toLowerCase(); if (!l) return { ok: false, reason: 'empty_text' }
  return { ok: true, answer: 'not_available', state: s.unavailableRequests.includes(l) ? s : bump(s, { unavailableRequests: [...s.unavailableRequests, l] }) }
}
export function submitDifferential(c: ClinicalCase, s: CaseState, ids: readonly string[]): Transition {
  if (s.phase !== 'differential') return { ok: false, reason: 'wrong_phase' }
  if (!ids.length) return { ok: false, reason: 'empty_selection' }
  if (ids.length > c.maxDifferential) return { ok: false, reason: 'too_many' }
  if (new Set(ids).size !== ids.length) return { ok: false, reason: 'duplicate_selection' }
  if (ids.some((i) => !c.candidates.some((d) => d.id === i))) return { ok: false, reason: 'unknown_diagnosis' }
  return { ok: true, state: bump(s, { differential: [...ids] }) }
}
export function order(c: ClinicalCase, s: CaseState, id: string): Transition<{ result: string }> {
  if (s.phase !== 'investigation') return { ok: false, reason: 'wrong_phase' }
  const it = c.investigations.find((i) => i.id === id); if (!it) return { ok: false, reason: 'unknown_item' }
  return { ok: true, result: it.result, state: s.ordered.includes(id) ? s : bump(s, { ordered: [...s.ordered, id] }) }
}
export function interpret(c: ClinicalCase, s: CaseState, diagnosisId: string): Transition {
  if (s.phase !== 'interpretation') return { ok: false, reason: 'wrong_phase' }
  if (!c.candidates.some((d) => d.id === diagnosisId)) return { ok: false, reason: 'unknown_diagnosis' }
  if (!s.differential.includes(diagnosisId)) return { ok: false, reason: 'not_in_differential' }
  return { ok: true, state: bump(s, { leadingDiagnosis: diagnosisId }) }
}
export function selectManagement(c: ClinicalCase, s: CaseState, ids: readonly string[]): Transition {
  if (s.phase !== 'management') return { ok: false, reason: 'wrong_phase' }
  if (!ids.length) return { ok: false, reason: 'empty_selection' }
  if (new Set(ids).size !== ids.length) return { ok: false, reason: 'duplicate_selection' }
  if (ids.some((i) => !c.management.some((m) => m.id === i))) return { ok: false, reason: 'unknown_item' }
  return { ok: true, state: bump(s, { management: [...ids] }) }
}
export function reflect(s: CaseState, text: string): Transition {
  if (s.phase !== 'reflection') return { ok: false, reason: 'wrong_phase' }
  if (!text.trim()) return { ok: false, reason: 'empty_text' }
  return { ok: true, state: bump(s, { reflection: text.trim(), phase: 'complete' }) }
}

export interface CaseFeedback {
  disclaimer: typeof EDUCATIONAL_ONLY
  trueDiagnosis: Diagnosis
  leadingCorrect: boolean
  differentialIncludesTrue: boolean
  missedKeyHistory: readonly string[]; missedKeyExamination: readonly string[]
  missedHighValueInvestigations: readonly string[]; lowValueInvestigationsOrdered: readonly string[]
  managementAppropriateChosen: readonly string[]; managementAppropriateMissed: readonly string[]; managementInappropriateChosen: readonly { id: string; rationale: string }[]
  unavailableRequests: readonly string[]
  referenceIds: readonly string[]
  /** 0..1 over the weighted checks above; educational only, never a competence measure. */
  educationalScore: number
}

/** Available from the feedback phase onward (the answer is never exposed earlier). */
export function computeFeedback(c: ClinicalCase, s: CaseState): { ok: true; feedback: CaseFeedback } | { ok: false; reason: TransitionError } {
  if (s.phase !== 'feedback' && s.phase !== 'reflection' && s.phase !== 'complete') return { ok: false, reason: 'wrong_phase' }
  const dx = c.candidates.find((d) => d.id === c.trueDiagnosisId)!
  const missedKeyHistory = c.history.filter((h) => h.key && !s.asked.includes(h.id)).map((h) => h.id)
  const missedKeyExamination = c.examination.filter((h) => h.key && !s.examined.includes(h.id)).map((h) => h.id)
  const missedHigh = c.investigations.filter((i) => i.highValue && !s.ordered.includes(i.id)).map((i) => i.id)
  const lowOrdered = c.investigations.filter((i) => !i.highValue && s.ordered.includes(i.id)).map((i) => i.id)
  const mChosen = c.management.filter((m) => s.management.includes(m.id))
  const mGoodChosen = mChosen.filter((m) => m.appropriate).map((m) => m.id)
  const mGoodMissed = c.management.filter((m) => m.appropriate && !s.management.includes(m.id)).map((m) => m.id)
  const mBad = mChosen.filter((m) => !m.appropriate).map((m) => ({ id: m.id, rationale: m.rationale }))
  const leadingCorrect = s.leadingDiagnosis === c.trueDiagnosisId
  const inDiff = s.differential.includes(c.trueDiagnosisId)
  const frac = (done: number, total: number) => (total === 0 ? 1 : done / total)
  const parts = [
    leadingCorrect ? 1 : 0, inDiff ? 1 : 0,
    frac(c.history.filter((h) => h.key).length - missedKeyHistory.length, c.history.filter((h) => h.key).length),
    frac(c.examination.filter((h) => h.key).length - missedKeyExamination.length, c.examination.filter((h) => h.key).length),
    frac(c.investigations.filter((i) => i.highValue).length - missedHigh.length, c.investigations.filter((i) => i.highValue).length),
    mBad.length ? 0 : frac(mGoodChosen.length, mGoodChosen.length + mGoodMissed.length),
  ]
  return { ok: true, feedback: { disclaimer: EDUCATIONAL_ONLY, trueDiagnosis: dx, leadingCorrect, differentialIncludesTrue: inDiff, missedKeyHistory, missedKeyExamination, missedHighValueInvestigations: missedHigh, lowValueInvestigationsOrdered: lowOrdered, managementAppropriateChosen: mGoodChosen, managementAppropriateMissed: mGoodMissed, managementInappropriateChosen: mBad, unavailableRequests: s.unavailableRequests, referenceIds: c.referenceIds, educationalScore: parts.reduce((a, b) => a + b, 0) / parts.length } }
}

export const serializeCase = (s: CaseState): string => JSON.stringify(s)
/** Restore an interrupted session; state referring to anything the case no longer defines fails closed. */
export function restoreCase(raw: string, c: ClinicalCase): Transition {
  let v: Partial<CaseState> | null
  try { v = JSON.parse(raw) } catch { return { ok: false, reason: 'invalid_state' } }
  if (!v || typeof v !== 'object') return { ok: false, reason: 'invalid_state' }
  if (v.caseId !== c.id || v.caseVersion !== c.version || v.schemaVersion?.split('.')[0] !== CASE_SCHEMA_VERSION.split('.')[0]) return { ok: false, reason: 'schema_mismatch' }
  if (!(CASE_PHASES as readonly unknown[]).includes(v.phase)) return { ok: false, reason: 'invalid_state' }
  const known = (list: unknown, ids: readonly string[]) => Array.isArray(list) && list.every((x) => typeof x === 'string' && ids.includes(x)) && new Set(list).size === list.length
  const ok = known(v.asked, c.history.map((x) => x.id)) && known(v.examined, c.examination.map((x) => x.id)) && known(v.ordered, c.investigations.map((x) => x.id)) &&
    known(v.differential, c.candidates.map((x) => x.id)) && known(v.management, c.management.map((x) => x.id)) && Array.isArray(v.unavailableRequests) && Number.isInteger(v.seq) &&
    (v.leadingDiagnosis === null || (typeof v.leadingDiagnosis === 'string' && (v.differential ?? []).includes(v.leadingDiagnosis)))
  // A restored state must also be reachable: later-phase data cannot exist in an earlier phase.
  const idx = CASE_PHASES.indexOf(v.phase!)
  const reachable = (idx >= CASE_PHASES.indexOf('investigation') || !v.ordered?.length) && (idx >= CASE_PHASES.indexOf('interpretation') || v.leadingDiagnosis === null) && (idx >= CASE_PHASES.indexOf('feedback') || !v.management?.length) && (idx >= CASE_PHASES.indexOf('differential') || !v.differential?.length)
  return ok && reachable ? { ok: true, state: v as CaseState } : { ok: false, reason: 'invalid_state' }
}
