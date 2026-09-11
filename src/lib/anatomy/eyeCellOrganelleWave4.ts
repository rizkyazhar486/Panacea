import { EYE_HISTOLOGY_WAVE3 } from './eyeHistologyWave3'

export type EyeWave4Domain = 'photoreceptor' | 'rpe'
export type EyeWave4Kind =
  | 'cell-compartment'
  | 'organelle'
  | 'membrane-specialization'
  | 'cytoskeletal-structure'
  | 'synaptic-specialization'

export interface EyeCellOrganelleNode {
  id: string
  label: string
  domain: EyeWave4Domain
  kind: EyeWave4Kind
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
  domain: EyeWave4Domain,
  kind: EyeWave4Kind,
  parentId: string,
  evidenceAnchor: string,
  notes?: string,
): EyeCellOrganelleNode => ({
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
 * Eye Wave 4 descends only into cellular compartments and organelles that have
 * defensible literature support. It is intentionally NOT a synthetic cell model.
 * No dimensions, copy numbers, organelle counts, molecular concentrations,
 * patient-specific morphology, disease state or inferred microscopy coordinates
 * may be generated from these records.
 */
export const EYE_CELL_ORGANELLE_WAVE4: readonly EyeCellOrganelleNode[] = [
  C('rod-connecting-cilium', 'Rod connecting cilium', 'photoreceptor', 'cell-compartment', 'rod-photoreceptors', 'PMID:34050409'),
  C('cone-connecting-cilium', 'Cone connecting cilium', 'photoreceptor', 'cell-compartment', 'cone-photoreceptors', 'PMID:34050409'),
  C('rod-basal-body', 'Rod photoreceptor basal body', 'photoreceptor', 'organelle', 'rod-connecting-cilium', 'PMID:34050409'),
  C('cone-basal-body', 'Cone photoreceptor basal body', 'photoreceptor', 'organelle', 'cone-connecting-cilium', 'PMID:34050409'),
  C('rod-ciliary-rootlet', 'Rod photoreceptor ciliary rootlet', 'photoreceptor', 'cytoskeletal-structure', 'rod-connecting-cilium', 'PMID:34050409'),
  C('cone-ciliary-rootlet', 'Cone photoreceptor ciliary rootlet', 'photoreceptor', 'cytoskeletal-structure', 'cone-connecting-cilium', 'PMID:34050409'),
  C('rod-inner-segment-ellipsoid', 'Rod inner-segment ellipsoid', 'photoreceptor', 'cell-compartment', 'rod-inner-segment', 'NCBI:NBK11522'),
  C('cone-inner-segment-ellipsoid', 'Cone inner-segment ellipsoid', 'photoreceptor', 'cell-compartment', 'cone-inner-segment', 'NCBI:NBK11522'),
  C('rod-inner-segment-mitochondria', 'Rod inner-segment mitochondria', 'photoreceptor', 'organelle', 'rod-inner-segment-ellipsoid', 'NCBI:NBK11522'),
  C('cone-inner-segment-mitochondria', 'Cone inner-segment mitochondria', 'photoreceptor', 'organelle', 'cone-inner-segment-ellipsoid', 'NCBI:NBK11522'),
  C('photoreceptor-golgi-apparatus', 'Photoreceptor Golgi apparatus', 'photoreceptor', 'organelle', 'photoreceptor-layer', 'PMID:19582864'),
  C('photoreceptor-endoplasmic-reticulum', 'Photoreceptor endoplasmic reticulum', 'photoreceptor', 'organelle', 'photoreceptor-layer', 'NCBI:NBK52768'),
  C('rod-inner-segment-ribosomes', 'Rod inner-segment ribosomes', 'photoreceptor', 'organelle', 'rod-inner-segment', 'NCBI:NBK11522'),
  C('cone-inner-segment-ribosomes', 'Cone inner-segment ribosomes', 'photoreceptor', 'organelle', 'cone-inner-segment', 'NCBI:NBK11522'),
  C('rod-inner-segment-transport-vesicles', 'Rod inner-segment cytoplasmic transport vesicles', 'photoreceptor', 'organelle', 'rod-inner-segment', 'NCBI:NBK11522', 'Reference transport compartment only; do not infer vesicle count, trajectory, rate, or cargo abundance.'),
  C('cone-inner-segment-transport-vesicles', 'Cone inner-segment cytoplasmic transport vesicles', 'photoreceptor', 'organelle', 'cone-inner-segment', 'NCBI:NBK11522', 'Reference transport compartment only; do not infer vesicle count, trajectory, rate, or cargo abundance.'),
  C('rod-photoreceptor-nucleus', 'Rod photoreceptor nucleus', 'photoreceptor', 'organelle', 'rod-photoreceptors', 'NCBI:NBK11522'),
  C('cone-photoreceptor-nucleus', 'Cone photoreceptor nucleus', 'photoreceptor', 'organelle', 'cone-photoreceptors', 'NCBI:NBK11522'),
  C('rod-outer-segment-discs', 'Rod outer-segment discs', 'photoreceptor', 'membrane-specialization', 'rod-outer-segment', 'NCBI:NBK11522', 'Rod discs are represented as membrane specializations, not individually reconstructed measured discs.'),
  C('cone-outer-segment-discs', 'Cone outer-segment membrane discs / lamellae', 'photoreceptor', 'membrane-specialization', 'cone-outer-segment', 'NCBI:NBK52768', 'Cone outer-segment lamellae remain membrane-continuous in the cited reference; do not reuse rod disc topology.'),
  C('rod-synaptic-vesicles', 'Rod spherule synaptic vesicles', 'photoreceptor', 'organelle', 'rod-spherule', 'NCBI:NBK11522', 'Reference-only vesicle compartment; no vesicle count or release-rate inference.'),
  C('cone-synaptic-vesicles', 'Cone pedicle synaptic vesicles', 'photoreceptor', 'organelle', 'cone-pedicle', 'NCBI:NBK11522', 'Reference-only vesicle compartment; no vesicle count or release-rate inference.'),
  C('rod-synaptic-ribbon', 'Rod spherule synaptic ribbon', 'photoreceptor', 'synaptic-specialization', 'rod-spherule', 'NCBI:NBK11522', 'Reference identity only; do not infer ribbon count, triad count, synaptic strength, or disease state.'),
  C('cone-synaptic-ribbon', 'Cone pedicle synaptic ribbon', 'photoreceptor', 'synaptic-specialization', 'cone-pedicle', 'NCBI:NBK11522', 'Reference identity only; do not infer ribbon count, triad count, synaptic strength, or disease state.'),
  C('rpe-apical-microvilli', 'RPE apical microvilli / processes', 'rpe', 'membrane-specialization', 'retinal-pigment-epithelium', 'NCBI:NBK54392'),
  C('rpe-basal-infoldings', 'RPE basal membrane infoldings', 'rpe', 'membrane-specialization', 'retinal-pigment-epithelium', 'PMID:32648890'),
  C('rpe-melanosomes', 'RPE melanosomes', 'rpe', 'organelle', 'retinal-pigment-epithelium', 'PMID:32648890'),
  C('rpe-mitochondria', 'RPE mitochondria', 'rpe', 'organelle', 'retinal-pigment-epithelium', 'PMID:32648890'),
  C('rpe-phagosomes', 'RPE photoreceptor-outer-segment phagosomes', 'rpe', 'organelle', 'retinal-pigment-epithelium', 'PMID:25074813'),
  C('rpe-phagosome-lysosomal-degradation-stage', 'RPE phagosome lysosomal-degradation stage', 'rpe', 'cell-compartment', 'rpe-phagosomes', 'PMID:16524426', 'Conceptual reference stage only: the cited review supports phagosome transport into the RPE cell body and lysosomal degradation of its contents. Do not present this as a measured phagolysosome geometry, infer compartment count or position, transport/degradation kinetics, molecular interactions, or disease state.'),
  C('rpe-lysosomes', 'RPE lysosomes', 'rpe', 'organelle', 'retinal-pigment-epithelium', 'PMID:8419462'),
] as const

export const EYE_WAVE4_REQUIRED_IDS = [
  'rod-connecting-cilium',
  'cone-connecting-cilium',
  'rod-basal-body',
  'cone-basal-body',
  'rod-inner-segment-mitochondria',
  'cone-inner-segment-mitochondria',
  'rod-inner-segment-ribosomes',
  'cone-inner-segment-ribosomes',
  'rod-inner-segment-transport-vesicles',
  'cone-inner-segment-transport-vesicles',
  'rod-photoreceptor-nucleus',
  'cone-photoreceptor-nucleus',
  'rod-outer-segment-discs',
  'cone-outer-segment-discs',
  'rod-synaptic-vesicles',
  'cone-synaptic-vesicles',
  'rod-synaptic-ribbon',
  'cone-synaptic-ribbon',
  'rpe-apical-microvilli',
  'rpe-basal-infoldings',
  'rpe-melanosomes',
  'rpe-phagosomes',
  'rpe-phagosome-lysosomal-degradation-stage',
  'rpe-lysosomes',
] as const

export const EYE_WAVE4_SCIENTIFIC_BOUNDARY =
  'Cellular reference only. Do not fabricate dimensions, organelle counts, copy numbers, concentrations, microscopy coordinates, vesicle or ribbon counts, transport, degradation or release kinetics, synaptic strength, molecular interactions, disease state, patient-specific morphology, synthetic cellular geometry, or molecular-function inference from visual motion.'

const evidencePattern = /^(NCBI:NBK\d+|PMID:\d+)$/

export function validateEyeCellOrganelleWave4(
  records: readonly EyeCellOrganelleNode[] = EYE_CELL_ORGANELLE_WAVE4,
): string[] {
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
    if (!item.selectable) errors.push(`selectable:${item.id}`)
  }

  for (const item of records) {
    if (!ids.has(item.parentId) && !wave3Ids.has(item.parentId)) errors.push(`parent:${item.id}:${item.parentId}`)
  }

  for (const id of EYE_WAVE4_REQUIRED_IDS) if (!ids.has(id)) errors.push(`required:${id}`)
  return errors
}
