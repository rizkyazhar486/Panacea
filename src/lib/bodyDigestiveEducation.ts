import type { BodySystemId } from './bodySystemSourceWave'

export type DigestiveNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type DigestiveEvidenceState = 'source-backed' | 'literature-backed' | 'educational-only'

export interface DigestiveEvidence {
  kind: 'atlas-source' | 'pubmed'
  id: string
  url?: string
  note: string
}

export interface DigestiveEducationNode {
  id: string
  label: string
  kind: DigestiveNodeKind
  evidenceState: DigestiveEvidenceState
  evidence: readonly DigestiveEvidence[]
  boundary: string
}

export interface DigestiveEducationEdge {
  from: string
  to: string
  relationship: 'supports' | 'disruption-associated-with' | 'educational-context'
  note: string
}

export const DIGESTIVE_SYSTEM_ID: BodySystemId = 'digestive'

/** Organ/system-specific digestive relationships for Body Exposure. */
export const DIGESTIVE_EDUCATION_NODES: readonly DigestiveEducationNode[] = [
  {
    id: 'digestive-gross-reference',
    label: 'Digestive tract and accessory-organ reference',
    kind: 'anatomy',
    evidenceState: 'source-backed',
    evidence: [{ kind: 'atlas-source', id: 'visceral.glb', note: 'Repository source bundle used for esophagus, stomach, bowel, liver, gallbladder, and pancreas gross orientation.' }],
    boundary: 'Reference atlas geometry; not patient-specific anatomy and not microscopic mucosa, enteric neural circuitry, vascular perfusion, duct patency, luminal contents, or measured organ dimensions.',
  },
  {
    id: 'digestive-enteric-motility',
    label: 'Enteric sensory-motor coordination',
    kind: 'physiology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '32152479', url: 'https://pubmed.ncbi.nlm.nih.gov/32152479/', note: 'Review describes enteric sensory transduction, neural circuits, and coordination of gastrointestinal motility.' },
      { kind: 'pubmed', id: '22392290', url: 'https://pubmed.ncbi.nlm.nih.gov/22392290/', note: 'Review describes enteric and central neural integration in control of gastrointestinal musculature and digestive function.' },
    ],
    boundary: 'Educational physiology only; no person-level transit time, pressure, motility index, secretion rate, absorption, microbiome state, autonomic tone, or gastrointestinal function is inferred.',
  },
  {
    id: 'digestive-barrier-inflammation',
    label: 'Intestinal barrier and inflammatory context',
    kind: 'pathophysiology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '35273921', url: 'https://pubmed.ncbi.nlm.nih.gov/35273921/', note: 'Review discusses interactions among intestinal microbiota, mucosal barrier disruption, and abnormal immune responses in inflammatory bowel disease.' },
      { kind: 'pubmed', id: '40086468', url: 'https://pubmed.ncbi.nlm.nih.gov/40086468/', note: 'Review describes intestinal barrier regulation and inflammatory consequences of epithelial and mucosal barrier disruption.' },
    ],
    boundary: 'Mechanism education only; does not diagnose inflammatory bowel disease, infection, permeability abnormality, dysbiosis, malignancy, severity, complication, or individual inflammatory state.',
  },
  {
    id: 'digestive-acid-suppression-context',
    label: 'Gastric acid suppression context',
    kind: 'pharmacology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '31670611', url: 'https://pubmed.ncbi.nlm.nih.gov/31670611/', note: 'Physiology review describes parietal-cell H+/K+-ATPase-mediated acid secretion and pharmacologic inhibition by proton-pump inhibitors.' },
      { kind: 'pubmed', id: '21897223', url: 'https://pubmed.ncbi.nlm.nih.gov/21897223/', note: 'Review describes regulation of gastric acid secretion and proton-pump inhibitor interaction with gastric H+/K+-ATPase.' },
    ],
    boundary: 'Pharmacology education only; no indication confirmation, drug choice, dose, duration, deprescribing decision, interaction screen, monitoring plan, or patient-specific treatment is produced.',
  },
  {
    id: 'digestive-imaging-context',
    label: 'Digestive imaging context',
    kind: 'imaging',
    evidenceState: 'educational-only',
    evidence: [],
    boundary: 'Placeholder relationship only: no radiograph, ultrasound, CT, MRI, fluoroscopy, endoscopy, nuclear imaging, segmentation, lesion detection, obstruction assessment, or image interpretation is represented until modality-specific evidence and reviewed assets are added.',
  },
] as const

export const DIGESTIVE_EDUCATION_EDGES: readonly DigestiveEducationEdge[] = [
  { from: 'digestive-gross-reference', to: 'digestive-enteric-motility', relationship: 'educational-context', note: 'Gross digestive orientation leads into enteric motor physiology without implying source-backed neural, histologic, or functional spatial correspondence.' },
  { from: 'digestive-enteric-motility', to: 'digestive-barrier-inflammation', relationship: 'educational-context', note: 'Physiology and inflammatory-barrier concepts are adjacent teaching contexts, not a claim that motility measurements diagnose or quantify inflammation.' },
  { from: 'digestive-gross-reference', to: 'digestive-acid-suppression-context', relationship: 'educational-context', note: 'Stomach orientation links to acid-suppression mechanism education without implying an indication, prescription, response, or individual acid output.' },
  { from: 'digestive-gross-reference', to: 'digestive-imaging-context', relationship: 'educational-context', note: 'Imaging remains explicitly unavailable until modality-specific source provenance and reviewed assets are present.' },
] as const

export function validateDigestiveEducationGraph() {
  const ids = new Set(DIGESTIVE_EDUCATION_NODES.map((node) => node.id))
  const duplicateIds = ids.size !== DIGESTIVE_EDUCATION_NODES.length
  const danglingEdges = DIGESTIVE_EDUCATION_EDGES.filter((edge) => !ids.has(edge.from) || !ids.has(edge.to))
  const unsupportedLiteratureNodes = DIGESTIVE_EDUCATION_NODES.filter(
    (node) => node.evidenceState === 'literature-backed' && !node.evidence.some((item) => item.kind === 'pubmed'),
  )
  const boundaryMissing = DIGESTIVE_EDUCATION_NODES.filter((node) => !node.boundary.trim())
  return { duplicateIds, danglingEdges, unsupportedLiteratureNodes, boundaryMissing }
}
