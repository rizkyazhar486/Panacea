import { ATLAS_MODULE_INFO, partsForModule, type AtlasPart } from '../systemAtlas.gen'

export interface BreastHraAudit {
  module: 'payudara'
  reachable: boolean
  sourceBacked: boolean
  structures: number
  triangles: number
  sources: AtlasPart['source'][]
  kinds: string[]
  blockers: string[]
}

function unique<T>(values: T[]): T[] { return [...new Set(values)] }

export function auditBreastHraSource(): BreastHraAudit {
  const module = 'payudara' as const
  const info = ATLAS_MODULE_INFO[module]
  const parts = partsForModule(module)
  const blockers: string[] = []
  if (!info) blockers.push('MODULE_NOT_SHIPPED')
  if (parts.length === 0) blockers.push('NO_EXACT_SHIPPED_STRUCTURES')
  if (parts.some((part) => !(Number.isFinite(part.triangles) && part.triangles > 0))) blockers.push('ZERO_TRIANGLE_STRUCTURE')
  const sources = unique(parts.map((part) => part.source))
  const kinds = unique(parts.map((part) => part.kind))
  if (sources.length === 0) blockers.push('SOURCE_IDENTITY_MISSING')
  if (parts.some((part) => part.source !== 'hra-female')) blockers.push('NON_HRA_FEMALE_SOURCE_IN_MODULE')
  const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)
  const sourceBacked = Boolean(info)
    && parts.length > 0
    && triangles > 0
    && sources.length === 1
    && sources[0] === 'hra-female'
    && !blockers.includes('ZERO_TRIANGLE_STRUCTURE')
  return { module, reachable: Boolean(info), sourceBacked, structures: parts.length, triangles, sources, kinds, blockers }
}

export function breastRenderEligible(audit: BreastHraAudit): boolean {
  return audit.reachable && audit.sourceBacked && audit.blockers.length === 0
}

export const BREAST_HRA_RENDER_FORMULA =
  'BreastRenderEligible = ReachableModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ HRAFemaleSourceOnly' as const
