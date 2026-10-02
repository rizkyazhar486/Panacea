import { auditSpecialtyOrganModule } from './specialtyOrganBreadthAudit'

export const DIGESTIVE_RENDER_FORMULA =
  'DigestiveRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ ExpectedSourceIdentity' as const

export const DIGESTIVE_SOURCE_TARGETS = [
  { module: 'gastro', label: 'Gastrointestinal tract', expectedSource: 'bodyparts3d' },
  { module: 'bilier', label: 'Hepatobiliary and pancreatic ducts', expectedSource: 'hra-female' },
] as const

export function auditDigestiveSourceAcceptance() {
  return DIGESTIVE_SOURCE_TARGETS.map((target) => {
    const audit = auditSpecialtyOrganModule({
      system: 'digestive',
      module: target.module,
      label: target.label,
    })
    const exactSource = audit.sources.length === 1 && audit.sources[0] === target.expectedSource
    const blockers = [...audit.blockers]
    if (!exactSource) blockers.push('UNEXPECTED_SOURCE_IDENTITY')
    return {
      ...audit,
      expectedSource: target.expectedSource,
      exactSource,
      blockers,
      renderEligible:
        audit.reachable && audit.sourceBacked && audit.triangles > 0 && exactSource && blockers.length === 0,
    }
  })
}
