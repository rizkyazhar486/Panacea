export type EvidenceGrade = 'textbook' | 'observational' | 'experimental' | 'systematic-review' | 'hypothesis' | 'simulated'
export type TranslationStage = 'discovery' | 'innovation' | 'invention'

export interface EvidenceAnchor {
  sourceId: string
  recordId: string
  grade: EvidenceGrade
  version?: string | null
  note?: string | null
}

export interface TranslationCandidate {
  id: string
  title: string
  stage: TranslationStage
  anchors: EvidenceAnchor[]
  falsifiers: string[]
  contradictions: string[]
  uncertainty: 'low' | 'moderate' | 'high' | 'unknown'
  prototypePlan?: string | null
  clinicalEfficacyClaim: false
}

export function evidenceGrades(candidate: TranslationCandidate): EvidenceGrade[] {
  return [...new Set(candidate.anchors.map((anchor) => anchor.grade))]
}

export function mayAdvanceToInnovation(candidate: TranslationCandidate): boolean {
  return candidate.stage === 'discovery' && candidate.anchors.length > 0 && candidate.falsifiers.length > 0 && !candidate.anchors.every((anchor) => anchor.grade === 'hypothesis' || anchor.grade === 'simulated')
}

export function mayAdvanceToInvention(candidate: TranslationCandidate): boolean {
  return candidate.stage === 'innovation' && candidate.anchors.length > 0 && candidate.falsifiers.length > 0 && Boolean(candidate.prototypePlan?.trim())
}

export function advanceTranslationCandidate(candidate: TranslationCandidate, target: TranslationStage): TranslationCandidate {
  if (target === candidate.stage) return candidate
  if (target === 'innovation' && mayAdvanceToInnovation(candidate)) return { ...candidate, stage: 'innovation' }
  if (target === 'invention' && mayAdvanceToInvention(candidate)) return { ...candidate, stage: 'invention' }
  return candidate
}

export function contradictionLoad(candidate: TranslationCandidate): number {
  const denominator = candidate.anchors.length + candidate.contradictions.length
  if (denominator === 0) return 0
  return candidate.contradictions.length / denominator
}

export const DISCOVERY_TRANSLATION_BOUNDARY = 'Evidence maps and causal hypotheses may generate testable innovation candidates. Association is not causation, simulations are not measurements, prototypes are not therapies, and no candidate is a clinical efficacy claim.'
