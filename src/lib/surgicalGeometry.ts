import { INDEKS_TUBUH } from './bodySearch'
import { ATLAS_MODULE_INFO, ATLAS_PARTS } from './systemAtlas.gen'
import { CARDIO_PARTS } from './cardioAtlas.gen'

export type SurgicalGeometryStatus = 'whole-body' | 'specialty-atlas' | 'reference-only'

export interface SurgicalSpecialtyMatch {
  module: string
  moduleLabel: string
  name: string
}

export interface SurgicalRiskCoverage {
  label: string
  canonical: string
  status: SurgicalGeometryStatus
  wholeBodyNodeNames: string[]
  specialtyMatches: SurgicalSpecialtyMatch[]
}

/**
 * Normalize only presentation annotations, never anatomical meaning.
 *
 * Risk labels sometimes append teaching notes after an em dash or in
 * parentheses (for example "Popliteal artery (posterior, …)").  Those notes
 * are not part of the mesh name.  We deliberately do NOT use fuzzy matching:
 * a medical atlas should prefer "not represented" over lighting up a similar
 * but different structure.
 */
export function canonicalSurgicalStructureName(label: string): string {
  return label
    .split(/\s+[—–-]\s+/)[0]
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function wholeBodyMatches(canonical: string): string[] {
  return INDEKS_TUBUH
    .filter((structure) => canonicalSurgicalStructureName(structure.b) === canonical)
    .map((structure) => structure.n)
}

function specialtyMatches(canonical: string): SurgicalSpecialtyMatch[] {
  const found: SurgicalSpecialtyMatch[] = []
  for (const part of ATLAS_PARTS) {
    if (canonicalSurgicalStructureName(part.name) !== canonical) continue
    found.push({
      module: part.module,
      moduleLabel: ATLAS_MODULE_INFO[part.module]?.label ?? part.module,
      name: part.name,
    })
  }
  for (const part of CARDIO_PARTS) {
    if (canonicalSurgicalStructureName(part.name) !== canonical) continue
    found.push({ module: 'cardio', moduleLabel: 'Cardio lab', name: part.name })
  }
  return found
}

export function resolveSurgicalRisk(label: string): SurgicalRiskCoverage {
  const canonical = canonicalSurgicalStructureName(label)
  const wholeBodyNodeNames = wholeBodyMatches(canonical)
  const specialty = specialtyMatches(canonical)
  return {
    label,
    canonical,
    status: wholeBodyNodeNames.length > 0
      ? 'whole-body'
      : specialty.length > 0
        ? 'specialty-atlas'
        : 'reference-only',
    wholeBodyNodeNames,
    specialtyMatches: specialty,
  }
}

export function resolveSurgicalRisks(labels: string[]): SurgicalRiskCoverage[] {
  return labels.map(resolveSurgicalRisk)
}

export function wholeBodyRiskNodes(labels: string[]): string[] {
  return [...new Set(resolveSurgicalRisks(labels).flatMap((item) => item.wholeBodyNodeNames))]
}
