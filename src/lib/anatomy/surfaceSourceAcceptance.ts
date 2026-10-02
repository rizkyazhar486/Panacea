import { auditSpecialtyOrganModule } from './specialtyOrganBreadthAudit'

export const SURFACE_RENDER_FORMULA =
  'SurfaceRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ BodyParts3DSourceOnly' as const

export function auditSurfaceSourceAcceptance() {
  const audit = auditSpecialtyOrganModule({
    system: 'integumentary-surface',
    module: 'kulit',
    label: 'Skin and body surface',
  })
  const exactSource = audit.sources.length === 1 && audit.sources[0] === 'bodyparts3d'
  const blockers = [...audit.blockers]
  if (!exactSource) blockers.push('NON_BODYPARTS3D_SOURCE_IN_MODULE')
  return {
    ...audit,
    expectedSource: 'bodyparts3d' as const,
    exactSource,
    blockers,
    renderEligible:
      audit.reachable && audit.sourceBacked && audit.triangles > 0 && exactSource && blockers.length === 0,
  }
}
