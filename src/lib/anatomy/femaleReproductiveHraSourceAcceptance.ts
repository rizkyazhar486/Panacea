import { auditSpecialtyOrganModule } from './specialtyOrganBreadthAudit'

export const FEMALE_REPRODUCTIVE_RENDER_FORMULA =
  'FemaleReproductiveRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ HRAFemaleSourceOnly' as const

export function auditFemaleReproductiveHraSourceAcceptance() {
  const audit = auditSpecialtyOrganModule({
    system: 'reproductive',
    module: 'obgin',
    label: 'Female pelvis and reproductive organs',
  })
  const exactSource = audit.sources.length === 1 && audit.sources[0] === 'hra-female'
  const blockers = [...audit.blockers]
  if (!exactSource) blockers.push('NON_HRA_FEMALE_SOURCE_IN_MODULE')

  return {
    ...audit,
    expectedSource: 'hra-female' as const,
    exactSource,
    blockers,
    renderEligible:
      audit.reachable
      && audit.sourceBacked
      && audit.structures > 0
      && audit.triangles > 0
      && exactSource
      && blockers.length === 0,
  }
}
