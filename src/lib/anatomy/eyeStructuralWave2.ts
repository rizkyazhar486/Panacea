import { EYE_VISIBLE_WAVE1 } from './eyeVisibleWave1'

export type EyeStructuralDomain =
  | 'cornea'
  | 'sclera'
  | 'iris'
  | 'ciliary-body'
  | 'choroid'
  | 'lens'
  | 'aqueous-outflow'

export type EyeStructuralGeometryStatus = 'reference-only'
export type EyeStructuralReviewStatus = 'academic-review-pending'

export interface EyeStructuralNode {
  id: string
  label: string
  domain: EyeStructuralDomain
  parentId: string
  evidenceAnchor: string
  geometryStatus: EyeStructuralGeometryStatus
  reviewStatus: EyeStructuralReviewStatus
  selectable: boolean
  representationPolicy: 'reference-overlay-only'
  notes?: string
}

const N = (
  id: string,
  label: string,
  domain: EyeStructuralDomain,
  parentId: string,
  evidenceAnchor: string,
  notes?: string,
): EyeStructuralNode => ({
  id,
  label,
  domain,
  parentId,
  evidenceAnchor,
  geometryStatus: 'reference-only',
  reviewStatus: 'academic-review-pending',
  selectable: true,
  representationPolicy: 'reference-overlay-only',
  notes,
})

/**
 * Eye Wave 2 adds tissue-level structural layers only.
 * It intentionally does not synthesize thickness, coordinates, angles, flow resistance,
 * patient-specific morphology, or new 3D geometry. Exact source geometry must be proven
 * independently before any node can leave reference-only presentation.
 */
export const EYE_STRUCTURAL_WAVE2: readonly EyeStructuralNode[] = [
  // Cornea — traditional five-layer structural model.
  N('corneal-epithelium', 'Corneal epithelium', 'cornea', 'cornea', 'NCBI:NBK470340'),
  N('bowman-layer', 'Bowman layer', 'cornea', 'cornea', 'NCBI:NBK470340'),
  N('corneal-stroma', 'Corneal stroma / substantia propria', 'cornea', 'cornea', 'NCBI:NBK470340'),
  N('descemet-membrane', 'Descemet membrane', 'cornea', 'cornea', 'NCBI:NBK470340'),
  N('corneal-endothelium', 'Corneal endothelium', 'cornea', 'cornea', 'NCBI:NBK470340'),

  // Scleral structural layers.
  N('episclera', 'Episclera', 'sclera', 'sclera', 'NCBI:NBK544343'),
  N('scleral-stroma', 'Scleral stroma / substantia propria', 'sclera', 'sclera', 'NCBI:NBK544343'),
  N('lamina-fusca', 'Lamina fusca', 'sclera', 'sclera', 'NCBI:NBK544343'),

  // Iris structural components; tissue-level only, not cell/pathway expansion.
  N('iris-anterior-border-layer', 'Iris anterior border layer', 'iris', 'iris', 'NCBI:NBK544343'),
  N('iris-stroma', 'Iris stroma', 'iris', 'iris', 'NCBI:NBK544343'),
  N('iris-sphincter', 'Sphincter pupillae', 'iris', 'iris', 'NCBI:NBK11120'),
  N('iris-dilator', 'Dilator pupillae', 'iris', 'iris', 'NCBI:NBK11120'),
  N('iris-pigment-epithelium', 'Posterior iris pigment epithelium', 'iris', 'iris', 'NCBI:NBK544343'),

  // Ciliary body structural regions.
  N('pars-plicata', 'Pars plicata', 'ciliary-body', 'ciliary-body', 'NCBI:NBK532237'),
  N('pars-plana', 'Pars plana', 'ciliary-body', 'ciliary-body', 'NCBI:NBK532237'),
  N('ciliary-muscle', 'Ciliary muscle', 'ciliary-body', 'ciliary-body', 'NCBI:NBK11120'),
  N('ciliary-processes', 'Ciliary processes', 'ciliary-body', 'pars-plicata', 'NCBI:NBK532237'),
  N('pigmented-ciliary-epithelium', 'Pigmented ciliary epithelium', 'ciliary-body', 'ciliary-processes', 'NCBI:NBK532237'),
  N('nonpigmented-ciliary-epithelium', 'Nonpigmented ciliary epithelium', 'ciliary-body', 'ciliary-processes', 'NCBI:NBK532237'),

  // Choroidal structural layers.
  N('suprachoroid', 'Suprachoroid / suprachoroidal layer', 'choroid', 'choroid', 'NCBI:NBK544343'),
  N('haller-layer', 'Haller layer (large choroidal vessels)', 'choroid', 'choroid', 'NCBI:NBK544343'),
  N('sattler-layer', 'Sattler layer (medium choroidal vessels)', 'choroid', 'choroid', 'NCBI:NBK544343'),
  N('choriocapillaris', 'Choriocapillaris', 'choroid', 'choroid', 'NCBI:NBK544343'),
  N('bruch-membrane', 'Bruch membrane', 'choroid', 'choroid', 'NCBI:NBK544343'),

  // Crystalline lens structural organization.
  N('lens-capsule', 'Lens capsule', 'lens', 'lens', 'NCBI:NBK476171'),
  N('lens-anterior-epithelium', 'Anterior lens epithelium', 'lens', 'lens', 'NCBI:NBK476171'),
  N('lens-cortex', 'Lens cortex', 'lens', 'lens', 'NCBI:NBK476171'),
  N('lens-nucleus', 'Lens nucleus', 'lens', 'lens', 'NCBI:NBK476171'),
  N('lens-fibers', 'Lens fibers', 'lens', 'lens', 'NCBI:NBK476171'),
  N('lens-equator', 'Lens equator', 'lens', 'lens', 'NCBI:NBK476171', 'Regional landmark only; do not infer patient dimensions.'),

  // Conventional aqueous outflow structures.
  N('schwalbe-line', 'Schwalbe line', 'aqueous-outflow', 'corneoscleral-limbus', 'NCBI:NBK578175'),
  N('scleral-spur', 'Scleral spur', 'aqueous-outflow', 'corneoscleral-limbus', 'NCBI:NBK578175'),
  N('trabecular-meshwork', 'Trabecular meshwork', 'aqueous-outflow', 'corneoscleral-limbus', 'MESH:D014129'),
  N('uveal-trabecular-meshwork', 'Uveal trabecular meshwork', 'aqueous-outflow', 'trabecular-meshwork', 'NCBI:NBK578175'),
  N('corneoscleral-trabecular-meshwork', 'Corneoscleral trabecular meshwork', 'aqueous-outflow', 'trabecular-meshwork', 'NCBI:NBK578175'),
  N('juxtacanalicular-tissue', 'Juxtacanalicular / cribriform tissue', 'aqueous-outflow', 'trabecular-meshwork', 'NCBI:NBK578175'),
  N('schlemm-canal', 'Schlemm canal / scleral venous sinus', 'aqueous-outflow', 'trabecular-meshwork', 'MESH:D000092662'),
  N('collector-channels', 'Aqueous collector channels', 'aqueous-outflow', 'schlemm-canal', 'PMCID:PMC3432647'),
  N('aqueous-veins', 'Aqueous veins / episcleral venous outflow endpoint', 'aqueous-outflow', 'collector-channels', 'MESH:D000092662'),
] as const

export const EYE_WAVE2_REQUIRED_IDS = [
  'corneal-epithelium', 'bowman-layer', 'corneal-stroma', 'descemet-membrane', 'corneal-endothelium',
  'episclera', 'scleral-stroma', 'lamina-fusca',
  'iris-stroma', 'iris-sphincter', 'iris-dilator',
  'pars-plicata', 'pars-plana', 'ciliary-muscle', 'ciliary-processes',
  'pigmented-ciliary-epithelium', 'nonpigmented-ciliary-epithelium',
  'suprachoroid', 'haller-layer', 'sattler-layer', 'choriocapillaris', 'bruch-membrane',
  'lens-capsule', 'lens-anterior-epithelium', 'lens-cortex', 'lens-nucleus', 'lens-fibers',
  'trabecular-meshwork', 'uveal-trabecular-meshwork', 'corneoscleral-trabecular-meshwork',
  'juxtacanalicular-tissue', 'schlemm-canal', 'collector-channels', 'aqueous-veins',
] as const

export const EYE_WAVE2_SCIENTIFIC_BOUNDARY =
  'Structural reference only. Do not fabricate layer thickness, 3D coordinates, gonioscopic angles, aqueous-flow resistance, pressure, patient morphology, or surgical safe zones.'

const acceptedEvidence = /^(NCBI:NBK\d+|MESH:D\d+|PMCID:PMC\d+)$/

export function validateEyeStructuralWave2(records: readonly EyeStructuralNode[] = EYE_STRUCTURAL_WAVE2): string[] {
  const errors: string[] = []
  const wave1Ids = new Set(EYE_VISIBLE_WAVE1.map((item) => item.id))
  const ids = new Set<string>()

  for (const item of records) {
    if (ids.has(item.id)) errors.push(`duplicate:${item.id}`)
    ids.add(item.id)
    if (!item.label.trim()) errors.push(`label:${item.id}`)
    if (!acceptedEvidence.test(item.evidenceAnchor)) errors.push(`evidence:${item.id}`)
    if (item.geometryStatus !== 'reference-only') errors.push(`geometry:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
    if (item.representationPolicy !== 'reference-overlay-only') errors.push(`representation:${item.id}`)
  }

  for (const item of records) {
    if (!ids.has(item.parentId) && !wave1Ids.has(item.parentId)) errors.push(`parent:${item.id}:${item.parentId}`)
  }
  for (const id of EYE_WAVE2_REQUIRED_IDS) if (!ids.has(id)) errors.push(`required:${id}`)

  return errors
}
