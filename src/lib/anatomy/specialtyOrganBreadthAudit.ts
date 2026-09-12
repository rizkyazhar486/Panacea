import { ATLAS_MODULE_INFO, partsForModule, type AtlasPart } from '../systemAtlas.gen'

export type SpecialtyOrganSystem = 'digestive' | 'reproductive' | 'lymphatic-immune' | 'integumentary-surface'

export interface SpecialtyOrganTarget {
  system: SpecialtyOrganSystem
  module: string
  label: string
}

export interface SpecialtyOrganModuleAudit extends SpecialtyOrganTarget {
  reachable: boolean
  sourceBacked: boolean
  structures: number
  triangles: number
  sources: AtlasPart['source'][]
  blockers: string[]
}

/**
 * System-scoped targets that are already reachable from Body Explorer → Specialty labs.
 * This file never creates a substitute mesh: module identity must exist in the generated
 * shipped atlas and every represented structure must carry positive indexed triangles.
 */
export const SPECIALTY_ORGAN_TARGETS: readonly SpecialtyOrganTarget[] = [
  { system: 'digestive', module: 'gastro', label: 'Gastrointestinal tract' },
  { system: 'digestive', module: 'bilier', label: 'Hepatobiliary and pancreatic ducts' },
  { system: 'reproductive', module: 'urogenital', label: 'Male urogenital anatomy' },
  { system: 'reproductive', module: 'prostat', label: 'Prostate zones and prostatic urinary outlet' },
  { system: 'reproductive', module: 'obgin', label: 'Female pelvis and reproductive organs' },
  { system: 'lymphatic-immune', module: 'imunologi', label: 'Immune and marrow reference anatomy' },
  { system: 'integumentary-surface', module: 'kulit', label: 'Skin and body surface' },
] as const

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

export function auditSpecialtyOrganModule(target: SpecialtyOrganTarget): SpecialtyOrganModuleAudit {
  const info = ATLAS_MODULE_INFO[target.module]
  const parts = partsForModule(target.module)
  const blockers: string[] = []

  if (!info) blockers.push('MODULE_NOT_SHIPPED')
  if (parts.length === 0) blockers.push('NO_EXACT_SHIPPED_STRUCTURES')

  const zeroGeometry = parts.filter((part) => !(Number.isFinite(part.triangles) && part.triangles > 0))
  if (zeroGeometry.length > 0) blockers.push('ZERO_TRIANGLE_STRUCTURE')

  const sources = unique(parts.map((part) => part.source))
  if (sources.length === 0) blockers.push('SOURCE_IDENTITY_MISSING')

  const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)
  const sourceBacked = Boolean(info) && parts.length > 0 && zeroGeometry.length === 0 && sources.length > 0 && triangles > 0

  return {
    ...target,
    reachable: Boolean(info),
    sourceBacked,
    structures: parts.length,
    triangles,
    sources,
    blockers,
  }
}

export function auditSpecialtyOrganBreadth(): SpecialtyOrganModuleAudit[] {
  return SPECIALTY_ORGAN_TARGETS.map(auditSpecialtyOrganModule)
}

export function renderEligible(audit: SpecialtyOrganModuleAudit): boolean {
  return audit.reachable && audit.sourceBacked && audit.blockers.length === 0
}

export const SPECIALTY_ORGAN_RENDER_FORMULA =
  'RenderEligible = ReachableModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ SourceIdentityPresent' as const
