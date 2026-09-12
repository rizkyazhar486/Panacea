import { auditSpecialtyOrganModule } from './specialtyOrganBreadthAudit'

export const IMMUNE_MARROW_RENDER_FORMULA =
  'ImmuneMarrowRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ BodyParts3DSourceOnly ∧ MarrowMeshNotFabricated' as const

export function auditImmuneMarrowSourceAcceptance() {
  const audit = auditSpecialtyOrganModule({
    system: 'lymphatic-immune',
    module: 'imunologi',
    label: 'Immune and marrow reference anatomy',
  })
  const exactSource = audit.sources.length === 1 && audit.sources[0] === 'bodyparts3d'
  const blockers = [...audit.blockers]
  if (!exactSource) blockers.push('NON_BODYPARTS3D_SOURCE_IN_MODULE')

  return {
    ...audit,
    expectedSource: 'bodyparts3d' as const,
    exactSource,
    marrowMeshFabricated: false as const,
    blockers,
    renderEligible:
      audit.reachable &&
      audit.sourceBacked &&
      audit.structures > 0 &&
      audit.triangles > 0 &&
      exactSource &&
      blockers.length === 0,
  }
}
