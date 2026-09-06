export type KnowledgeLayer = 'educational' | 'patient-derived' | 'clinical-inference'
export type EvidenceStatus = 'reference' | 'observed' | 'rule-backed' | 'research-only'
export type ScaleKey = 'whole-body' | 'system' | 'organ' | 'tissue' | 'cell' | 'organelle' | 'molecule'

export interface Provenance {
  layer: KnowledgeLayer
  status: EvidenceStatus
  source: string
  sourceId?: string
  note: string
}

export interface ScaleNode {
  id: string
  label: string
  scale: ScaleKey
  subtitle: string
  focusKeywords?: string[]
  highlights?: string[]
  layerHints?: Array<'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid'>
  provenance: Provenance
}

export interface TwinFinding {
  id: string
  title: string
  detail: string
  layer: KnowledgeLayer
  confidence?: number
  source: string
  sourceId?: string
}

export interface TimelineState {
  id: string
  label: string
  heartRate: number
  respRate: number
  contractionRate: number
  peristalsisRate: number
  note: string
}

export interface DataConnector {
  name: string
  domain: string
  standard: string
  state: 'local' | 'adapter-ready' | 'planned'
  purpose: string
}

export const SCALE_PATH: ScaleNode[] = [
  {
    id: 'human', label: 'Human', scale: 'whole-body', subtitle: 'Whole-body anatomy & physiology',
    layerHints: ['skeletal', 'muscular', 'visceral'],
    provenance: { layer: 'educational', status: 'reference', source: 'Z-Anatomy / BodyParts3D', note: 'Open anatomical mesh atlas; not patient anatomy.' },
  },
  {
    id: 'respiratory', label: 'Respiratory', scale: 'system', subtitle: 'Airway, lungs, circulation',
    focusKeywords: ['lung', 'bronch', 'trachea'], layerHints: ['visceral', 'cardiovascular'],
    provenance: { layer: 'educational', status: 'reference', source: 'Z-Anatomy / BodyParts3D', note: 'System-level educational anatomy.' },
  },
  {
    id: 'lung', label: 'Lung', scale: 'organ', subtitle: 'Lobes, bronchi & lesion context',
    focusKeywords: ['lung'], layerHints: ['visceral', 'cardiovascular'],
    provenance: { layer: 'educational', status: 'reference', source: 'Z-Anatomy / BodyParts3D', note: 'Organ geometry for orientation.' },
  },
  {
    id: 'alveolus', label: 'Alveolus', scale: 'tissue', subtitle: 'Gas-exchange microanatomy',
    provenance: { layer: 'educational', status: 'reference', source: 'Histology knowledge layer', note: 'Schematic micro-scale view until a WSI/patient specimen is linked.' },
  },
  {
    id: 'epithelial-cell', label: 'Epithelial cell', scale: 'cell', subtitle: 'Cell state & phenotype',
    provenance: { layer: 'educational', status: 'reference', source: 'Cell ontology knowledge layer', note: 'Educational cell model; not single-cell patient data.' },
  },
  {
    id: 'nucleus', label: 'Nucleus / DNA', scale: 'organelle', subtitle: 'Genome & transcription',
    provenance: { layer: 'educational', status: 'reference', source: 'Genome knowledge layer', note: 'Variant overlays require patient sequencing data.' },
  },
  {
    id: 'egfr-mapk', label: 'EGFR → MAPK', scale: 'molecule', subtitle: 'Target → pathway → phenotype',
    provenance: { layer: 'educational', status: 'reference', source: 'Reactome / UniProt / Open Targets adapters', note: 'Pathway visualization is educational until evidence is bound to a patient result.' },
  },
]

export const DEMO_FINDINGS: TwinFinding[] = [
  {
    id: 'demo-lesion',
    title: 'Synthetic CT finding: right upper-lobe nodule',
    detail: '24 mm demonstration lesion used only to exercise lesion → anatomy → pathology → molecular navigation.',
    layer: 'patient-derived',
    confidence: 1,
    source: 'Synthetic demo dataset',
    sourceId: 'DEMO-CT-001',
  },
  {
    id: 'demo-pathology',
    title: 'Histology placeholder',
    detail: 'No pathology specimen is connected. The engine must not infer histology from the 3D mesh or CT demonstration.',
    layer: 'patient-derived',
    source: 'No specimen connected',
  },
  {
    id: 'demo-rule',
    title: 'Clinical inference gate',
    detail: 'Production inference remains locked until a versioned clinical rule/guideline pack and all required patient inputs are present.',
    layer: 'clinical-inference',
    source: 'PanaceaMed provenance contract',
  },
]

export const TIMELINE: TimelineState[] = [
  { id: 'baseline', label: 'Baseline', heartRate: 70, respRate: 14, contractionRate: 0, peristalsisRate: 8, note: 'Educational resting physiology.' },
  { id: 'stress', label: 'Physiologic stress', heartRate: 96, respRate: 22, contractionRate: 0, peristalsisRate: 5, note: 'Demonstration state, not a disease-specific prediction.' },
  { id: 'exercise', label: 'Exercise', heartRate: 160, respRate: 40, contractionRate: 30, peristalsisRate: 3, note: 'Whole-body motion state for physiology teaching.' },
  { id: 'recovery', label: 'Recovery', heartRate: 82, respRate: 18, contractionRate: 0, peristalsisRate: 6, note: 'Demonstration recovery state.' },
]

export const CONNECTORS: DataConnector[] = [
  { name: 'Z-Anatomy / BodyParts3D', domain: '3D anatomy', standard: 'GLB / named meshes', state: 'local', purpose: 'Whole-body structure geometry and picking.' },
  { name: 'DICOMweb', domain: 'Radiology', standard: 'DICOM / DICOM SEG / SR', state: 'adapter-ready', purpose: 'Patient imaging, segmentations, measurements and lesion provenance.' },
  { name: 'FHIR', domain: 'Clinical data', standard: 'HL7 FHIR', state: 'adapter-ready', purpose: 'Problems, observations, medications, reports and provenance.' },
  { name: 'Digital pathology', domain: 'Histology', standard: 'DICOM WSI', state: 'planned', purpose: 'Whole-slide images, regions of interest and pathology annotations.' },
  { name: 'ClinVar / Ensembl', domain: 'Genomics', standard: 'VCF + normalized variant IDs', state: 'planned', purpose: 'Variant annotation and gene-level overlays.' },
  { name: 'Reactome / UniProt', domain: 'Pathways', standard: 'Stable biological identifiers', state: 'adapter-ready', purpose: 'Protein, reaction and pathway navigation.' },
  { name: 'Open Targets / ChEMBL / PubChem', domain: 'Drug discovery', standard: 'Target / compound identifiers', state: 'adapter-ready', purpose: 'Target evidence, compounds and mechanism-of-action exploration.' },
  { name: 'SNOMED CT / ICD / LOINC / RxNorm', domain: 'Terminology', standard: 'Clinical terminologies', state: 'planned', purpose: 'Normalize diagnoses, observations, labs and medications with licensing respected.' },
]

export const FORMULAS = [
  { name: 'Tissue strain', formula: 'ε = (L − L₀) / L₀', meaning: 'Relative deformation of a tissue or ligament.' },
  { name: 'Mechanical stress', formula: 'σ = F / A', meaning: 'Force distributed over cross-sectional area.' },
  { name: 'Joint torque', formula: 'τ = r × F', meaning: 'Rotational effect of force about a joint.' },
  { name: 'CT window mapping', formula: 'I = clamp((HU − (L − W/2)) / W, 0, 1)', meaning: 'Maps Hounsfield units to display intensity for width W and level L.' },
  { name: 'Receptor occupancy', formula: 'θ = C / (C + Kd)', meaning: 'Simple equilibrium occupancy model; not a dose recommendation.' },
]

export const DISCOVERY_STEPS = [
  'Phenotype / lesion', 'Omics signal', 'Causal hypothesis', 'Target evidence', 'Structure / binding', 'Compound evidence', 'Preclinical validation', 'Clinical evidence', 'Safety & pharmacovigilance',
]

export function layerLabel(layer: KnowledgeLayer): string {
  if (layer === 'educational') return 'Educational'
  if (layer === 'patient-derived') return 'Patient-derived'
  return 'Clinical inference'
}
