// Clinical Decision Support (CDSS) scoring + deterministic verification gate.
//
// The legacy display score is retained for continuity:
//   CombinedScore = α·V + β·L + γ·S
//
// IMPORTANT: the weighted score is an explanatory UI heuristic, not a validated
// probability of benefit/safety and not an authorization rule. Clinical
// verification is governed by evaluatePlanSafety(), which uses explicit,
// inspectable blockers and fails closed when a current blocker has not been
// acknowledged by a blocker-bound clinician override.

import { checkInteractions } from './ddi'
import type { PlanItem, Patient } from './types'

export const WEIGHTS = { alpha: 0.65, beta: 0.25, gamma: 0.1 }
/** @deprecated Safety authorization no longer depends on a scalar threshold. */
export const S_THRESHOLD = 0.8

// Local high-alert / narrow-therapeutic-index screening vocabulary.
// This is deliberately NOT described as comprehensive; production deployment
// must use a governed medication knowledge source and institution-specific
// policy in addition to this bounded local screen.
export const HIGH_ALERT = [
  'warfarin',
  'heparin',
  'enoxaparin',
  'insulin',
  'digoxin',
  'amiodarone',
  'morfin',
  'morphine',
  'fentanyl',
  'opioid',
  'noradrenalin',
  'norepinephrine',
  'vasopres',
  'midazolam',
  'propofol',
  'fenitoin',
  'phenytoin',
  'kemoterapi',
  'chemo',
  'methotrexate',
  'kalium',
  'potassium',
]

export type CdssSafetyCode =
  | 'documented-allergy-conflict'
  | 'major-ddi'
  | 'moderate-ddi'
  | 'minor-ddi'
  | 'high-alert-dose-unverified'
  | 'high-alert-independent-check'

export interface CdssSafetyFinding {
  /** Stable enough to bind one clinician override to the exact current finding. */
  id: string
  code: CdssSafetyCode
  message: string
}

export interface PlanSafetyResult {
  blockers: CdssSafetyFinding[]
  warnings: CdssSafetyFinding[]
  /** true only when a current, identified, reasoned override covers every blocker. */
  overrideApplied: boolean
  /** Effective block after evaluating the current blocker-bound override. */
  blocked: boolean
  canVerify: boolean
  /** Reminder that absence of a local hit is not comprehensive medication clearance. */
  coverage: 'local-rules-only'
}

export interface CdssScore {
  V: number
  L: number
  S: number
  combined: number
  final: number
  blocked: boolean
  reasons: string[]
  highAlert: boolean
}

function clamp(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function normalizeClinicalText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9µ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function containsWholeTerm(text: string, term: string): boolean {
  const haystack = normalizeClinicalText(text)
  const needle = normalizeClinicalText(term)
  if (needle.length < 3) return false
  return ` ${haystack} `.includes(` ${needle} `)
}

function explicitAllergyMatch(text: string, documented: string): boolean {
  const trimmed = documented.trim()
  if (!trimmed) return false
  // Structured allergy data is still only a string in the current EMR. Match
  // the exact documented label, plus a conservative leading label before
  // common annotation delimiters such as "penicillin (rash)".
  const leading = trimmed.split(/[(:;]/, 1)[0]?.trim() ?? ''
  return containsWholeTerm(text, trimmed) || (leading.length >= 3 && containsWholeTerm(text, leading))
}

function isHighAlertText(text: string): boolean {
  const normalized = normalizeClinicalText(text)
  return HIGH_ALERT.some((drug) => normalized.includes(normalizeClinicalText(drug)))
}

function hasExplicitDose(text: string): boolean {
  // This proves only that a numerical dose is present, not that it is correct.
  return /\b\d+(?:[.,]\d+)?\s*(?:mg|g|gram|mcg|µg|ug|unit|units|iu|ml|mL)\b/i.test(text)
}

function itemContainsDdiTerm(itemText: string, term: string): boolean {
  return containsWholeTerm(itemText, term)
}

function dedupeFindings(findings: CdssSafetyFinding[]): CdssSafetyFinding[] {
  const seen = new Set<string>()
  return findings.filter((finding) => {
    if (seen.has(finding.id)) return false
    seen.add(finding.id)
    return true
  })
}

function validOverrideFor(
  item: PlanItem,
  blockers: CdssSafetyFinding[],
): boolean {
  if (blockers.length === 0) return false
  const override = item.safetyOverride
  if (!override) return false
  if (override.reason.trim().length < 12 || !override.by.trim()) return false
  if (Number.isNaN(Date.parse(override.at))) return false
  const acknowledged = new Set(override.findingIds)
  return blockers.every((finding) => acknowledged.has(finding.id))
}

/**
 * Deterministic verification boundary for the current bounded medication
 * safety knowledge available in the app.
 *
 * The function intentionally does NOT infer drug classes, allergy
 * cross-reactivity, renal/hepatic dose adjustment, pregnancy safety, or
 * interactions absent from the local rule set. Missing knowledge is never
 * converted into a "safe" claim.
 */
export function evaluatePlanSafety(
  item: PlanItem,
  patient: Patient,
  medicationContext: string[] = [],
): PlanSafetyResult {
  const blockers: CdssSafetyFinding[] = []
  const warnings: CdssSafetyFinding[] = []
  const text = item.text

  const allergyHit = patient.allergies.find((allergy) => explicitAllergyMatch(text, allergy))
  if (allergyHit) {
    const allergyId = normalizeClinicalText(allergyHit).replace(/\s+/g, '-')
    blockers.push({
      id: `allergy:${allergyId}`,
      code: 'documented-allergy-conflict',
      message: `Plan text directly matches documented allergy: ${allergyHit}. Confirm/correct the allergy record before verification.`,
    })
  }

  const highAlert = isHighAlertText(text)
  const treatmentItem = item.category === 'Definitif' || item.category === 'Suportif'
  if (highAlert && treatmentItem) {
    warnings.push({
      id: 'high-alert:independent-check',
      code: 'high-alert-independent-check',
      message: 'High-alert medication detected — require an independent clinician dose/route/indication check.',
    })
    if (!hasExplicitDose(text)) {
      blockers.push({
        id: 'high-alert:missing-explicit-dose',
        code: 'high-alert-dose-unverified',
        message: 'High-alert medication has no explicit numerical dose; verification is blocked until the dose is specified and checked.',
      })
    }
  }

  const ddiHits = checkInteractions([...medicationContext.filter(Boolean), text])
  for (const hit of ddiHits) {
    // A medication interaction elsewhere in the chart must not block every
    // unrelated plan item. This gate applies only when the proposed item is
    // one side of the interaction.
    const itemInvolved = hit.drugs.some((drug) => itemContainsDdiTerm(text, drug))
    if (!itemInvolved) continue
    const pair = [...hit.drugs].map(normalizeClinicalText).sort()
    const id = `ddi:${pair.join('+')}:${hit.severity}`
    const message = `${hit.drugs[0]} × ${hit.drugs[1]} — ${hit.effect}`
    if (hit.severity === 'mayor') {
      blockers.push({ id, code: 'major-ddi', message: `Major local-rule interaction: ${message}` })
    } else if (hit.severity === 'moderat') {
      warnings.push({ id, code: 'moderate-ddi', message: `Moderate local-rule interaction: ${message}` })
    } else {
      warnings.push({ id, code: 'minor-ddi', message: `Minor local-rule interaction: ${message}` })
    }
  }

  const uniqueBlockers = dedupeFindings(blockers)
  const uniqueWarnings = dedupeFindings(warnings)
  const overrideApplied = validOverrideFor(item, uniqueBlockers)
  const blocked = uniqueBlockers.length > 0 && !overrideApplied

  return {
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    overrideApplied,
    blocked,
    canVerify: !blocked,
    coverage: 'local-rules-only',
  }
}

export function scorePlanItem(
  item: PlanItem,
  patient: Patient,
  medicationContext: string[] = [],
): CdssScore {
  const text = item.text.toLowerCase()
  const safety = evaluatePlanSafety(item, patient, medicationContext)

  // V/L/S remain a bounded explanatory heuristic only. In particular, being
  // clinician-authored does not imply guideline concordance.
  let V = 0.55
  if (/dosis|mg|iv|po|gram|\bg\b|mcg|unit/.test(text)) V += 0.12
  if (item.category === 'Definitif' || item.category === 'Suportif') V += 0.08
  V = clamp(V)

  let L = item.source === 'AI' ? 0.7 : 0.45
  if (item.category === 'Edukasi' || item.category === 'Follow-up') L += 0.12
  L = clamp(L)

  const S = safety.blockers.length > 0 ? 0.25 : safety.warnings.length > 0 ? 0.75 : 0.95
  const combined = clamp(WEIGHTS.alpha * V + WEIGHTS.beta * L + WEIGHTS.gamma * S)
  const reasons = [...safety.blockers, ...safety.warnings].map((finding) => finding.message)

  return {
    V: round(V),
    L: round(L),
    S: round(S),
    combined: round(combined),
    final: safety.blocked ? 0 : round(combined),
    blocked: safety.blocked,
    reasons,
    highAlert: isHighAlertText(text),
  }
}
