import { ATLAS_MODULE_INFO, partsForModule, type AtlasPart } from '../systemAtlas.gen'

export type SensoryEntModule = 'tht' | 'telinga'

export interface SensoryEntModuleAudit {
  module: SensoryEntModule
  reachable: boolean
  sourceBacked: boolean
  structures: number
  triangles: number
  sources: AtlasPart['source'][]
  blockers: string[]
}

const MODULES: readonly SensoryEntModule[] = ['tht', 'telinga'] as const

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

export function auditSensoryEntModule(module: SensoryEntModule): SensoryEntModuleAudit {
  const info = ATLAS_MODULE_INFO[module]
  const parts = partsForModule(module)
  const blockers: string[] = []

  if (!info) blockers.push('MODULE_NOT_SHIPPED')
  if (parts.length === 0) blockers.push('NO_EXACT_SHIPPED_STRUCTURES')

  const zeroGeometry = parts.filter((part) => !(Number.isFinite(part.triangles) && part.triangles > 0))
  if (zeroGeometry.length > 0) blockers.push('ZERO_TRIANGLE_STRUCTURE')

  const sources = unique(parts.map((part) => part.source))
  if (sources.length === 0) blockers.push('SOURCE_IDENTITY_MISSING')

  const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)
  const sourceBacked = Boolean(info)
    && parts.length > 0
    && zeroGeometry.length === 0
    && sources.length > 0
    && triangles > 0

  return {
    module,
    reachable: Boolean(info),
    sourceBacked,
    structures: parts.length,
    triangles,
    sources,
    blockers,
  }
}

export function auditSensoryEntSourceAcceptance(): SensoryEntModuleAudit[] {
  return MODULES.map(auditSensoryEntModule)
}

export function sensoryEntRenderEligible(audit: SensoryEntModuleAudit): boolean {
  return audit.reachable && audit.sourceBacked && audit.blockers.length === 0
}

export const SENSORY_ENT_RENDER_FORMULA =
  'SensoryEntRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ SourceIdentityPresent' as const
