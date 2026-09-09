import { EYE_HISTOLOGY_WAVE3 } from './eyeHistologyWave3'

export type EyeCellularDomain = 'photoreceptor' | 'rpe'
export type EyeCellularKind = 'organelle' | 'ultrastructure' | 'cell-compartment'

export interface EyeCellularNode {
  id: string
  label: string
  domain: EyeCellularDomain
  kind: EyeCellularKind
  parentId: string
  evidenceAnchor: string
  geometryStatus: 'reference-only'
  reviewStatus: 'academic-review-pending'
  representationPolicy: 'cellular-reference-only'
  selectable: boolean
  notes?: string
}

const C = (
  id: string,
  label: string,
  domain: EyeCellularDomain,
  kind: EyeCellularKind,
  parentId: string,
  evidenceAnchor: string,
  notes?: string,
): EyeCellularNode => ({
  id,
  label,
  domain,
  kind,
  parentId,
  evidenceAnchor,
  geometryStatus: 'reference-only',
  reviewStatus: 'academic-review-pending',
  representationPolicy: 'cellular-reference-only',
  selectable: true,
  notes,
})

/**
 * Eye Wave 4 descends only to evidence-backed cellular compartments and organelles.
 * It is not a molecular/pathway dataset and does not encode quantities, dimensions,
 * coordinates, dynamics, disease inference, or patient-specific ultrastructure.
 */
export const EYE_CELLULAR_WAVE4: readonly EyeCellularNode[] = [
  // Rod photoreceptor ultrastructure.
  C('rod-outer-segment-discs', 'Rod outer-segment membrane discs', 'photoreceptor', 'ultrastructure', 'rod-outer-segment', 'NCBI:NBK11522'),
  C('rod-connecting-cilium', 'Rod connecting cilium', 'photoreceptor', 'cell-compartment', 'rod-photoreceptors', 'NCBI:NBK11522'),
  C('rod-inner-segment-mitochondria', 'Rod inner-segment mitochondria', 'photoreceptor', 'organelle', 'rod-inner-segment', 'NCBI:NBK11522'),
  C('rod-inner-segment-ribosomes', 'Rod inner-segment ribosomes', 'photoreceptor', 'organelle', 'rod-inner-segment', 'NCBI:NBK11522'),
  C('rod-inner-segment-golgi', 'Rod inner-segment Golgi apparatus', 'photoreceptor', 'organelle', 'rod-inner-segment', 'NCBI:NBK11522'),
  C('rod-transport-vesicles', 'Rod inner-segment cytoplasmic transport vesicles', 'photoreceptor', 'organelle', 'rod-inner-segment', 'NCBI:NBK11522'),
  C('rod-nucleus', 'Rod photoreceptor nucleus', 'photoreceptor', 'organelle', 'rod-photoreceptors', 'NCBI:NBK11522'),
  C('rod-synaptic-vesicles', 'Rod spherule synaptic vesicles', 'photoreceptor', 'organelle', 'rod-spherule', 'NCBI:NBK11522'),
  C('rod-synaptic-ribbon', 'Rod photoreceptor synaptic ribbon', 'photoreceptor', 'ultrastructure', 'rod-spherule', 'NCBI:NBK6214'),

  // Cone photoreceptor ultrastructure.
  C('cone-outer-segment-discs', 'Cone outer-segment membrane discs', 'photoreceptor', 'ultrastructure', 'cone-outer-segment', 'NCBI:NBK11522'),
  C('cone-connecting-cilium', 'Cone connecting cilium', 'photoreceptor', 'cell-compartment', 'cone-photoreceptors', 'NCBI:NBK11522'),
  C('cone-inner-segment-mitochondria', 'Cone inner-segment mitochondria', 'photoreceptor', 'organelle', 'cone-inner-segment', 'NCBI:NBK11522'),
  C('cone-inner-segment-ribosomes', 'Cone inner-segment ribosomes', 'photoreceptor', 'organelle', 'cone-inner-segment', 'NCBI:NBK11522'),
  C('cone-inner-segment-golgi', 'Cone inner-segment Golgi apparatus', 'photoreceptor', 'organelle', 'cone-inner-segment', 'NCBI:NBK11522'),
  C('cone-transport-vesicles', 'Cone inner-segment cytoplasmic transport vesicles', 'photoreceptor', 'organelle', 'cone-inner-segment', 'NCBI:NBK11522'),
  C('cone-nucleus', 'Cone photoreceptor nucleus', 'photoreceptor', 'organelle', 'cone-photoreceptors', 'NCBI:NBK11522'),
  C('cone-synaptic-vesicles', 'Cone pedicle synaptic vesicles', 'photoreceptor', 'organelle', 'cone-pedicle', 'NCBI:NBK11522'),
  C('cone-synaptic-ribbon', 'Cone photoreceptor synaptic ribbon', 'photoreceptor', 'ultrastructure', 'cone-pedicle', 'NCBI:NBK6214'),

  // Retinal pigment epithelium organelles.
  C('rpe-apical-melanosomes', 'RPE apical melanosomes', 'rpe', 'organelle', 'retinal-pigment-epithelium', 'PMID:35309899'),
  C('rpe-phagosomes', 'RPE photoreceptor-outer-segment phagosomes', 'rpe', 'organelle', 'retinal-pigment-epithelium', 'PMID:35309899'),
  C('rpe-phagolysosomal-compartment', 'RPE phagolysosomal degradation compartment', 'rpe', 'cell-compartment', 'rpe-phagosomes', 'PMID:16524426', 'Conceptual degradation compartment only; do not infer count, position, or disease state.'),
] as const

export const EYE_WAVE4_REQUIRED_IDS = [
  'rod-outer-segment-discs', 'rod-connecting-cilium', 'rod-inner-segment-mitochondria',
  'rod-inner-segment-ribosomes', 'rod-inner-segment-golgi', 'rod-transport-vesicles',
  'rod-nucleus', 'rod-synaptic-vesicles', 'rod-synaptic-ribbon',
  'cone-outer-segment-discs', 'cone-connecting-cilium', 'cone-inner-segment-mitochondria',
  'cone-inner-segment-ribosomes', 'cone-inner-segment-golgi', 'cone-transport-vesicles',
  'cone-nucleus', 'cone-synaptic-vesicles', 'cone-synaptic-ribbon',
  'rpe-apical-melanosomes', 'rpe-phagosomes',
] as const

export const EYE_WAVE4_SCIENTIFIC_BOUNDARY =
  'Cellular reference only. Do not fabricate organelle counts, dimensions, coordinates, membrane kinetics, molecular interactions, disease state, patient-specific ultrastructure, or synthetic electron microscopy.'

const evidencePattern = /^(NCBI:NBK\d+|PMID:\d+)$/

export function validateEyeCellularWave4(records: readonly EyeCellularNode[] = EYE_CELLULAR_WAVE4): string[] {
  const errors: string[] = []
  const wave3Ids = new Set(EYE_HISTOLOGY_WAVE3.map((item) => item.id))
  const ids = new Set<string>()

  for (const item of records) {
    if (ids.has(item.id)) errors.push(`duplicate:${item.id}`)
    ids.add(item.id)
    if (!item.label.trim()) errors.push(`label:${item.id}`)
    if (!evidencePattern.test(item.evidenceAnchor)) errors.push(`evidence:${item.id}`)
    if (item.geometryStatus !== 'reference-only') errors.push(`geometry:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
    if (item.representationPolicy !== 'cellular-reference-only') errors.push(`representation:${item.id}`)
  }

  for (const item of records) {
    if (!ids.has(item.parentId) && !wave3Ids.has(item.parentId)) errors.push(`parent:${item.id}:${item.parentId}`)
  }
  for (const id of EYE_WAVE4_REQUIRED_IDS) if (!ids.has(id)) errors.push(`required:${id}`)
  return errors
}
