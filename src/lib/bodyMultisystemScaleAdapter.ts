import {
  MULTISYSTEM_DOMAINS,
  MULTISYSTEM_REFERENCES,
  MULTISYSTEM_SCALES,
  type EvidenceStatus,
  type KnowledgeScale,
  type MultisystemDomain,
} from './multisystemKnowledgeGraph'

export type MultisystemRepresentation =
  | 'spatial-3d'
  | 'microanatomy-reference'
  | 'cellular-diagram'
  | 'molecular-network'
  | 'neural-network'
  | 'endocrine-network'
  | 'cognition-network-model'
  | 'regeneration-timeline'
  | 'longevity-research-map'

export interface BodyMultisystemScaleView {
  scale: KnowledgeScale
  label: string
  representation: MultisystemRepresentation
  geometryRequired: boolean
  patientSpecificAllowed: false
  clinicalInferenceAllowed: false
  evidenceBoundary: EvidenceStatus | 'mixed-by-domain'
  note: string
}

export interface BodyMultisystemDomainView {
  id: string
  label: string
  scales: readonly KnowledgeScale[]
  anchors: readonly string[]
  note: string
}

const SCALE_VIEW: Readonly<Record<KnowledgeScale, Omit<BodyMultisystemScaleView, 'scale'>>> = {
  'whole-body': { label: 'Whole body', representation: 'spatial-3d', geometryRequired: true, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Use source-controlled atlas geometry only; generic atlas anatomy is never patient-specific.' },
  system: { label: 'Organ system', representation: 'spatial-3d', geometryRequired: true, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'System navigation may combine represented organs but must preserve source and review status.' },
  organ: { label: 'Organ', representation: 'spatial-3d', geometryRequired: true, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Only represented source geometry may be highlighted as anatomy.' },
  tissue: { label: 'Tissue', representation: 'microanatomy-reference', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Prefer sourced histology/microanatomy reference when gross mesh cannot resolve tissue scale.' },
  cell: { label: 'Cell', representation: 'cellular-diagram', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Cellular views are educational reference layers unless explicit source geometry exists.' },
  organelle: { label: 'Organelle', representation: 'cellular-diagram', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Organelle visualization should be schematic or source-derived rather than fabricated as continuous gross-body geometry.' },
  'molecular-pathway': { label: 'Molecular pathway', representation: 'molecular-network', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Pathways are network models, not spatial anatomy and not individualized pathway activity.' },
  protein: { label: 'Protein', representation: 'molecular-network', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Protein identity/function requires source-specific evidence; atlas selection does not imply expression.' },
  rna: { label: 'RNA', representation: 'molecular-network', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'RNA reference data must remain distinct from measured transcriptomics and patient interpretation.' },
  'dna-epigenome': { label: 'DNA / epigenome', representation: 'molecular-network', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Genomic and epigenomic reference layers cannot infer an individual genotype, phenotype, disease, or thought.' },
  'neural-circuit': { label: 'Neural circuit', representation: 'neural-network', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Circuit models may connect anatomy and function but must preserve uncertainty and distributed-network context.' },
  'endocrine-signal': { label: 'Endocrine signal', representation: 'endocrine-network', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Hormonal axes are context-dependent networks; they do not deterministically explain personality or thought.' },
  'cognition-behavior': { label: 'Cognition / behavior', representation: 'cognition-network-model', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Cognitive functions are emergent network-level teaching models, never one-region/one-gene deterministic claims.' },
  'development-regeneration': { label: 'Development / regeneration', representation: 'regeneration-timeline', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'mixed-by-domain', note: 'Stem-cell and regenerative findings must remain indication- and evidence-stage specific.' },
  'aging-longevity': { label: 'Aging / longevity', representation: 'longevity-research-map', geometryRequired: false, patientSpecificAllowed: false, clinicalInferenceAllowed: false, evidenceBoundary: 'research-frontier', note: 'Longevity and rejuvenation are research domains; never present immortality or proven personal age reversal.' },
}

export function getBodyMultisystemScaleView(scale: KnowledgeScale): BodyMultisystemScaleView {
  return { scale, ...SCALE_VIEW[scale] }
}

export function listBodyMultisystemScaleViews(): readonly BodyMultisystemScaleView[] {
  return MULTISYSTEM_SCALES.map(getBodyMultisystemScaleView)
}

export function listBodyMultisystemDomains(scale?: KnowledgeScale): readonly BodyMultisystemDomainView[] {
  const domains: readonly MultisystemDomain[] = scale
    ? MULTISYSTEM_DOMAINS.filter((domain) => domain.scales.includes(scale))
    : MULTISYSTEM_DOMAINS

  return domains.map((domain) => ({
    id: domain.id,
    label: domain.label,
    scales: domain.scales,
    anchors: domain.anchors,
    note: domain.notes,
  }))
}

export function getBodyMultisystemReferenceBoundary() {
  return {
    mandatoryReferenceIds: MULTISYSTEM_REFERENCES.map((reference) => reference.id),
    externalUxReferences: MULTISYSTEM_REFERENCES
      .filter((reference) => reference.role !== 'scientific-evidence')
      .map((reference) => ({ id: reference.id, url: reference.url, evidenceStatus: reference.evidenceStatus })),
    scientificEvidence: MULTISYSTEM_REFERENCES
      .filter((reference) => reference.role === 'scientific-evidence')
      .map((reference) => ({ id: reference.id, pmid: reference.pmid, evidenceStatus: reference.evidenceStatus })),
    patientSpecificInference: false as const,
    diagnosisOrTreatment: false as const,
    immortalityClaim: false as const,
  }
}
