import {
  SURGICAL_PROCEDURES,
  SURGICAL_SPECIALTIES,
  type SurgicalProcedure,
  type SurgicalSpecialty,
} from './surgicalAtlas'
import { SURGICAL_EXPANSION } from './surgicalAtlasExpansion'

export const ALL_SURGICAL_PROCEDURES: SurgicalProcedure[] = [
  ...SURGICAL_PROCEDURES,
  ...SURGICAL_EXPANSION,
]

export { SURGICAL_SPECIALTIES }
export type { SurgicalProcedure, SurgicalSpecialty }

export function searchAllSurgicalProcedures(query: string, specialty: 'all' | SurgicalSpecialty = 'all') {
  const q = query.trim().toLowerCase()
  return ALL_SURGICAL_PROCEDURES.filter((procedure) => {
    if (specialty !== 'all' && procedure.specialty !== specialty) return false
    if (!q) return true
    const haystack = [
      procedure.name,
      procedure.specialty,
      procedure.region,
      procedure.approach,
      procedure.summary,
      ...procedure.learningObjectives,
      ...procedure.complications,
      ...procedure.patientSpecificInputs,
      ...procedure.phases.flatMap((phase) => [
        phase.title,
        phase.objective,
        phase.narration,
        ...phase.focusKeywords,
        ...phase.structuresAtRisk,
        ...phase.instrumentFamilies,
      ]),
    ].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

export interface SurgicalCatalogStats {
  procedures: number
  specialties: number
  phases: number
  riskMentions: number
  bySpecialty: Array<{ specialty: SurgicalSpecialty; count: number }>
}

export function getSurgicalCatalogStats(): SurgicalCatalogStats {
  const bySpecialty = SURGICAL_SPECIALTIES
    .filter((item): item is { key: SurgicalSpecialty; label: string } => item.key !== 'all')
    .map((item) => ({
      specialty: item.key,
      count: ALL_SURGICAL_PROCEDURES.filter((procedure) => procedure.specialty === item.key).length,
    }))

  return {
    procedures: ALL_SURGICAL_PROCEDURES.length,
    specialties: bySpecialty.length,
    phases: ALL_SURGICAL_PROCEDURES.reduce((sum, procedure) => sum + procedure.phases.length, 0),
    riskMentions: ALL_SURGICAL_PROCEDURES.reduce(
      (sum, procedure) => sum + procedure.phases.reduce((phaseSum, phase) => phaseSum + phase.structuresAtRisk.length, 0),
      0,
    ),
    bySpecialty,
  }
}
