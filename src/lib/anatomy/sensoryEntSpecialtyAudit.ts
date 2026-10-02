import { ATLAS_MODULE_INFO, partsForModule, type AtlasPart } from '../systemAtlas.gen'

export type SensoryEntDomain = 'upper-airway-ent' | 'eye' | 'middle-inner-ear'

export interface SensoryEntTarget {
  domain: SensoryEntDomain
  module: 'tht' | 'mata' | 'telinga'
  label: string
  expectedSource: AtlasPart['source']
  requiredExactNames: readonly string[]
}

export interface SensoryEntAudit extends SensoryEntTarget {
  reachable: boolean
  sourceBacked: boolean
  structures: number
  triangles: number
  sources: AtlasPart['source'][]
  resolvedExactNames: string[]
  missingExactNames: string[]
  blockers: string[]
}

export const SENSORY_ENT_TARGETS: readonly SensoryEntTarget[] = [
  {
    domain: 'upper-airway-ent', module: 'tht', label: 'Nose, pharynx and larynx', expectedSource: 'bodyparts3d',
    requiredExactNames: ['Tongue', 'Epiglottis', 'External ear', 'Left inferior nasal concha', 'Right inferior nasal concha'],
  },
  {
    domain: 'eye', module: 'mata', label: 'Eye, orbit and optic pathway', expectedSource: 'bodyparts3d',
    requiredExactNames: ['Left cornea', 'Right cornea', 'Left lens', 'Right lens', 'Optic part of left retina', 'Optic part of right retina', 'Left optic nerve', 'Right optic nerve'],
  },
  {
    domain: 'middle-inner-ear', module: 'telinga', label: 'Middle and inner ear', expectedSource: 'z-anatomy',
    requiredExactNames: ['Left malleus', 'Right malleus', 'Left incus', 'Right incus', 'Left stapes', 'Right stapes', 'Left tympanic membrane', 'Right tympanic membrane', 'Left cochlea', 'Right cochlea', 'Left vestibule', 'Right vestibule'],
  },
] as const

function unique<T>(values: T[]): T[] { return [...new Set(values)] }

export function auditSensoryEntTarget(target: SensoryEntTarget): SensoryEntAudit {
  const info = ATLAS_MODULE_INFO[target.module]
  const parts = partsForModule(target.module)
  const blockers: string[] = []
  const byExactName = new Map(parts.map((part) => [part.name, part] as const))
  if (!info) blockers.push('MODULE_NOT_SHIPPED')
  if (parts.length === 0) blockers.push('NO_EXACT_SHIPPED_STRUCTURES')
  const zeroGeometry = parts.filter((part) => !(Number.isFinite(part.triangles) && part.triangles > 0))
  if (zeroGeometry.length > 0) blockers.push('ZERO_TRIANGLE_STRUCTURE')
  const sources = unique(parts.map((part) => part.source))
  if (sources.length === 0) blockers.push('SOURCE_IDENTITY_MISSING')
  if (parts.length > 0 && !sources.includes(target.expectedSource)) blockers.push('EXPECTED_SOURCE_MISSING')
  const resolvedExactNames = target.requiredExactNames.filter((name) => {
    const part = byExactName.get(name)
    return Boolean(part && part.source === target.expectedSource && Number.isFinite(part.triangles) && part.triangles > 0)
  })
  const missingExactNames = target.requiredExactNames.filter((name) => !resolvedExactNames.includes(name))
  if (missingExactNames.length > 0) blockers.push('REQUIRED_EXACT_STRUCTURE_MISSING')
  const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)
  const sourceBacked = Boolean(info) && parts.length > 0 && zeroGeometry.length === 0 && sources.includes(target.expectedSource) && missingExactNames.length === 0 && triangles > 0
  return { ...target, reachable: Boolean(info), sourceBacked, structures: parts.length, triangles, sources, resolvedExactNames, missingExactNames, blockers }
}

export function auditSensoryEntBreadth(): SensoryEntAudit[] { return SENSORY_ENT_TARGETS.map(auditSensoryEntTarget) }
export function sensoryEntRenderEligible(audit: SensoryEntAudit): boolean { return audit.reachable && audit.sourceBacked && audit.blockers.length === 0 }
export const SENSORY_ENT_RENDER_FORMULA = 'SensoryRenderEligible = ReachableModule ∧ ExactNamedGeometry ∧ PositiveIndexedTriangles ∧ ExpectedSourceIdentity' as const
