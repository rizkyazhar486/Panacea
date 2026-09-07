export const PATHWAY_SOURCE = 'https://reactome.org/content/detail/R-HSA-5673001'
export const PATHWAY_NODES = [
  { gene: 'EGFR', label: 'EGFR', compartment: 'Membrane', position: [-4, 3, 0] },
  { gene: 'KRAS', label: 'RAS', compartment: 'Membrane-associated', position: [-2, 1.4, 0] },
  { gene: 'BRAF', label: 'RAF', compartment: 'Cytosol', position: [0, 0, 0] },
  { gene: 'MAP2K1', label: 'MEK', compartment: 'Cytosol', position: [2, -1.4, 0] },
  { gene: 'MAPK1', label: 'ERK', compartment: 'Cytosol / nucleus', position: [4, -3, 0] },
] as const

export const RESEARCH_AREAS = [
  { id: 'oncology', title: 'Oncology & leukemia', focus: 'Somatic variation, signaling and clonal context', boundary: 'Tumor-normal comparison, lineage, fusions, assay validation and clinical review are required. A gene label alone is not a treatment biomarker.', url: 'https://www.cancer.gov/types/leukemia' },
  { id: 'hemoglobin', title: 'Hemoglobin & hemolysis', focus: 'HBB, G6PD and inherited blood disorders', boundary: 'HBB-related thalassemia and G6PD deficiency have different mechanisms. Genotype, inheritance and laboratory evidence must be reviewed together.', url: 'https://medlineplus.gov/genetics/condition/beta-thalassemia/' },
  { id: 'neuro', title: 'Neurodevelopment & mental health', focus: 'Genetic context and multimodal research', boundary: 'Autism is heterogeneous and is not established by a single gene or routine MRI. This engine does not diagnose autism or infer mental state.', url: 'https://medlineplus.gov/genetics/condition/autism-spectrum-disorder/' },
  { id: 'bone', title: 'Hereditary bone disease', focus: 'Phosphate regulation and inherited rickets', boundary: 'Inherited phosphate disorders must be distinguished from nutritional and other causes of rickets.', url: 'https://medlineplus.gov/genetics/condition/x-linked-hypophosphatemia/' },
  { id: 'editing', title: 'Therapeutic discovery', focus: 'Target hypotheses and genome-editing research', boundary: 'No guide sequence, construct, dosing or treatment design is generated. Functional validation, delivery, off-target evaluation and regulatory review are outside this workbench.', url: 'https://www.genome.gov/about-genomics/policy-issues/Genome-Editing/How-genome-editing-works' },
  { id: 'longevity', title: 'Longevity & wellness', focus: 'Longitudinal biomarkers and research endpoints', boundary: 'No biological-age reversal, rejuvenation efficacy or healthspan benefit can be concluded from this descriptive analysis.', url: 'https://www.nia.nih.gov/research' },
]

export const EXTERNAL_STAGES = [
  { name: 'Nanopore acquisition', input: 'Instrument + sample', output: 'POD5 raw signal', repo: 'nanoporetech/pod5-file-format', status: 'External instrument required' },
  { name: 'Dorado basecalling', input: 'POD5 + compatible basecalling model', output: 'Basecalled reads / BAM', repo: 'nanoporetech/dorado', status: 'External runtime required' },
  { name: 'Human variation', input: 'Workflow-compatible reads + reference genome', output: 'VCF + quality reports', repo: 'epi2me-labs/wf-human-variation', status: 'External runtime required' },
  { name: 'Research workbench', input: 'Filtered VCF / cell CSV / scalar NIfTI', output: 'QC + 3D + research report', repo: 'GMOD/vcf-js', status: 'Local import available' },
]
