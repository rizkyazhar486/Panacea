import {
  createVerticalBiologicalGraph,
  type VerticalBiologicalGraph,
  type VerticalBiologicalNode,
  type VerticalEvidenceRef,
  type VerticalLineage,
} from './verticalBiologyGraph.ts'

export const CARDIOVASCULAR_VERTICAL_EVIDENCE = [
  { sourceId: 'repo:anatomyHierarchy:cardiovascular', role: 'structure' },
  { sourceId: 'PMID:28956314', role: 'mechanism' },
  { sourceId: 'PMID:32661902', role: 'structure' },
  { sourceId: 'PMID:34745372', role: 'mechanism' },
  { sourceId: 'PMID:39211905', role: 'mechanism' },
  { sourceId: 'NCBI-GENE:6262', role: 'genomic' },
  { sourceId: 'NCBI-GENE:7134', role: 'genomic' },
] as const satisfies readonly VerticalEvidenceRef[]

const anatomyEvidence: readonly VerticalEvidenceRef[] = [
  { sourceId: 'repo:anatomyHierarchy:cardiovascular', role: 'structure' },
]

const dyadEvidence: readonly VerticalEvidenceRef[] = [
  { sourceId: 'PMID:32661902', role: 'structure' },
  { sourceId: 'PMID:28956314', role: 'mechanism' },
]

const ryr2Evidence: readonly VerticalEvidenceRef[] = [
  { sourceId: 'PMID:28956314', role: 'mechanism' },
  { sourceId: 'PMID:32661902', role: 'mechanism' },
  { sourceId: 'NCBI-GENE:6262', role: 'genomic' },
]

const sarcomereEvidence: readonly VerticalEvidenceRef[] = [
  { sourceId: 'PMID:34745372', role: 'mechanism' },
  { sourceId: 'PMID:39211905', role: 'mechanism' },
]

const tnnc1Evidence: readonly VerticalEvidenceRef[] = [
  { sourceId: 'PMID:39211905', role: 'mechanism' },
  { sourceId: 'NCBI-GENE:7134', role: 'genomic' },
]

const calciumEvidence: readonly VerticalEvidenceRef[] = [
  { sourceId: 'PMID:28956314', role: 'mechanism' },
  { sourceId: 'PMID:32661902', role: 'mechanism' },
]

function node(
  id: string,
  label: string,
  scale: VerticalBiologicalNode['scale'],
  evidence: readonly VerticalEvidenceRef[],
  options: Pick<VerticalBiologicalNode, 'domain' | 'representation'> = {},
): VerticalBiologicalNode {
  return {
    id,
    label,
    scale,
    status: 'implemented',
    truthScope: 'reference',
    evidence,
    domain: options.domain ?? 'cardiovascular',
    representation: options.representation,
  }
}

const nodes: readonly VerticalBiologicalNode[] = [
  node('human', 'Human', 'person', anatomyEvidence, { domain: 'whole-human' }),
  node('cardiovascular-system', 'Cardiovascular system', 'system', anatomyEvidence),
  node('heart', 'Heart', 'organ', anatomyEvidence, {
    representation: { kind: '3d-reference', sourceId: 'repo:source-registry:z_anatomy' },
  }),
  node('left-ventricle', 'Left ventricle', 'substructure', anatomyEvidence),
  node('lv-myocardium', 'Left-ventricular myocardium', 'tissue', [
    ...anatomyEvidence,
    { sourceId: 'PMID:34745372', role: 'mechanism' },
  ]),
  node('cardiac-dyad', 'Cardiac dyad', 'microarchitecture', dyadEvidence),
  node('sarcomere', 'Cardiac sarcomere', 'microarchitecture', sarcomereEvidence),
  node('ventricular-cardiomyocyte', 'Ventricular cardiomyocyte', 'cell', [
    ...dyadEvidence,
    ...sarcomereEvidence,
  ]),
  node('junctional-sarcoplasmic-reticulum', 'Junctional sarcoplasmic reticulum', 'membrane-organelle', dyadEvidence),
  node('ryr2-channel-complex', 'RyR2 calcium-release channel complex', 'molecular-complex', ryr2Evidence),
  node('cardiac-troponin-complex', 'Cardiac troponin complex', 'molecular-complex', tnnc1Evidence),
  node('ryr2-protein', 'Ryanodine receptor 2 (RYR2)', 'protein', ryr2Evidence),
  node('tnnc1-protein', 'Cardiac troponin C (TNNC1)', 'protein', tnnc1Evidence),
  node('calcium-induced-calcium-release', 'Calcium-induced calcium release', 'pathway', ryr2Evidence),
  node('thin-filament-calcium-activation', 'Calcium-dependent thin-filament activation', 'pathway', tnnc1Evidence),
  node('cytosolic-calcium', 'Cytosolic calcium', 'metabolite-ion', calciumEvidence),
  node('ryr2-transcript', 'RYR2 transcript reference', 'rna', ryr2Evidence),
  node('tnnc1-transcript', 'TNNC1 transcript reference', 'rna', tnnc1Evidence),
  node('ryr2-gene', 'RYR2 gene reference', 'gene-regulatory', ryr2Evidence),
  node('tnnc1-gene', 'TNNC1 gene reference', 'gene-regulatory', tnnc1Evidence),
  node('ryr2-chromatin', 'RYR2 chromatin locus reference', 'chromatin', ryr2Evidence),
  node('tnnc1-chromatin', 'TNNC1 chromatin locus reference', 'chromatin', tnnc1Evidence),
  node('ryr2-dna', 'RYR2 genomic DNA reference', 'dna', ryr2Evidence),
  node('tnnc1-dna', 'TNNC1 genomic DNA reference', 'dna', tnnc1Evidence),
]

const requiredScalePath = [
  'person',
  'system',
  'organ',
  'substructure',
  'tissue',
  'microarchitecture',
  'cell',
  'cell-state',
  'membrane-organelle',
  'molecular-complex',
  'protein',
  'post-translational',
  'pathway',
  'metabolite-ion',
  'rna',
  'gene-regulatory',
  'chromatin',
  'dna',
] as const

const ryr2Lineage: VerticalLineage = {
  id: 'cardio.ryr2-calcium-handling',
  label: 'Ventricular excitation-contraction calcium handling → RYR2 DNA',
  steps: [
    { scale: 'person', nodeId: 'human', status: 'implemented' },
    { scale: 'system', nodeId: 'cardiovascular-system', status: 'implemented' },
    { scale: 'organ', nodeId: 'heart', status: 'implemented' },
    { scale: 'substructure', nodeId: 'left-ventricle', status: 'implemented' },
    { scale: 'tissue', nodeId: 'lv-myocardium', status: 'implemented' },
    { scale: 'microarchitecture', nodeId: 'cardiac-dyad', status: 'implemented' },
    { scale: 'cell', nodeId: 'ventricular-cardiomyocyte', status: 'implemented' },
    {
      scale: 'cell-state',
      status: 'gap',
      reason: 'VERTICAL GAP — NOT YET MODELED: no patient-specific ventricular cardiomyocyte state estimator is implemented.',
    },
    { scale: 'membrane-organelle', nodeId: 'junctional-sarcoplasmic-reticulum', status: 'implemented' },
    { scale: 'molecular-complex', nodeId: 'ryr2-channel-complex', status: 'implemented' },
    { scale: 'protein', nodeId: 'ryr2-protein', status: 'implemented' },
    {
      scale: 'post-translational',
      status: 'gap',
      reason: 'VERTICAL GAP — NOT YET MODELED: site-specific RyR2 post-translational state is not inferred from generic physiology.',
    },
    { scale: 'pathway', nodeId: 'calcium-induced-calcium-release', status: 'implemented' },
    { scale: 'metabolite-ion', nodeId: 'cytosolic-calcium', status: 'implemented' },
    { scale: 'rna', nodeId: 'ryr2-transcript', status: 'implemented' },
    { scale: 'gene-regulatory', nodeId: 'ryr2-gene', status: 'implemented' },
    { scale: 'chromatin', nodeId: 'ryr2-chromatin', status: 'implemented' },
    { scale: 'dna', nodeId: 'ryr2-dna', status: 'implemented' },
  ],
}

const troponinLineage: VerticalLineage = {
  id: 'cardio.troponin-sarcomere',
  label: 'Ventricular sarcomere calcium activation → TNNC1 DNA',
  steps: [
    { scale: 'person', nodeId: 'human', status: 'implemented' },
    { scale: 'system', nodeId: 'cardiovascular-system', status: 'implemented' },
    { scale: 'organ', nodeId: 'heart', status: 'implemented' },
    { scale: 'substructure', nodeId: 'left-ventricle', status: 'implemented' },
    { scale: 'tissue', nodeId: 'lv-myocardium', status: 'implemented' },
    { scale: 'microarchitecture', nodeId: 'sarcomere', status: 'implemented' },
    { scale: 'cell', nodeId: 'ventricular-cardiomyocyte', status: 'implemented' },
    {
      scale: 'cell-state',
      status: 'gap',
      reason: 'VERTICAL GAP — NOT YET MODELED: patient-specific myofilament activation state is not measured or estimated.',
    },
    {
      scale: 'membrane-organelle',
      status: 'not-applicable',
      reason: 'The sarcomere/troponin branch is a cytoskeletal contractile apparatus branch rather than a membrane-organelle lineage.',
    },
    { scale: 'molecular-complex', nodeId: 'cardiac-troponin-complex', status: 'implemented' },
    { scale: 'protein', nodeId: 'tnnc1-protein', status: 'implemented' },
    {
      scale: 'post-translational',
      status: 'gap',
      reason: 'VERTICAL GAP — NOT YET MODELED: patient-specific troponin post-translational state is not inferred from reference biology.',
    },
    { scale: 'pathway', nodeId: 'thin-filament-calcium-activation', status: 'implemented' },
    { scale: 'metabolite-ion', nodeId: 'cytosolic-calcium', status: 'implemented' },
    { scale: 'rna', nodeId: 'tnnc1-transcript', status: 'implemented' },
    { scale: 'gene-regulatory', nodeId: 'tnnc1-gene', status: 'implemented' },
    { scale: 'chromatin', nodeId: 'tnnc1-chromatin', status: 'implemented' },
    { scale: 'dna', nodeId: 'tnnc1-dna', status: 'implemented' },
  ],
}

const relations: VerticalBiologicalGraph['relations'] = [
  { from: 'human', to: 'cardiovascular-system', kind: 'contains' },
  { from: 'cardiovascular-system', to: 'heart', kind: 'contains' },
  { from: 'heart', to: 'left-ventricle', kind: 'contains' },
  { from: 'left-ventricle', to: 'lv-myocardium', kind: 'contains' },
  { from: 'lv-myocardium', to: 'cardiac-dyad', kind: 'contains' },
  { from: 'lv-myocardium', to: 'sarcomere', kind: 'contains' },
  { from: 'cardiac-dyad', to: 'ventricular-cardiomyocyte', kind: 'part-of' },
  { from: 'sarcomere', to: 'ventricular-cardiomyocyte', kind: 'part-of' },
  { from: 'ventricular-cardiomyocyte', to: 'junctional-sarcoplasmic-reticulum', kind: 'contains' },
  { from: 'junctional-sarcoplasmic-reticulum', to: 'ryr2-channel-complex', kind: 'contains' },
  { from: 'ryr2-channel-complex', to: 'ryr2-protein', kind: 'contains' },
  { from: 'cardiac-troponin-complex', to: 'tnnc1-protein', kind: 'contains' },
  { from: 'ryr2-protein', to: 'calcium-induced-calcium-release', kind: 'mechanistic' },
  { from: 'tnnc1-protein', to: 'thin-filament-calcium-activation', kind: 'mechanistic' },
  { from: 'calcium-induced-calcium-release', to: 'cytosolic-calcium', kind: 'regulates' },
  { from: 'cytosolic-calcium', to: 'thin-filament-calcium-activation', kind: 'regulates' },
  { from: 'ryr2-transcript', to: 'ryr2-protein', kind: 'encoded-by' },
  { from: 'tnnc1-transcript', to: 'tnnc1-protein', kind: 'encoded-by' },
  { from: 'ryr2-transcript', to: 'ryr2-gene', kind: 'transcribed-from' },
  { from: 'tnnc1-transcript', to: 'tnnc1-gene', kind: 'transcribed-from' },
  { from: 'ryr2-gene', to: 'ryr2-chromatin', kind: 'located-in' },
  { from: 'tnnc1-gene', to: 'tnnc1-chromatin', kind: 'located-in' },
  { from: 'ryr2-chromatin', to: 'ryr2-dna', kind: 'located-in' },
  { from: 'tnnc1-chromatin', to: 'tnnc1-dna', kind: 'located-in' },
]

export const CARDIOVASCULAR_VERTICAL_GRAPH: VerticalBiologicalGraph = {
  id: 'cardiovascular.vertical.v1',
  rootNodeId: 'human',
  requiredScalePath,
  nodes,
  relations,
  lineages: [ryr2Lineage, troponinLineage],
}

export function cardiovascularVerticalGraph(): VerticalBiologicalGraph {
  return createVerticalBiologicalGraph(CARDIOVASCULAR_VERTICAL_GRAPH)
}
