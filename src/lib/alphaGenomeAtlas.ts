export type GenomeScale = 'chromosome' | 'locus' | 'gene' | 'transcript' | 'variant' | 'protein' | 'pathway';

export interface GenomeSource {
  id: string;
  label: string;
  authority: string;
  scope: string;
  provenanceRule: string;
}

export interface GenomeAtlasRecord {
  id: string;
  symbol: string;
  label: string;
  chromosome: string;
  locus: string;
  scales: GenomeScale[];
  bodySystems: string[];
  role: string;
  transcriptExamples: string[];
  proteinExamples: string[];
  pathwayExamples: string[];
  sourceIds: string[];
  clinicalBoundary: string;
}

export const ALPHA_GENOME_ATLAS_BOUNDARY =
  'Reference and education atlas only. Genomic coordinates, alleles, transcript consequences, pathogenicity, penetrance, ancestry frequency and patient-specific interpretation must come from verified source records; absence of evidence is not a benign classification.';

export const ALPHA_GENOME_SOURCES: GenomeSource[] = [
  {
    id: 'grch38',
    label: 'GRCh38 human reference genome',
    authority: 'Genome Reference Consortium',
    scope: 'reference assembly and chromosome coordinate frame',
    provenanceRule: 'Coordinate-bearing records must declare assembly; never silently mix assemblies.',
  },
  {
    id: 'mane',
    label: 'MANE Select / Plus Clinical',
    authority: 'NCBI + EMBL-EBI',
    scope: 'clinically useful harmonized transcript references',
    provenanceRule: 'Transcript identity must be explicit; do not collapse transcript-specific consequences.',
  },
  {
    id: 'clinvar',
    label: 'ClinVar',
    authority: 'NCBI',
    scope: 'submitted variant–condition interpretations and review status',
    provenanceRule: 'Display significance together with review status, submitter context and date; never convert disagreement into certainty.',
  },
  {
    id: 'gnomad',
    label: 'gnomAD',
    authority: 'Broad Institute / international contributors',
    scope: 'population allele-frequency reference',
    provenanceRule: 'Population frequency is not a diagnosis and must not be treated as pathogenicity by itself.',
  },
  {
    id: 'ensembl',
    label: 'Ensembl',
    authority: 'EMBL-EBI',
    scope: 'genes, transcripts, regulatory annotation and comparative genomics',
    provenanceRule: 'Persist stable identifiers and source release metadata when importing live records.',
  },
  {
    id: 'refseq',
    label: 'RefSeq',
    authority: 'NCBI',
    scope: 'curated genomic, transcript and protein sequences',
    provenanceRule: 'Accession and version must travel together when sequence identity matters.',
  },
  {
    id: 'uniprot',
    label: 'UniProt',
    authority: 'UniProt Consortium',
    scope: 'protein sequence, function and feature annotation',
    provenanceRule: 'Distinguish reviewed evidence from predicted annotation and isoform-specific claims.',
  },
  {
    id: 'gtex',
    label: 'GTEx',
    authority: 'NIH GTEx Consortium',
    scope: 'population tissue gene-expression reference',
    provenanceRule: 'Expression is tissue-, context- and population-dependent; never infer an individual measurement.',
  },
];

export const ALPHA_GENOME_SEED_RECORDS: GenomeAtlasRecord[] = [
  {
    id: 'tp53', symbol: 'TP53', label: 'Tumor protein p53', chromosome: '17', locus: '17p13.1',
    scales: ['chromosome','locus','gene','transcript','variant','protein','pathway'],
    bodySystems: ['multi-system','oncology','cell-cycle'],
    role: 'Genome-integrity response, cell-cycle arrest, senescence and apoptosis signaling.',
    transcriptExamples: ['MANE transcript required for consequence display'],
    proteinExamples: ['p53 transcription factor'],
    pathwayExamples: ['DNA-damage response','cell-cycle checkpoint','apoptosis'],
    sourceIds: ['grch38','mane','clinvar','gnomad','ensembl','refseq','uniprot','gtex'],
    clinicalBoundary: 'Do not infer Li-Fraumeni syndrome, cancer risk or treatment response from a gene-level view without variant-level evidence and qualified clinical interpretation.',
  },
  {
    id: 'brca1', symbol: 'BRCA1', label: 'BRCA1 DNA repair associated', chromosome: '17', locus: '17q21.31',
    scales: ['chromosome','locus','gene','transcript','variant','protein','pathway'],
    bodySystems: ['breast','ovary','DNA-repair'],
    role: 'Homologous-recombination DNA repair and genome stability.',
    transcriptExamples: ['MANE transcript required for consequence display'],
    proteinExamples: ['BRCA1 protein'], pathwayExamples: ['homologous recombination','DNA-damage response'],
    sourceIds: ['grch38','mane','clinvar','gnomad','ensembl','refseq','uniprot','gtex'],
    clinicalBoundary: 'Gene presence alone does not establish hereditary cancer risk; exact variant classification and review context are mandatory.',
  },
  {
    id: 'apoe', symbol: 'APOE', label: 'Apolipoprotein E', chromosome: '19', locus: '19q13.32',
    scales: ['chromosome','locus','gene','transcript','variant','protein','pathway'],
    bodySystems: ['brain','cardiovascular','lipid-metabolism'],
    role: 'Lipid transport and lipoprotein biology with context-dependent neurologic and cardiovascular associations.',
    transcriptExamples: ['MANE transcript required for consequence display'],
    proteinExamples: ['Apolipoprotein E'], pathwayExamples: ['lipoprotein metabolism','lipid transport'],
    sourceIds: ['grch38','mane','clinvar','gnomad','ensembl','refseq','uniprot','gtex'],
    clinicalBoundary: 'APOE genotype is probabilistic, ancestry- and context-dependent; it must not be presented as deterministic Alzheimer disease prediction.',
  },
  {
    id: 'scn5a', symbol: 'SCN5A', label: 'Sodium voltage-gated channel alpha subunit 5', chromosome: '3', locus: '3p22.2',
    scales: ['chromosome','locus','gene','transcript','variant','protein','pathway'],
    bodySystems: ['heart','electrophysiology'],
    role: 'Cardiac voltage-gated sodium-channel alpha subunit central to action-potential propagation.',
    transcriptExamples: ['MANE transcript required for consequence display'],
    proteinExamples: ['Nav1.5'], pathwayExamples: ['cardiac depolarization','excitation conduction'],
    sourceIds: ['grch38','mane','clinvar','gnomad','ensembl','refseq','uniprot','gtex'],
    clinicalBoundary: 'Do not infer channelopathy, arrhythmic risk or medication response from gene membership without exact variant and phenotype context.',
  },
  {
    id: 'cftr', symbol: 'CFTR', label: 'CF transmembrane conductance regulator', chromosome: '7', locus: '7q31.2',
    scales: ['chromosome','locus','gene','transcript','variant','protein','pathway'],
    bodySystems: ['respiratory','pancreas','gastrointestinal','reproductive'],
    role: 'Epithelial chloride/bicarbonate transport and fluid homeostasis.',
    transcriptExamples: ['MANE transcript required for consequence display'],
    proteinExamples: ['CFTR chloride channel'], pathwayExamples: ['epithelial ion transport'],
    sourceIds: ['grch38','mane','clinvar','gnomad','ensembl','refseq','uniprot','gtex'],
    clinicalBoundary: 'Cystic fibrosis and CFTR-related disorder interpretation requires allele-level phase, classification and phenotype context.',
  },
  {
    id: 'htt', symbol: 'HTT', label: 'Huntingtin', chromosome: '4', locus: '4p16.3',
    scales: ['chromosome','locus','gene','transcript','variant','protein','pathway'],
    bodySystems: ['brain','neurodegeneration'],
    role: 'Large neuronal protein with multiple cellular functions; repeat-expansion disease requires repeat-specific representation.',
    transcriptExamples: ['MANE transcript required for consequence display'],
    proteinExamples: ['Huntingtin'], pathwayExamples: ['vesicle trafficking','neuronal homeostasis'],
    sourceIds: ['grch38','mane','clinvar','gnomad','ensembl','refseq','uniprot','gtex'],
    clinicalBoundary: 'Repeat-length interpretation is a specialized assay and cannot be approximated from a generic SNV/indel record.',
  },
];

export const BODY_EXPOSURE_ALPHA_GENOME_REQUIREMENT = {
  id: 'alpha-genome-atlas',
  required: true,
  minimumScales: ['chromosome','locus','gene','transcript','variant','protein','pathway'] as GenomeScale[],
  sourceIds: ALPHA_GENOME_SOURCES.map((source) => source.id),
  failClosed: true,
  patientInferenceAllowed: false,
  syntheticVariantCoordinatesAllowed: false,
} as const;
