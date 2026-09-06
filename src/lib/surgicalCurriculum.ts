import { ALL_SURGICAL_PROCEDURES, type SurgicalProcedure, type SurgicalSpecialty } from './surgicalAtlasCatalog'

export interface SurgicalComparison {
  sharedRisks: string[]
  leftOnlyRisks: string[]
  rightOnlyRisks: string[]
  sharedFocus: string[]
  leftOnlyFocus: string[]
  rightOnlyFocus: string[]
}

export interface SurgicalCoverageSnapshot {
  reviewedPhaseKeys: string[]
  reviewedProcedures: number
  reviewedPhases: number
  totalProcedures: number
  totalPhases: number
  bySpecialty: Array<{ specialty: SurgicalSpecialty; reviewed: number; total: number }>
}

function normalize(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))]
}

function lowerMap(items: string[]) {
  return new Map(items.map((item) => [item.toLowerCase(), item]))
}

function compareLists(a: string[], b: string[]) {
  const left = lowerMap(normalize(a))
  const right = lowerMap(normalize(b))
  const shared = [...left.keys()].filter((key) => right.has(key)).map((key) => left.get(key)!)
  const leftOnly = [...left.keys()].filter((key) => !right.has(key)).map((key) => left.get(key)!)
  const rightOnly = [...right.keys()].filter((key) => !left.has(key)).map((key) => right.get(key)!)
  return { shared, leftOnly, rightOnly }
}

export function compareSurgicalProcedures(left: SurgicalProcedure, right: SurgicalProcedure): SurgicalComparison {
  const risksLeft = left.phases.flatMap((phase) => phase.structuresAtRisk)
  const risksRight = right.phases.flatMap((phase) => phase.structuresAtRisk)
  const focusLeft = left.phases.flatMap((phase) => phase.focusKeywords)
  const focusRight = right.phases.flatMap((phase) => phase.focusKeywords)
  const risks = compareLists(risksLeft, risksRight)
  const focus = compareLists(focusLeft, focusRight)
  return {
    sharedRisks: risks.shared,
    leftOnlyRisks: risks.leftOnly,
    rightOnlyRisks: risks.rightOnly,
    sharedFocus: focus.shared,
    leftOnlyFocus: focus.leftOnly,
    rightOnlyFocus: focus.rightOnly,
  }
}

export function phaseCoverageKey(procedureId: string, phaseId: string) {
  return `${procedureId}::${phaseId}`
}

export function buildSurgicalCoverage(reviewedPhaseKeys: string[]): SurgicalCoverageSnapshot {
  const reviewed = new Set(reviewedPhaseKeys)
  const totalPhases = ALL_SURGICAL_PROCEDURES.reduce((sum, procedure) => sum + procedure.phases.length, 0)
  const reviewedProcedures = ALL_SURGICAL_PROCEDURES.filter((procedure) => procedure.phases.some((phase) => reviewed.has(phaseCoverageKey(procedure.id, phase.id)))).length
  const specialties = [...new Set(ALL_SURGICAL_PROCEDURES.map((procedure) => procedure.specialty))]
  return {
    reviewedPhaseKeys: [...reviewed],
    reviewedProcedures,
    reviewedPhases: [...reviewed].filter((key) => ALL_SURGICAL_PROCEDURES.some((procedure) => procedure.phases.some((phase) => phaseCoverageKey(procedure.id, phase.id) === key))).length,
    totalProcedures: ALL_SURGICAL_PROCEDURES.length,
    totalPhases,
    bySpecialty: specialties.map((specialty) => {
      const procedures = ALL_SURGICAL_PROCEDURES.filter((procedure) => procedure.specialty === specialty)
      const phaseKeys = procedures.flatMap((procedure) => procedure.phases.map((phase) => phaseCoverageKey(procedure.id, phase.id)))
      return { specialty, reviewed: phaseKeys.filter((key) => reviewed.has(key)).length, total: phaseKeys.length }
    }),
  }
}

export function getSurgicalRecallPrompt(procedure: SurgicalProcedure, phaseIndex: number) {
  const phase = procedure.phases[Math.max(0, Math.min(phaseIndex, procedure.phases.length - 1))]
  return {
    title: `Before revealing “${phase.title}”`,
    prompt: 'Which structures should stay in your mental risk map during this phase?',
    answer: normalize(phase.structuresAtRisk),
    checkpoint: phase.checkpoint,
    objective: phase.objective,
  }
}

export function pickCoverageNext(reviewedPhaseKeys: string[], specialty?: SurgicalSpecialty) {
  const reviewed = new Set(reviewedPhaseKeys)
  const pool = ALL_SURGICAL_PROCEDURES.filter((procedure) => !specialty || procedure.specialty === specialty)
  for (const procedure of pool) {
    const phase = procedure.phases.find((item) => !reviewed.has(phaseCoverageKey(procedure.id, item.id)))
    if (phase) return { procedure, phase, key: phaseCoverageKey(procedure.id, phase.id) }
  }
  return null
}
