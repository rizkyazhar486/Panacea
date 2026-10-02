import { ATLAS_MODULE_INFO, partsForModule, type AtlasPart } from '../systemAtlas.gen'

export interface SpecialtyMskTarget {
  module: 'ortopedi' | 'lutut'
  label: string
  domain: 'musculoskeletal' | 'articular'
}

export interface SpecialtyMskAudit extends SpecialtyMskTarget {
  reachable: boolean
  sourceBacked: boolean
  structures: number
  triangles: number
  sources: AtlasPart['source'][]
  kinds: string[]
  blockers: string[]
}

export const SPECIALTY_MSK_TARGETS: readonly SpecialtyMskTarget[] = [
  { module: 'ortopedi', label: 'Orthopaedic musculoskeletal atlas', domain: 'musculoskeletal' },
  { module: 'lutut', label: 'Knee articular and ligament atlas', domain: 'articular' },
] as const

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

export function auditSpecialtyMskTarget(target: SpecialtyMskTarget): SpecialtyMskAudit {
  const info = ATLAS_MODULE_INFO[target.module]
  const parts = partsForModule(target.module)
  const blockers: string[] = []
  if (!info) blockers.push('MODULE_NOT_SHIPPED')
  if (parts.length === 0) blockers.push('NO_EXACT_SHIPPED_STRUCTURES')
  if (parts.some((part) => !(Number.isFinite(part.triangles) && part.triangles > 0))) blockers.push('ZERO_TRIANGLE_STRUCTURE')
  const sources = unique(parts.map((part) => part.source))
  const kinds = unique(parts.map((part) => part.kind))
  if (sources.length === 0) blockers.push('SOURCE_IDENTITY_MISSING')
  const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)
  const sourceBacked = Boolean(info) && parts.length > 0 && triangles > 0 && sources.length > 0 && !blockers.includes('ZERO_TRIANGLE_STRUCTURE')
  return { ...target, reachable: Boolean(info), sourceBacked, structures: parts.length, triangles, sources, kinds, blockers }
}

export function auditSpecialtyMskBreadth(): SpecialtyMskAudit[] {
  return SPECIALTY_MSK_TARGETS.map(auditSpecialtyMskTarget)
}

export function mskRenderEligible(audit: SpecialtyMskAudit): boolean {
  return audit.reachable && audit.sourceBacked && audit.blockers.length === 0
}

export const SPECIALTY_MSK_RENDER_FORMULA =
  'MSKRenderEligible = ReachableModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ SourceIdentityPresent' as const
