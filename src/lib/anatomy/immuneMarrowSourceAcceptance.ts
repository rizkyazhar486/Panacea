import { partsForModule } from '../systemAtlas.gen'
import { auditSpecialtyOrganModule } from './specialtyOrganBreadthAudit'

export const IMMUNE_MARROW_RENDER_FORMULA =
  'ImmuneMarrowRenderEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ BodyParts3DSourceOnly ∧ NoSeparateMarrowMesh' as const

const EXPLICIT_MARROW_NAME = /\b(?:bone\s+marrow|marrow|medulla\s+oss(?:ium|is))\b/i

export function auditImmuneMarrowSourceAcceptance() {
  const audit = auditSpecialtyOrganModule({
    system: 'lymphatic-immune',
    module: 'imunologi',
    label: 'Immune and marrow reference anatomy',
  })
  const exactSource = audit.sources.length === 1 && audit.sources[0] === 'bodyparts3d'
  const explicitMarrowStructures = partsForModule('imunologi')
    .map((part) => part.name)
    .filter((name) => EXPLICIT_MARROW_NAME.test(name))
  const separateMarrowMeshPresent = explicitMarrowStructures.length > 0
  const blockers = [...audit.blockers]
  if (!exactSource) blockers.push('NON_BODYPARTS3D_SOURCE_IN_MODULE')
  if (separateMarrowMeshPresent) blockers.push('UNEXPECTED_SEPARATE_MARROW_MESH')

  return {
    ...audit,
    expectedSource: 'bodyparts3d' as const,
    exactSource,
    explicitMarrowStructures,
    separateMarrowMeshPresent,
    blockers,
    renderEligible:
      audit.reachable &&
      audit.sourceBacked &&
      audit.structures > 0 &&
      audit.triangles > 0 &&
      exactSource &&
      !separateMarrowMeshPresent &&
      blockers.length === 0,
  }
}
