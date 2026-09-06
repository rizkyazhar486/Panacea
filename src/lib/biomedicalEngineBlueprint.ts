export type EvidenceLevel = 'educational' | 'research' | 'validated-clinical'
export type DataStatus = 'available' | 'adapter-needed' | 'external-pipeline-required' | 'not-implemented'
export type BiomedicalDomain =
  | 'genomics'
  | 'hematology-oncology'
  | 'single-cell-multiomics'
  | 'radiology-3d'
  | 'neuro-pathway-bioelectric'
  | 'longevity-wellness'
  | 'translational-rnd'

export interface DataContract {
  id: string
  label: string
  formats: string[]
  purpose: string
  status: DataStatus
  provenance: string
}

export interface BiomedicalTrack {
  id: BiomedicalDomain
  label: string
  mission: string
  inputs: string[]
  outputs: string[]
  visualLayers: string[]
  clinicalBoundary: string
  evidenceLevel: EvidenceLevel
}

export interface ValidationGate {
  id: string
  label: string
  appliesTo: BiomedicalDomain[]
  requirement: string
  blocksAutonomy: boolean
}

export const BIOMEDICAL_DATA_CONTRACTS: DataContract[] = [
  {
    id: 'ont-pod5',
    label: 'Oxford Nanopore raw signal',
    formats: ['POD5'],
    purpose: 'Raw nanopore signal ingestion and provenance tracking before external basecalling.',
    status: 'external-pipeline-required',
    provenance: 'Oxford Nanopore output contract; raw-signal processing must remain outside the browser unless a validated compute adapter is connected.',
  },
  {
    id: 'sequence-reads',
    label: 'Basecalled sequencing reads',
    formats: ['FASTQ', 'FASTQ.GZ'],
    purpose: 'Sequence-quality inspection, read statistics and downstream handoff.',
    status: 'adapter-needed',
    provenance: 'Sequence reads with per-base quality values; no claim of variant pathogenicity by file ingestion alone.',
  },
  {
    id: 'aligned-sequence',
    label: 'Aligned / modified-base reads',
    formats: ['BAM', 'BAI', 'CRAM', 'CRAI'],
    purpose: 'Alignment-aware review, coverage summaries and modified-base visualization when produced by an external validated pipeline.',
    status: 'adapter-needed',
    provenance: 'Alignment/base-modification outputs are imported, not fabricated by the UI.',
  },
  {
    id: 'variant-report',
    label: 'Variant evidence',
    formats: ['VCF', 'BCF', 'FHIR Genomics resources'],
    purpose: 'Known-variant review, provenance, evidence links and phenotype/therapy context.',
    status: 'adapter-needed',
    provenance: 'Novel pathogenicity calling remains a research problem; the product may summarize evidence but must not invent classifications.',
  },
  {
    id: 'single-cell',
    label: 'Single-cell / spatial omics',
    formats: ['H5AD', 'AnnData-compatible exports', 'matrix/feature/barcode tables'],
    purpose: 'Cell-state, lineage, cluster and pathway visualization at RNA/protein-accessibility level.',
    status: 'adapter-needed',
    provenance: 'Research visualization unless a clinically validated assay and interpretation workflow is explicitly connected.',
  },
  {
    id: 'dicom',
    label: 'Clinical imaging',
    formats: ['DICOM', 'DICOM SEG', 'NIfTI as research import'],
    purpose: 'Patient-owned imaging review, segmentation overlays and anatomical 3D reconstruction.',
    status: 'available',
    provenance: 'DICOM source images and segmentations must stay distinguishable from educational mesh rendering.',
  },
]

export const BIOMEDICAL_TRACKS: BiomedicalTrack[] = [
  {
    id: 'genomics',
    label: 'Genome & hereditary disease engine',
    mission: 'Connect sequence evidence to known disease mechanisms, pharmacogenomics and hereditary-condition education.',
    inputs: ['POD5 provenance', 'FASTQ', 'BAM/CRAM', 'VCF/BCF', 'phenotype terms', 'family history'],
    outputs: ['QC dashboard', 'coverage/variant views', 'known-variant evidence cards', 'pathway links', 'FHIR-ready report objects'],
    visualLayers: ['chromosome', 'gene', 'variant', 'protein/domain', 'cell compartment', 'organ/system'],
    clinicalBoundary: 'No autonomous novel-variant pathogenicity call and no unsupervised treatment selection.',
    evidenceLevel: 'research',
  },
  {
    id: 'hematology-oncology',
    label: 'Precision hematology & oncology',
    mission: 'Unify molecular, blood, marrow, pathology and targeted-therapy evidence for diseases such as leukemia and inherited red-cell disorders.',
    inputs: ['CBC/smear/marrow data', 'known variants', 'pathway state', 'drug-target evidence', 'imaging/pathology links'],
    outputs: ['mechanism map', 'clone/variant timeline', 'pathway 3D', 'evidence-linked therapy context'],
    visualLayers: ['hematopoietic lineage', 'cell morphology', 'mutation → pathway → phenotype', 'organ involvement'],
    clinicalBoundary: 'Decision support only; therapy choices require validated clinical evidence and physician oversight.',
    evidenceLevel: 'research',
  },
  {
    id: 'single-cell-multiomics',
    label: 'Single-cell & multi-omics atlas',
    mission: 'Visualize cell populations, expression states, pathway activation and tissue context across RNA/protein/epigenomic measurements.',
    inputs: ['single-cell matrices', 'cell annotations', 'spatial coordinates', 'pathway gene sets'],
    outputs: ['cluster map', 'cell-state cards', 'trajectory hypotheses', 'pathway overlays'],
    visualLayers: ['cell population', 'subcellular pathway', 'tissue region', 'organ context'],
    clinicalBoundary: 'Exploratory unless a clinically validated assay and interpretation standard is present.',
    evidenceLevel: 'research',
  },
  {
    id: 'radiology-3d',
    label: 'Radiology → segmentation → 3D anatomy',
    mission: 'Convert patient-owned imaging and segmentation objects into inspectable, provenance-preserving 3D anatomy.',
    inputs: ['DICOM series', 'DICOM SEG', 'validated external segmentation outputs'],
    outputs: ['multiplanar viewer', 'segment list', '3D reconstruction', 'measurement/provenance panel'],
    visualLayers: ['source slice', 'segmentation mask', '3D surface', 'educational reference anatomy'],
    clinicalBoundary: 'Educational rendering and algorithmic segmentation must never masquerade as a radiologist-verified finding.',
    evidenceLevel: 'research',
  },
  {
    id: 'neuro-pathway-bioelectric',
    label: 'Neurobiology, pathways & bioelectric signals',
    mission: 'Link neuronal regions, signaling pathways and measured electrical/physiological data without pretending a whole brain can be simulated neuron-by-neuron.',
    inputs: ['EEG/ECG/EMG or other measured signals', 'region/cell annotations', 'known pathway states', 'imaging context'],
    outputs: ['signal traces', 'spectral summaries', 'region/pathway overlays', 'mechanistic teaching models'],
    visualLayers: ['brain region', 'cell class', 'pathway node', 'measured signal'],
    clinicalBoundary: 'No claim of complete neuron-by-neuron biochemical reconstruction; measured data and educational models stay visually distinct.',
    evidenceLevel: 'research',
  },
  {
    id: 'longevity-wellness',
    label: 'Longitudinal health, longevity & mental state',
    mission: 'Combine validated longitudinal biomarkers, function, behavior and mental-state trends without claiming reverse-aging measurement.',
    inputs: ['labs', 'wearables', 'fitness/function', 'sleep', 'nutrition', 'mental-health screening', 'clinical events'],
    outputs: ['timeline', 'validated risk/age scores when available', 'trend alerts', 'behavior-health relationships'],
    visualLayers: ['whole-body system state', 'time series', 'risk contribution', 'behavior context'],
    clinicalBoundary: 'A falling risk score is not proof that aging has been reversed.',
    evidenceLevel: 'validated-clinical',
  },
  {
    id: 'translational-rnd',
    label: 'Translational R&D workspace',
    mission: 'Organize target evidence, pathway biology, literature, candidate concepts and validation status for drug/gene-therapy/vaccine/serum research.',
    inputs: ['known targets', 'published mechanisms', 'approved/experimental therapy evidence', 'assay results', 'human review decisions'],
    outputs: ['target dossier', 'evidence graph', 'simulation notebook links', 'validation checklist', 'decision log'],
    visualLayers: ['target', 'pathway', 'cell', 'tissue', 'organ', 'clinical phenotype'],
    clinicalBoundary: 'This workspace does not autonomously design a drug, vaccine, serum or genome-editing intervention and does not provide wet-lab execution instructions.',
    evidenceLevel: 'research',
  },
]

export const VALIDATION_GATES: ValidationGate[] = [
  {
    id: 'provenance',
    label: 'Source provenance',
    appliesTo: BIOMEDICAL_TRACKS.map((x) => x.id),
    requirement: 'Every imported measurement, variant, segmentation and annotation keeps source, timestamp, method and version metadata.',
    blocksAutonomy: true,
  },
  {
    id: 'human-review',
    label: 'Human clinical review',
    appliesTo: ['genomics', 'hematology-oncology', 'radiology-3d', 'longevity-wellness', 'translational-rnd'],
    requirement: 'Clinical interpretation or treatment-impacting output cannot silently promote itself from research evidence to clinical fact.',
    blocksAutonomy: true,
  },
  {
    id: 'novel-variant',
    label: 'Novel variant gate',
    appliesTo: ['genomics', 'hematology-oncology'],
    requirement: 'Unknown variants may be displayed and linked to evidence, but not automatically labeled pathogenic/benign without validated criteria and review.',
    blocksAutonomy: true,
  },
  {
    id: 'therapy-design',
    label: 'Therapeutic design gate',
    appliesTo: ['translational-rnd'],
    requirement: 'The platform can organize targets, evidence and simulations but does not generate executable wet-lab instructions for creating a drug, vaccine, serum or genome-editing treatment.',
    blocksAutonomy: true,
  },
]

export const BIOMEDICAL_ENGINE_REFERENCES = [
  'Oxford Nanopore Technologies: POD5/FASTQ/BAM sequencing output model',
  'HL7 FHIR Genomics Reporting: computable genomic reporting/interoperability',
  'DICOM Segmentation objects: provenance-preserving imaging segmentation exchange',
  'AnnData/H5AD ecosystem: single-cell annotated data interchange',
]
