import { ATLAS_MODULE_INFO, partsForModule, type AtlasPart } from '../systemAtlas.gen'

export const MALE_REPRODUCTIVE_MODULE = 'urogenital' as const
export const MALE_REPRODUCTIVE_EXPECTED_SOURCE: AtlasPart['source'] = 'bodyparts3d'

export const MALE_REPRODUCTIVE_RENDER_FORMULA =
  'MaleReproductiveRenderEligible = ReachableWebGLModule ∧ ExactSourceNamedReproductiveStructures ∧ PositiveIndexedTriangles ∧ BodyParts3DSourceOnly ∧ NoUrinarySubstitution' as const

type ConceptRule = {
  id: string
  label: string
  exactNormalizedPattern: RegExp
  minimumDistinctStructures: number
}

export const MALE_REPRODUCTIVE_CONCEPTS: readonly ConceptRule[] = [
  { id: 'prostate', label: 'Prostate', exactNormalizedPattern: /^prostate$/, minimumDistinctStructures: 1 },
  { id: 'testes', label: 'Testes', exactNormalizedPattern: /^(left|right) testis$/, minimumDistinctStructures: 2 },
  { id: 'epididymides', label: 'Epididymides', exactNormalizedPattern: /^(left|right) epididymis$/, minimumDistinctStructures: 2 },
  { id: 'seminal-vesicles', label: 'Seminal vesicles', exactNormalizedPattern: /^(left|right) seminal vesicle$/, minimumDistinctStructures: 2 },
  { id: 'deferent-ducts', label: 'Deferent ducts', exactNormalizedPattern: /^(left|right) deferent duct$/, minimumDistinctStructures: 2 },
  { id: 'corpus-cavernosum', label: 'Corpus cavernosum of penis', exactNormalizedPattern: /^corpus cavernosum of penis$/, minimumDistinctStructures: 1 },
  { id: 'corpus-spongiosum', label: 'Corpus spongiosum of penis', exactNormalizedPattern: /^corpus spongiosum of penis$/, minimumDistinctStructures: 1 },
  { id: 'glans', label: 'Glans penis', exactNormalizedPattern: /^glans penis$/, minimumDistinctStructures: 1 },
] as const

const normalize = (name: string) => name.trim().toLowerCase()
const unique = <T>(values: T[]): T[] => [...new Set(values)]

export function auditMaleReproductiveSourceAcceptance() {
  const info = ATLAS_MODULE_INFO[MALE_REPRODUCTIVE_MODULE]
  const parts = partsForModule(MALE_REPRODUCTIVE_MODULE)
  const reproductiveParts = parts.filter((part) => part.kind === 'repro')
  const urinaryParts = parts.filter((part) => part.kind === 'urine')
  const blockers: string[] = []

  if (!info) blockers.push('MODULE_NOT_SHIPPED')
  if (parts.length === 0) blockers.push('NO_EXACT_SHIPPED_STRUCTURES')
  if (reproductiveParts.length === 0) blockers.push('NO_REPRODUCTIVE_SOURCE_STRUCTURES')
  if (reproductiveParts.some((part) => !(Number.isFinite(part.triangles) && part.triangles > 0))) {
    blockers.push('ZERO_TRIANGLE_REPRODUCTIVE_STRUCTURE')
  }

  const sources = unique(reproductiveParts.map((part) => part.source))
  const sourceOnly = sources.length === 1 && sources[0] === MALE_REPRODUCTIVE_EXPECTED_SOURCE
  if (!sourceOnly) blockers.push('UNEXPECTED_REPRODUCTIVE_SOURCE_IDENTITY')

  const concepts = MALE_REPRODUCTIVE_CONCEPTS.map((rule) => {
    const matched = reproductiveParts.filter((part) => rule.exactNormalizedPattern.test(normalize(part.name)))
    const exactNames = unique(matched.map((part) => part.name))
    const positiveGeometry = matched.every((part) => Number.isFinite(part.triangles) && part.triangles > 0)
    const sourceCorrect = matched.every((part) => part.source === MALE_REPRODUCTIVE_EXPECTED_SOURCE)
    const resolved = exactNames.length >= rule.minimumDistinctStructures && positiveGeometry && sourceCorrect
    return { id: rule.id, label: rule.label, exactNames, resolved }
  })

  const unresolvedConcepts = concepts.filter((concept) => !concept.resolved).map((concept) => concept.id)
  if (unresolvedConcepts.length > 0) blockers.push('CANONICAL_REPRODUCTIVE_STRUCTURE_MISSING')

  const conceptNames = new Set(concepts.flatMap((concept) => concept.exactNames))
  const urinarySubstitution = urinaryParts.filter((part) => conceptNames.has(part.name)).map((part) => part.name)
  if (urinarySubstitution.length > 0) blockers.push('URINARY_STRUCTURE_SUBSTITUTED_FOR_REPRODUCTIVE')

  const triangles = reproductiveParts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)
  return {
    module: MALE_REPRODUCTIVE_MODULE,
    label: info?.label ?? 'Urogenital & andrology',
    reachable: Boolean(info),
    reproductiveStructures: reproductiveParts.length,
    urinaryStructuresInSameModule: urinaryParts.length,
    triangles,
    sources,
    sourceOnly,
    concepts,
    unresolvedConcepts,
    urinarySubstitution,
    blockers,
    renderEligible:
      Boolean(info)
      && reproductiveParts.length > 0
      && triangles > 0
      && sourceOnly
      && unresolvedConcepts.length === 0
      && urinarySubstitution.length === 0
      && blockers.length === 0,
  }
}
