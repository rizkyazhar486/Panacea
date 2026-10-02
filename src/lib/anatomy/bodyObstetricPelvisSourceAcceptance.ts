import { ATLAS_MODULE_INFO, partsForModule, type AtlasPart } from '../systemAtlas.gen'

export const OBSTETRIC_PELVIS_RENDER_FORMULA =
  'ObstetricPelvisEligible = ReachableWebGLModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ BodyParts3DSourceOnly ∧ MaleReferenceDisclosurePreserved' as const

export const OBSTETRIC_PELVIS_MODULE = 'obstetri' as const
export const OBSTETRIC_PELVIS_EXPECTED_SOURCE: AtlasPart['source'] = 'bodyparts3d'

export const OBSTETRIC_PELVIS_CANONICAL_STRUCTURES = [
  'Right obturator internus', 'Left obturator internus', 'Left coccygeus', 'Right coccygeus',
  'Left iliococcygeus', 'Right iliococcygeus', 'Left pubococcygeus', 'Right pubococcygeus',
  'tendinous arch of levator ani', 'Rectum', 'Urethra', 'Urinary bladder', 'Right hip bone',
  'Left hip bone', 'Sacrum', 'Left internal iliac artery', 'Right internal iliac artery',
  'Left internal iliac vein', 'Right internal iliac vein',
] as const

export const FEMALE_REPRODUCTIVE_NAMES_NOT_SHIPPED_IN_OBSTETRI = [
  'Uterus', 'Left ovary', 'Right ovary', 'Left uterine tube', 'Right uterine tube', 'Vagina',
] as const

function unique<T>(values: T[]): T[] { return [...new Set(values)] }

export function auditObstetricPelvisSourceAcceptance() {
  const info = ATLAS_MODULE_INFO[OBSTETRIC_PELVIS_MODULE]
  const parts = partsForModule(OBSTETRIC_PELVIS_MODULE)
  const byName = new Map(parts.map((part) => [part.name, part]))
  const blockers: string[] = []
  if (!info) blockers.push('MODULE_NOT_SHIPPED')
  if (parts.length === 0) blockers.push('NO_EXACT_SHIPPED_STRUCTURES')
  const missingCanonical = OBSTETRIC_PELVIS_CANONICAL_STRUCTURES.filter((name) => !byName.has(name))
  if (missingCanonical.length > 0) blockers.push('CANONICAL_STRUCTURE_MISSING')
  const zeroGeometry = OBSTETRIC_PELVIS_CANONICAL_STRUCTURES.map((name) => byName.get(name))
    .filter((part): part is AtlasPart => Boolean(part))
    .filter((part) => !(Number.isFinite(part.triangles) && part.triangles > 0))
  if (zeroGeometry.length > 0) blockers.push('ZERO_TRIANGLE_STRUCTURE')
  const sources = unique(parts.map((part) => part.source))
  const sourceOnly = sources.length === 1 && sources[0] === OBSTETRIC_PELVIS_EXPECTED_SOURCE
  if (!sourceOnly) blockers.push('UNEXPECTED_SOURCE_IDENTITY')
  const fabricatedFemaleReproductive = FEMALE_REPRODUCTIVE_NAMES_NOT_SHIPPED_IN_OBSTETRI.filter((name) => byName.has(name))
  if (fabricatedFemaleReproductive.length > 0) blockers.push('FEMALE_REPRODUCTIVE_GEOMETRY_WRONG_MODULE')
  const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)
  return {
    module: OBSTETRIC_PELVIS_MODULE,
    label: info?.label ?? 'Pelvis (obstetrics & gynaecology)',
    referenceBody: 'BodyParts3D male-reference pelvic mechanics' as const,
    femaleReproductiveGeometry: 'segregated-to-obgin-hra-female' as const,
    reachable: Boolean(info), structures: parts.length, triangles, sources, sourceOnly,
    missingCanonical, zeroGeometry: zeroGeometry.map((part) => part.name), fabricatedFemaleReproductive, blockers,
    renderEligible: Boolean(info) && parts.length > 0 && triangles > 0 && sourceOnly && missingCanonical.length === 0 &&
      zeroGeometry.length === 0 && fabricatedFemaleReproductive.length === 0 && blockers.length === 0,
  }
}
