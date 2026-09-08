export type KnowledgeScale =
  | 'whole-body'
  | 'system'
  | 'organ'
  | 'tissue'
  | 'cell'
  | 'organelle'
  | 'molecular-pathway'
  | 'protein'
  | 'rna'
  | 'dna-epigenome'
  | 'neural-circuit'
  | 'endocrine-signal'
  | 'cognition-behavior'
  | 'development-regeneration'
  | 'aging-longevity'

export type EvidenceStatus =
  | 'reference-only'
  | 'source-checked'
  | 'human-reviewed'
  | 'research-frontier'
  | 'unsupported'

export interface MultisystemDomain {
  id: string
  label: string
  scales: readonly KnowledgeScale[]
  anchors: readonly string[]
  notes: string
}

export interface KnowledgeReference {
  id: string
  title: string
  url: string
  role: 'ux-reference' | 'architecture-reference' | 'scientific-evidence'
  evidenceStatus: EvidenceStatus
  year?: number
  pmid?: string
  note: string
}

export interface MultisystemKnowledgeGraph {
  version: 1
  purpose: string
  scales: readonly KnowledgeScale[]
  domains: readonly MultisystemDomain[]
  mandatoryReferences: readonly KnowledgeReference[]
  interpretationBoundary: {
    educationalOnly: true
    patientSpecificInference: false
    diagnosisOrTreatment: false
    directGeneToThoughtClaim: false
    immortalityClaim: false
  }
}

export const MULTISYSTEM_SCALES: readonly KnowledgeScale[] = [
  'whole-body',
  'system',
  'organ',
  'tissue',
  'cell',
  'organelle',
  'molecular-pathway',
  'protein',
  'rna',
  'dna-epigenome',
  'neural-circuit',
  'endocrine-signal',
  'cognition-behavior',
  'development-regeneration',
  'aging-longevity',
]

export const MULTISYSTEM_DOMAINS: readonly MultisystemDomain[] = [
  { id: 'integumentary', label: 'Integumentary system', scales: ['system','organ','tissue','cell','molecular-pathway','protein','rna','dna-epigenome'], anchors: ['skin','hair','nails','cutaneous vessels','sensory endings','keratinocytes','melanocytes'], notes: 'Connect gross anatomy to barrier, sensory, immune and cellular reference layers without inferring patient-specific skin state.' },
  { id: 'musculoskeletal', label: 'Musculoskeletal system', scales: ['whole-body','system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome','neural-circuit','endocrine-signal'], anchors: ['bone','skeletal muscle','joint','tendon','ligament','motor unit','osteocyte','myofiber'], notes: 'Link structure, force transmission, motor control and remodeling as separate evidence layers; do not convert atlas geometry into individualized biomechanics.' },
  { id: 'cardiovascular', label: 'Cardiovascular system', scales: ['whole-body','system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome','neural-circuit','endocrine-signal'], anchors: ['heart','arteries','veins','microcirculation','cardiomyocytes','vascular endothelium','autonomic control'], notes: 'Keep anatomy, electrophysiology, hemodynamic concepts and molecular regulation distinct; reference visualization is not a live measurement.' },
  { id: 'respiratory', label: 'Respiratory system', scales: ['whole-body','system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome','neural-circuit','endocrine-signal'], anchors: ['airway','lung','alveolus','respiratory muscle','pulmonary circulation','central respiratory control'], notes: 'Supports atlas-style breathing visualization while separating motion storytelling from authoritative respiratory physiology evidence.' },
  { id: 'digestive-hepatobiliary', label: 'Digestive and hepatobiliary systems', scales: ['system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome','neural-circuit','endocrine-signal'], anchors: ['esophagus','stomach','intestine','liver','gallbladder','pancreas','enteric nervous system','microbiome-context'], notes: 'Represent anatomy, digestion, absorption, metabolism, endocrine and enteric-neural regulation as linked but separately sourced layers.' },
  { id: 'renal-urinary', label: 'Renal and urinary system', scales: ['system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome','neural-circuit','endocrine-signal'], anchors: ['kidney','nephron','glomerulus','tubule','ureter','bladder','renal endocrine signaling'], notes: 'Separate structural nephron reference from filtration, transport and endocrine teaching models; no patient-specific renal interpretation.' },
  { id: 'hematologic-immune-lymphatic', label: 'Hematologic, immune and lymphatic systems', scales: ['whole-body','system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome'], anchors: ['blood','bone marrow','spleen','lymph node','thymus','immune cell lineages','hematopoietic stem cells'], notes: 'Connect lineage, trafficking and molecular signaling without presenting reference pathways as individualized immune status.' },
  { id: 'endocrine', label: 'Endocrine system', scales: ['whole-body','system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome','neural-circuit','endocrine-signal','cognition-behavior'], anchors: ['hypothalamus','pituitary','thyroid','adrenal','pancreatic islet','gonads','feedback axes'], notes: 'Represent hormone signaling as context-dependent network regulation. Hormone pathways must not be reduced to deterministic explanations of mood, personality or thought.' },
  { id: 'nervous-system', label: 'Central, peripheral and autonomic nervous systems', scales: ['whole-body','system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome','neural-circuit','endocrine-signal','cognition-behavior'], anchors: ['brain','spinal cord','cranial nerves','peripheral nerves','autonomic pathways','neuron','glia','synapse'], notes: 'Connect macroanatomy to cells, synapses and circuits. Cognitive functions remain network-level models with uncertainty, not one-to-one mappings from a molecule or locus to a thought.' },
  { id: 'sensory', label: 'Sensory systems', scales: ['system','organ','tissue','cell','molecular-pathway','protein','rna','dna-epigenome','neural-circuit','cognition-behavior'], anchors: ['vision','hearing','vestibular','somatosensation','olfaction','taste','interoception'], notes: 'Keep receptor/transduction reference layers separate from perceptual experience and cognition.' },
  { id: 'reproductive-developmental', label: 'Reproductive and developmental biology', scales: ['system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome','endocrine-signal','development-regeneration'], anchors: ['gonads','reproductive tract','germ cells','fertilization','embryonic development','placenta','developmental signaling'], notes: 'Educational developmental biology only; no fertility prediction or patient-specific reproductive inference.' },
  { id: 'cell-molecular-genomics', label: 'Cell, molecular biology, genomics and RNA', scales: ['cell','organelle','molecular-pathway','protein','rna','dna-epigenome','development-regeneration','aging-longevity'], anchors: ['nucleus','mitochondrion','ribosome','cytoskeleton','DNA','epigenome','mRNA','non-coding RNA','protein synthesis','signal transduction'], notes: 'Cross-cutting molecular layer for every organ system. Reference sequence/pathway information is not automatically a diagnostic or therapeutic interpretation.' },
  { id: 'brain-cognition', label: 'Brain function, cognition and behavior', scales: ['organ','tissue','cell','molecular-pathway','protein','rna','dna-epigenome','neural-circuit','endocrine-signal','cognition-behavior'], anchors: ['attention','memory','language','executive function','emotion','decision-making','learning','conscious-state research'], notes: 'Cognition is represented as an emergent network-level teaching domain. The graph forbids deterministic gene→thought, hormone→personality or single-region→complex-behavior claims.' },
  { id: 'stem-cell-regeneration', label: 'Stem cells, regeneration and iPSC science', scales: ['cell','organelle','molecular-pathway','protein','rna','dna-epigenome','development-regeneration'], anchors: ['pluripotency','somatic reprogramming','lineage specification','organoids','cell replacement','tissue repair'], notes: 'Includes Japanese iPSC lineage from Takahashi/Yamanaka and later clinical translation work. Therapeutic readiness must be evaluated per indication and trial; no universal regeneration claim.' },
  { id: 'aging-longevity', label: 'Aging, healthspan and longevity research', scales: ['whole-body','system','organ','tissue','cell','organelle','molecular-pathway','protein','rna','dna-epigenome','endocrine-signal','development-regeneration','aging-longevity'], anchors: ['cellular senescence','genomic stability','epigenetic state','proteostasis','mitochondrial biology','stem-cell exhaustion','organ-on-chip aging models','partial reprogramming research'], notes: 'Research frontier only. Healthspan/longevity mechanisms may be modeled, but the system must never label immortality, age reversal in a person, or indefinite lifespan as established or clinically validated.' },
]

export const MULTISYSTEM_REFERENCES: readonly KnowledgeReference[] = [
  { id: 'thebuggeddev-anatomy', title: 'thebuggeddev/anatomy', url: 'https://github.com/thebuggeddev/anatomy', role: 'architecture-reference', evidenceStatus: 'reference-only', note: 'Mandatory Body Exposure architecture/UX reference. Do not copy code, models, textures or labels unless license and asset provenance are separately verified.' },
  { id: 'breath-atlas-thebuggeddev', title: 'Breath Atlas', url: 'https://breath-atlas.thebuggeddev.chatgpt.site/', role: 'ux-reference', evidenceStatus: 'reference-only', note: 'Mandatory respiratory visualization and interaction reference. It is not an authoritative physiology source and must not be used to validate medical claims.' },
  { id: 'takahashi-yamanaka-2006-ipsc', title: 'Takahashi & Yamanaka 2006 iPSC induction', url: 'https://pubmed.ncbi.nlm.nih.gov/16904174/', role: 'scientific-evidence', evidenceStatus: 'source-checked', year: 2006, pmid: '16904174', note: 'Foundational Japanese iPSC work demonstrating reprogramming of differentiated fibroblasts with defined factors in a preclinical experimental context.' },
  { id: 'jun-takahashi-2025-ipsc-cell-replacement', title: 'Jun Takahashi 2025 iPSC-based cell replacement therapy review', url: 'https://pubmed.ncbi.nlm.nih.gov/39969437/', role: 'scientific-evidence', evidenceStatus: 'source-checked', year: 2025, pmid: '39969437', note: 'Current Japanese translational iPSC evidence anchor covering cell-replacement development and Parkinson disease as a major clinical example; not proof of broad or universal efficacy.' },
  { id: 'aging-on-chip-2025', title: 'Aging on Chip 2025 review', url: 'https://pubmed.ncbi.nlm.nih.gov/40509615/', role: 'scientific-evidence', evidenceStatus: 'research-frontier', year: 2025, pmid: '40509615', note: 'Research-frontier anchor for organ-on-chip aging models, senescence, single-cell approaches and partial reprogramming. It supports longevity research, not an immortality or proven human rejuvenation claim.' },
]

export const MULTISYSTEM_KNOWLEDGE_GRAPH: MultisystemKnowledgeGraph = {
  version: 1,
  purpose: 'A lightweight canonical contract linking whole-body anatomy to organ, tissue, cell, organelle, molecular pathway, protein, RNA, DNA/epigenome, neural, endocrine, cognition, regeneration and aging layers without fabricating patient-specific inference.',
  scales: MULTISYSTEM_SCALES,
  domains: MULTISYSTEM_DOMAINS,
  mandatoryReferences: MULTISYSTEM_REFERENCES,
  interpretationBoundary: { educationalOnly: true, patientSpecificInference: false, diagnosisOrTreatment: false, directGeneToThoughtClaim: false, immortalityClaim: false },
}

export function getMultisystemDomain(id: string): MultisystemDomain | undefined { return MULTISYSTEM_DOMAINS.find((domain) => domain.id === id) }
export function getDomainsForScale(scale: KnowledgeScale): readonly MultisystemDomain[] { return MULTISYSTEM_DOMAINS.filter((domain) => domain.scales.includes(scale)) }
export function getMandatoryReference(id: string): KnowledgeReference | undefined { return MULTISYSTEM_REFERENCES.find((reference) => reference.id === id) }
