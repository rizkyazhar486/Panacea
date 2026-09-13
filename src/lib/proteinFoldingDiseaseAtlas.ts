export type ProteinDiseaseDomain = 'cancer' | 'alzheimer' | 'parkinson' | 'schizophrenia';
export type ProteinEvidenceState = 'experimental' | 'predicted' | 'hypothesis';
export type ProteinStructureSource = 'RCSB-PDB' | 'AlphaFold-DB' | 'UniProt' | 'none';

export interface ProteinTarget {
  id: string;
  gene: string;
  protein: string;
  domains: ProteinDiseaseDomain[];
  role: string;
  structureSource: ProteinStructureSource;
  structureId?: string;
  sequenceSource: 'UniProt' | 'RefSeq' | 'none';
  sequenceId?: string;
  evidence: ProteinEvidenceState;
  caveat: string;
}

export interface FoldingStage {
  id: 'sequence' | 'secondary' | 'tertiary' | 'ensemble' | 'binding-pocket' | 'ligand-screen' | 'validation';
  label: string;
  description: string;
  requirement: string;
}

export const PROTEIN_FOLDING_SOURCES = [
  { id: 'rcsb-pdb', label: 'RCSB Protein Data Bank', role: 'experimentally determined atomic coordinates and assemblies' },
  { id: 'alphafold-db', label: 'AlphaFold Protein Structure Database', role: 'predicted structures with confidence metadata' },
  { id: 'uniprot', label: 'UniProt', role: 'canonical protein sequence, function and annotation' },
  { id: 'refseq', label: 'NCBI RefSeq', role: 'reference protein/transcript sequences' },
  { id: 'chembl', label: 'ChEMBL', role: 'bioactivity evidence for protein–ligand hypotheses' },
  { id: 'pubchem', label: 'PubChem', role: 'compound identity and chemistry metadata' },
] as const;

export const PROTEIN_TARGETS: ProteinTarget[] = [
  {
    id: 'tp53', gene: 'TP53', protein: 'Cellular tumor antigen p53', domains: ['cancer'],
    role: 'DNA-damage response and tumor-suppressor network node; mutation effects are context dependent.',
    structureSource: 'none', sequenceSource: 'UniProt', sequenceId: 'P04637', evidence: 'experimental',
    caveat: 'No single p53 structure represents every oligomeric, mutation, ligand-bound or cellular state.',
  },
  {
    id: 'mdm2', gene: 'MDM2', protein: 'E3 ubiquitin-protein ligase MDM2', domains: ['cancer'],
    role: 'Regulates p53 stability and is a structure-based drug-discovery target in selected cancers.',
    structureSource: 'none', sequenceSource: 'UniProt', sequenceId: 'Q00987', evidence: 'experimental',
    caveat: 'Binding-pocket hypotheses require state-specific structural evidence and experimental validation.',
  },
  {
    id: 'app', gene: 'APP', protein: 'Amyloid-beta precursor protein', domains: ['alzheimer'],
    role: 'Precursor of amyloid-beta peptides; cleavage, aggregation and cellular context are mechanistically distinct layers.',
    structureSource: 'none', sequenceSource: 'UniProt', sequenceId: 'P05067', evidence: 'experimental',
    caveat: 'Alzheimer disease is not reducible to APP or amyloid-beta alone.',
  },
  {
    id: 'mapt', gene: 'MAPT', protein: 'Microtubule-associated protein tau', domains: ['alzheimer'],
    role: 'Intrinsically disordered protein whose post-translational state and aggregation ensemble matter for disease biology.',
    structureSource: 'none', sequenceSource: 'UniProt', sequenceId: 'P10636', evidence: 'experimental',
    caveat: 'A single static fold is inadequate for tau; conformational ensembles and fibril states must remain distinct.',
  },
  {
    id: 'snca', gene: 'SNCA', protein: 'Alpha-synuclein', domains: ['parkinson'],
    role: 'Intrinsically disordered presynaptic protein with membrane-bound and aggregated conformational states.',
    structureSource: 'none', sequenceSource: 'UniProt', sequenceId: 'P37840', evidence: 'experimental',
    caveat: 'Monomer, oligomer and fibril structures must never be conflated.',
  },
  {
    id: 'lrrk2', gene: 'LRRK2', protein: 'Leucine-rich repeat serine/threonine-protein kinase 2', domains: ['parkinson'],
    role: 'Multidomain kinase/GTPase implicated in Parkinson disease and a structure-guided therapeutic target.',
    structureSource: 'none', sequenceSource: 'UniProt', sequenceId: 'Q5S007', evidence: 'experimental',
    caveat: 'Disease mechanisms vary by variant, domain and cellular context.',
  },
  {
    id: 'drd2', gene: 'DRD2', protein: 'Dopamine D2 receptor', domains: ['schizophrenia'],
    role: 'GPCR targeted by many antipsychotic drugs; receptor state, signaling bias and network context matter.',
    structureSource: 'none', sequenceSource: 'UniProt', sequenceId: 'P14416', evidence: 'experimental',
    caveat: 'Schizophrenia is a distributed polygenic disorder and cannot be mapped to DRD2 alone.',
  },
  {
    id: 'grin2a', gene: 'GRIN2A', protein: 'Glutamate receptor ionotropic, NMDA 2A', domains: ['schizophrenia'],
    role: 'NMDA-receptor subunit relevant to excitatory synaptic signaling and neuropsychiatric disease mechanisms.',
    structureSource: 'none', sequenceSource: 'UniProt', sequenceId: 'Q12879', evidence: 'experimental',
    caveat: 'Receptor-complex stoichiometry, developmental expression and circuit context are essential.',
  },
];

export const FOLDING_ROUTE: FoldingStage[] = [
  { id: 'sequence', label: 'Amino-acid sequence', description: 'Canonical sequence plus isoform/PTM context.', requirement: 'Verified UniProt/RefSeq identity and sequence provenance.' },
  { id: 'secondary', label: 'Local structure', description: 'Helix, sheet, disorder and local constraints.', requirement: 'Prediction confidence or experimental evidence must be visible.' },
  { id: 'tertiary', label: '3D structure', description: 'Domain arrangement and atomic/residue geometry.', requirement: 'Render atoms/residues only from verified PDB/mmCIF or explicitly labelled prediction coordinates.' },
  { id: 'ensemble', label: 'Conformational ensemble', description: 'Alternative states, disorder and dynamics rather than one frozen structure.', requirement: 'Do not portray animation as molecular dynamics unless trajectory data are actually present.' },
  { id: 'binding-pocket', label: 'Binding pocket', description: 'Candidate cavities and allosteric sites.', requirement: 'Pocket predictions are hypotheses until experimentally supported.' },
  { id: 'ligand-screen', label: 'Candidate ligand exploration', description: 'Rank compounds by explicit computational evidence without claiming efficacy.', requirement: 'Separate docking score, dynamics, bioactivity and clinical evidence.' },
  { id: 'validation', label: 'Validation', description: 'Biophysical, biochemical, cellular, animal and clinical evidence hierarchy.', requirement: 'Computational success alone cannot mark a disease mechanism or therapy as solved.' },
];

export const PROTEIN_FOLDING_BOUNDARY = 'Research hypothesis engine only. Sequence-to-structure prediction, docking, visual trajectories and candidate rankings are not proof of molecular mechanism, therapeutic efficacy, safety or clinical benefit. Schizophrenia, cancer, Alzheimer disease and Parkinson disease are multiscale disorders and cannot be solved by one protein model.';
