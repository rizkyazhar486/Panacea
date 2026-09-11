import { EYE_VISIBLE_WAVE1 } from './eyeVisibleWave1'
import { EYE_STRUCTURAL_WAVE2 } from './eyeStructuralWave2'

export type EyeHistologyDomain = 'cornea' | 'retina'
export type EyeHistologyKind = 'layer' | 'cell-class' | 'cell-region' | 'plexus' | 'terminal'

export interface EyeHistologyNode {
  id: string
  label: string
  domain: EyeHistologyDomain
  kind: EyeHistologyKind
  parentId: string
  evidenceAnchor: string
  geometryStatus: 'reference-only'
  reviewStatus: 'academic-review-pending'
  representationPolicy: 'histology-reference-only'
  selectable: boolean
  notes?: string
}

const H = (
  id: string,
  label: string,
  domain: EyeHistologyDomain,
  kind: EyeHistologyKind,
  parentId: string,
  evidenceAnchor: string,
  notes?: string,
): EyeHistologyNode => ({
  id,
  label,
  domain,
  kind,
  parentId,
  evidenceAnchor,
  geometryStatus: 'reference-only',
  reviewStatus: 'academic-review-pending',
  representationPolicy: 'histology-reference-only',
  selectable: true,
  notes,
})

/**
 * Eye Wave 3 is a histology hierarchy, not synthetic microscopy.
 * Nodes are educational references only. No cell count, density, layer thickness,
 * OCT segmentation, microscopic coordinates, pathology inference, or patient-specific
 * reconstruction may be generated from these records.
 */
export const EYE_HISTOLOGY_WAVE3: readonly EyeHistologyNode[] = [
  // Corneal cellular / microscopic hierarchy.
  H('corneal-superficial-epithelial-cells', 'Superficial corneal epithelial cells', 'cornea', 'cell-class', 'corneal-epithelium', 'NCBI:NBK554050'),
  H('corneal-wing-cells', 'Corneal wing cells', 'cornea', 'cell-class', 'corneal-epithelium', 'NCBI:NBK554050'),
  H('corneal-basal-epithelial-cells', 'Basal corneal epithelial cells', 'cornea', 'cell-class', 'corneal-epithelium', 'NCBI:NBK554050'),
  H('corneal-subbasal-nerve-plexus', 'Corneal subbasal nerve plexus', 'cornea', 'plexus', 'corneal-epithelium', 'NCBI:NBK554050'),
  H('anterior-corneal-stroma', 'Anterior corneal stroma', 'cornea', 'cell-region', 'corneal-stroma', 'NCBI:NBK554050'),
  H('posterior-corneal-stroma', 'Posterior corneal stroma', 'cornea', 'cell-region', 'corneal-stroma', 'NCBI:NBK554050'),
  H('corneal-keratocytes', 'Corneal stromal keratocytes', 'cornea', 'cell-class', 'corneal-stroma', 'NCBI:NBK585127'),
  H('corneal-stromal-lamellae', 'Corneal stromal collagen lamellae', 'cornea', 'layer', 'corneal-stroma', 'NCBI:NBK562265'),
  H('corneal-endothelial-cells', 'Corneal endothelial cells', 'cornea', 'cell-class', 'corneal-endothelium', 'NCBI:NBK585127'),

  // Retina — conventional ten-layer histologic stack from outer to inner.
  H('retinal-pigment-epithelium', 'Retinal pigment epithelium (RPE)', 'retina', 'layer', 'retina', 'NCBI:NBK544343'),
  H('photoreceptor-layer', 'Photoreceptor layer (rods and cones)', 'retina', 'layer', 'retina', 'NCBI:NBK544343'),
  H('external-limiting-membrane', 'External limiting membrane', 'retina', 'layer', 'retina', 'NCBI:NBK544343'),
  H('outer-nuclear-layer', 'Outer nuclear layer', 'retina', 'layer', 'retina', 'NCBI:NBK544343'),
  H('outer-plexiform-layer', 'Outer plexiform layer', 'retina', 'layer', 'retina', 'NCBI:NBK544343'),
  H('inner-nuclear-layer', 'Inner nuclear layer', 'retina', 'layer', 'retina', 'NCBI:NBK544343'),
  H('inner-plexiform-layer', 'Inner plexiform layer', 'retina', 'layer', 'retina', 'NCBI:NBK544343'),
  H('ganglion-cell-layer', 'Ganglion cell layer', 'retina', 'layer', 'retina', 'NCBI:NBK544343'),
  H('nerve-fiber-layer', 'Retinal nerve fiber layer', 'retina', 'layer', 'retina', 'NCBI:NBK544343'),
  H('internal-limiting-membrane', 'Internal limiting membrane', 'retina', 'layer', 'retina', 'NCBI:NBK544343'),

  // Principal retinal cell classes.
  H('rod-photoreceptors', 'Rod photoreceptors', 'retina', 'cell-class', 'photoreceptor-layer', 'NCBI:NBK546692'),
  H('cone-photoreceptors', 'Cone photoreceptors', 'retina', 'cell-class', 'photoreceptor-layer', 'NCBI:NBK546692'),
  H('retinal-bipolar-cells', 'Retinal bipolar cells', 'retina', 'cell-class', 'inner-nuclear-layer', 'NCBI:NBK546692'),
  H('retinal-horizontal-cells', 'Retinal horizontal cells', 'retina', 'cell-class', 'inner-nuclear-layer', 'NCBI:NBK546692'),
  H('retinal-amacrine-cells', 'Retinal amacrine cells', 'retina', 'cell-class', 'inner-nuclear-layer', 'NCBI:NBK546692'),
  H('retinal-ganglion-cells', 'Retinal ganglion cells', 'retina', 'cell-class', 'ganglion-cell-layer', 'NCBI:NBK546692'),
  H('muller-glia', 'Müller glial cells', 'retina', 'cell-class', 'retina', 'NCBI:NBK546692'),

  // Photoreceptor structural regions and terminals; still reference-only.
  H('rod-inner-segment', 'Rod inner segment', 'retina', 'cell-region', 'rod-photoreceptors', 'NCBI:NBK546692'),
  H('rod-outer-segment', 'Rod outer segment', 'retina', 'cell-region', 'rod-photoreceptors', 'NCBI:NBK546692'),
  H('cone-inner-segment', 'Cone inner segment', 'retina', 'cell-region', 'cone-photoreceptors', 'NCBI:NBK546692'),
  H('cone-outer-segment', 'Cone outer segment', 'retina', 'cell-region', 'cone-photoreceptors', 'NCBI:NBK546692'),
  H('rod-spherule', 'Rod spherule', 'retina', 'terminal', 'rod-photoreceptors', 'NCBI:NBK11533'),
  H('cone-pedicle', 'Cone pedicle', 'retina', 'terminal', 'cone-photoreceptors', 'NCBI:NBK11533'),
] as const

export const EYE_WAVE3_RETINAL_LAYER_ORDER = [
  'retinal-pigment-epithelium',
  'photoreceptor-layer',
  'external-limiting-membrane',
  'outer-nuclear-layer',
  'outer-plexiform-layer',
  'inner-nuclear-layer',
  'inner-plexiform-layer',
  'ganglion-cell-layer',
  'nerve-fiber-layer',
  'internal-limiting-membrane',
] as const

export const EYE_WAVE3_REQUIRED_CELL_CLASSES = [
  'rod-photoreceptors',
  'cone-photoreceptors',
  'retinal-bipolar-cells',
  'retinal-horizontal-cells',
  'retinal-amacrine-cells',
  'retinal-ganglion-cells',
  'muller-glia',
  'corneal-superficial-epithelial-cells',
  'corneal-wing-cells',
  'corneal-basal-epithelial-cells',
  'corneal-keratocytes',
  'corneal-endothelial-cells',
] as const

export const EYE_WAVE3_SCIENTIFIC_BOUNDARY =
  'Histology reference only. Do not fabricate cell counts, density, layer thickness, OCT segmentation, microscopy coordinates, pathology, patient-specific morphology, or synthetic microscopic geometry.'

const evidencePattern = /^NCBI:NBK\d+$/

export function validateEyeHistologyWave3(records: readonly EyeHistologyNode[] = EYE_HISTOLOGY_WAVE3): string[] {
  const errors: string[] = []
  const wave1Ids = new Set(EYE_VISIBLE_WAVE1.map((item) => item.id))
  const wave2Ids = new Set(EYE_STRUCTURAL_WAVE2.map((item) => item.id))
  const ids = new Set<string>()

  for (const item of records) {
    if (ids.has(item.id)) errors.push(`duplicate:${item.id}`)
    ids.add(item.id)
    if (!item.label.trim()) errors.push(`label:${item.id}`)
    if (!evidencePattern.test(item.evidenceAnchor)) errors.push(`evidence:${item.id}`)
    if (item.geometryStatus !== 'reference-only') errors.push(`geometry:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
    if (item.representationPolicy !== 'histology-reference-only') errors.push(`representation:${item.id}`)
  }

  for (const item of records) {
    if (!ids.has(item.parentId) && !wave1Ids.has(item.parentId) && !wave2Ids.has(item.parentId)) {
      errors.push(`parent:${item.id}:${item.parentId}`)
    }
  }

  for (const id of EYE_WAVE3_RETINAL_LAYER_ORDER) if (!ids.has(id)) errors.push(`retinal-layer:${id}`)
  for (const id of EYE_WAVE3_REQUIRED_CELL_CLASSES) if (!ids.has(id)) errors.push(`cell-class:${id}`)
  return errors
}
