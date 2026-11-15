// src/domains/biological-concept-graph/data/subcellularEnergeticsAutophagySpec.ts
// Subcellular Energetics, Chemiosmotic Coupling & Macroautophagy Vertical Slice:
// Whole body -> Musculoskeletal system -> Skeletal muscle -> Muscle tissue -> Skeletal myocyte ->
// Mitochondrion & Autophagosome -> Complex I & ATP Synthase & AMPK & LC3-II ->
// Chemiosmotic phosphorylation & Macroautophagy pathways -> MT-ND1 & PRKAA1 genes.

import {
  CONCEPT_GRAPH_SCHEMA_VERSION,
  type ConceptEdge,
  type ConceptGraphSpec,
  type ConceptNode,
  type ScientificReference,
  type VisualizationBinding,
} from '../model/types.ts'

const REFS: ScientificReference[] = [
  { id: 'ref:mitchell-1961', kind: 'peer_reviewed', citation: 'Mitchell P. Coupling of phosphorylation to electron and hydrogen transfer by a chemi-osmotic type of mechanism. Nature 1961;191:144-148.', doi: '10.1038/191144a0', license: 'publisher copyright; cited only, no text reproduced', verification: 'cited_not_retrieved' },
  { id: 'ref:murphy-ros-2009', kind: 'peer_reviewed', citation: 'Murphy MP. How mitochondria produce reactive oxygen species. Biochem J 2009;417(1):1-13.', doi: '10.1042/BJ20081386', license: 'publisher copyright; cited only, no text reproduced', verification: 'cited_not_retrieved' },
  { id: 'ref:hardie-ampk-2012', kind: 'peer_reviewed', citation: 'Hardie DG, Ross FA, Hawley SA. AMPK: a nutrient and energy sensor that maintains energy homeostasis. Nat Rev Mol Cell Biol 2012;13(4):251-262.', doi: '10.1038/nrm3311', license: 'publisher copyright; cited only, no text reproduced', verification: 'cited_not_retrieved' },
  { id: 'ref:mizushima-autophagy-2011', kind: 'peer_reviewed', citation: 'Mizushima N, Komatsu M. Autophagy: renovation of cells and tissues. Cell 2011;147(4):728-741.', doi: '10.1016/j.cell.2011.10.026', license: 'publisher copyright; cited only, no text reproduced', verification: 'cited_not_retrieved' },
  { id: 'ref:hgnc-mt-nd1', kind: 'peer_reviewed', citation: 'HUGO Gene Nomenclature Committee (HGNC). Approved gene symbol MT-ND1.', url: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:7455', license: 'CC0', verification: 'cited_not_retrieved' },
  { id: 'ref:hgnc-prkaa1', kind: 'peer_reviewed', citation: 'HUGO Gene Nomenclature Committee (HGNC). Approved gene symbol PRKAA1.', url: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:9376', license: 'CC0', verification: 'cited_not_retrieved' },
]

const SCHEMATIC: VisualizationBinding = { representation: 'schematic', spatialPrecision: 'none', note: 'Subcellular organellar schematic.' }
const CONCEPTUAL: VisualizationBinding = { representation: 'conceptual', spatialPrecision: 'none', note: 'Molecular enzyme / pathway concept.' }
const MUSCLE3D: VisualizationBinding = { representation: 'anatomical_3d', assetKey: 'adult_male.muscular', spatialPrecision: 'organ_level', note: 'Gross muscular system mesh.' }

const REF_MITCHELL = ['ref:mitchell-1961']
const REF_MURPHY = ['ref:murphy-ros-2009']
const REF_HARDIE = ['ref:hardie-ampk-2012']
const REF_MIZUSHIMA = ['ref:mizushima-autophagy-2011']

// Pure: builds a node and touches nothing else. Without the annotation Rollup keeps the whole spec (the spread reads its
// argument) in every bundle that imports this domain's index, used or not.
const n = /* @__NO_SIDE_EFFECTS__ */ (x: Omit<ConceptNode, 'learningObjectives'> & { learningObjectives?: readonly string[] }): ConceptNode => ({ learningObjectives: [], ...x })

const NODES: ConceptNode[] = [
  n({
    id: 'pcg:human_body',
    label: 'Human body',
    scale: 'whole_body',
    parentId: null,
    definition: 'The whole organism, root of the anatomical and metabolic hierarchy.',
    referenceIds: REF_MITCHELL,
    visualization: { representation: 'anatomical_3d', assetKey: 'adult_male.surface', spatialPrecision: 'organ_level' },
  }),
  n({
    id: 'pcg:musculoskeletal_system',
    label: 'Musculoskeletal system',
    scale: 'organ_system',
    parentId: 'pcg:human_body',
    ontologyId: 'UBERON:0002204',
    definition: 'Organ system comprising skeletal muscles, bones, tendons, and ligaments enabling locomotion and high metabolic energy flux.',
    referenceIds: REF_MITCHELL,
    visualization: MUSCLE3D,
  }),
  n({
    id: 'pcg:skeletal_muscle_organ',
    label: 'Skeletal muscle organ',
    scale: 'organ',
    parentId: 'pcg:musculoskeletal_system',
    ontologyId: 'UBERON:0001134',
    definition: 'Voluntary striated muscle contracting to perform biomechanical work, acting as the primary consumer of oxidative ATP.',
    function: 'Converts chemical energy (ATP) into mechanical force and thermogenic heat.',
    referenceIds: REF_MITCHELL,
    visualization: MUSCLE3D,
    learningObjectives: ['Explain how muscle bioenergetics shifts from glycolysis to oxidative phosphorylation during sustained exercise.'],
  }),
  n({
    id: 'pcg:skeletal_muscle_tissue',
    label: 'Skeletal muscle tissue',
    scale: 'tissue',
    parentId: 'pcg:skeletal_muscle_organ',
    ontologyId: 'UBERON:0001134',
    definition: 'Bundled fascicles of multinucleated myofibers richly populated with subsarcolemmal and intermyofibrillar mitochondria.',
    referenceIds: REF_MITCHELL,
    visualization: SCHEMATIC,
  }),
  n({
    id: 'pcg:skeletal_myocyte',
    label: 'Skeletal myocyte (myofiber)',
    scale: 'cell',
    parentId: 'pcg:skeletal_muscle_tissue',
    ontologyId: 'CL:0000187',
    definition: 'Long, multinucleated cylindrical contractile muscle cell with high metabolic plasticity responding dynamically to energy stress.',
    function: 'Maintains excitation-contraction coupling and energy homeostasis via AMPK-mTORC1 coordination.',
    referenceIds: REF_HARDIE,
    visualization: SCHEMATIC,
    learningObjectives: ['Describe how cellular AMP/ATP ratio is sensed by AMPK during muscle contraction.'],
  }),
  n({
    id: 'pcg:myocyte_mitochondrion',
    label: 'Myocyte mitochondrion',
    scale: 'organelle',
    parentId: 'pcg:skeletal_myocyte',
    ontologyId: 'GO:0005739',
    definition: 'Double-membrane powerhouse organelle generating >90% of cellular ATP via chemiosmotic oxidative phosphorylation.',
    function: 'Maintains electrochemical proton gradient (Delta-p), oxidizes metabolic fuels, and regulates apoptosis and ROS signaling.',
    referenceIds: REF_MITCHELL,
    visualization: SCHEMATIC,
    learningObjectives: ['Define the components of the proton motive force (Delta-p = Delta-Psi_m - 61.5 * Delta-pH).'],
  }),
  n({
    id: 'pcg:autophagosome',
    label: 'Autophagosome',
    scale: 'organelle',
    parentId: 'pcg:skeletal_myocyte',
    ontologyId: 'GO:0005776',
    definition: 'Transient double-membrane vesicular compartment sequestering damaged organelles and proteotoxic aggregates for lysosomal degradation.',
    function: 'Executes macroautophagy and selective mitophagy to preserve cellular proteostasis and organellar quality.',
    referenceIds: REF_MIZUSHIMA,
    visualization: SCHEMATIC,
    learningObjectives: ['Outline the steps of autophagosome nucleation, LC3-II lipidation, and lysosomal fusion.'],
  }),
  n({
    id: 'pcg:complex_i_nadh_dehydrogenase',
    label: 'Mitochondrial Complex I (NADH:Ubiquinone Oxidoreductase)',
    scale: 'molecular_structure',
    parentId: 'pcg:myocyte_mitochondrion',
    definition: 'L-shaped 45-subunit respiratory supercomplex transferring electrons from NADH to ubiquinone while pumping 4 H+ across the inner membrane.',
    referenceIds: ['ref:mitchell-1961', 'ref:murphy-ros-2009'],
    visualization: CONCEPTUAL,
  }),
  n({
    id: 'pcg:atp_synthase_complex',
    label: 'ATP Synthase (Complex V, F1FO)',
    scale: 'molecular_structure',
    parentId: 'pcg:myocyte_mitochondrion',
    definition: 'Rotary nanomachine coupling inward proton translocation driven by proton motive force to ADP phosphorylation (3.67 H+ per ATP synthesized).',
    referenceIds: REF_MITCHELL,
    visualization: CONCEPTUAL,
  }),
  n({
    id: 'pcg:ampk_catalytic_complex',
    label: 'AMP-activated protein kinase (AMPK)',
    scale: 'molecular_structure',
    parentId: 'pcg:skeletal_myocyte',
    definition: 'Heterotrimeric kinase (alpha-beta-gamma) allosterically activated by AMP and ADP, phosphorylating Thr172 under metabolic energy stress.',
    referenceIds: REF_HARDIE,
    visualization: CONCEPTUAL,
  }),
  n({
    id: 'pcg:lc3_ii_phosphatidylethanolamine',
    label: 'LC3-II (Microtubule-associated protein 1A/1B-light chain 3-II)',
    scale: 'molecular_structure',
    parentId: 'pcg:autophagosome',
    definition: 'Lipidated autophagosomal membrane marker formed by covalent conjugation of cytosolic LC3-I to phosphatidylethanolamine.',
    referenceIds: REF_MIZUSHIMA,
    visualization: CONCEPTUAL,
  }),
  n({
    id: 'pcg:mitochondrial_chemiosmotic_pathway',
    label: 'Mitochondrial oxidative phosphorylation & chemiosmosis',
    scale: 'pathway',
    parentId: 'pcg:myocyte_mitochondrion',
    ontologyId: 'GO:0006119',
    definition: 'Coupled electron transport and proton pumping generating proton motive force Delta-p to drive ATP synthesis and metabolic heat production.',
    function: 'Synthesizes ATP with high thermodynamic efficiency (~2.5 ATP/NADH and ~1.5 ATP/FADH2).',
    pathophysiology: 'Ischemia, hypoxia, or sepsis leads to mitochondrial depolarization, electron stall at Complex I/III, and ROS overproduction.',
    referenceIds: ['ref:mitchell-1961', 'ref:murphy-ros-2009'],
    visualization: { representation: 'schematic', spatialPrecision: 'none', note: 'Chemiosmotic coupling schematic.' },
    learningObjectives: ['Calculate how uncoupling protein (UCP) activation dissipates the proton gradient into heat instead of ATP.'],
  }),
  n({
    id: 'pcg:macroautophagy_cargo_clearance_pathway',
    label: 'Macroautophagy and mitophagy clearance pathway',
    scale: 'pathway',
    parentId: 'pcg:skeletal_myocyte',
    ontologyId: 'GO:0016236',
    definition: 'Catabolic nutrient-recycling pathway triggered by AMPK activation and mTORC1 inhibition, clearing depolarized mitochondria and damaged proteins.',
    function: 'Restores energetic balance and eliminates cytotoxic ROS-generating organelles.',
    pathophysiology: 'Impaired lysosomal acidification or defective autophagosome maturation leads to accumulation of toxic p62 and cytotoxic cell death.',
    referenceIds: ['ref:hardie-ampk-2012', 'ref:mizushima-autophagy-2011'],
    visualization: { representation: 'schematic', spatialPrecision: 'none', note: 'Autophagic flux and lysosomal degradation schematic.' },
    learningObjectives: ['Explain how mTORC1 inhibition unlocks ULK1 complex activation to initiate phagophore formation.'],
  }),
  n({
    id: 'pcg:gene_mt_nd1',
    label: 'MT-ND1',
    scale: 'gene',
    parentId: 'pcg:myocyte_mitochondrion',
    definition: 'Mitochondrial gene encoding core subunit 1 of respiratory Complex I; mutations cause Leber hereditary optic neuropathy (LHON) and MELAS.',
    referenceIds: ['ref:hgnc-mt-nd1'],
    visualization: CONCEPTUAL,
  }),
  n({
    id: 'pcg:gene_prkaa1',
    label: 'PRKAA1',
    scale: 'gene',
    parentId: 'pcg:skeletal_myocyte',
    definition: 'Nuclear gene encoding the catalytic alpha-1 subunit of 5-prime-AMP-activated protein kinase (AMPK).',
    referenceIds: ['ref:hgnc-prkaa1'],
    visualization: CONCEPTUAL,
  }),
]

const e = (
  from: string,
  type: ConceptEdge['type'],
  to: string,
  referenceIds: readonly string[],
  grade: ConceptEdge['grade'] = 'established',
  note?: string
): ConceptEdge => ({ from, type, to, grade, referenceIds, ...(note ? { note } : {}) })

const CHEMIOSMOSIS = 'pcg:mitochondrial_chemiosmotic_pathway'
const AUTOPHAGY = 'pcg:macroautophagy_cargo_clearance_pathway'

const EDGES: ConceptEdge[] = [
  e('pcg:skeletal_muscle_organ', 'composed_of_tissue', 'pcg:skeletal_muscle_tissue', REF_MITCHELL),
  e('pcg:skeletal_muscle_tissue', 'contains_cell_type', 'pcg:skeletal_myocyte', REF_MITCHELL),
  e('pcg:skeletal_myocyte', 'contains_organelle', 'pcg:myocyte_mitochondrion', REF_MITCHELL),
  e('pcg:skeletal_myocyte', 'contains_organelle', 'pcg:autophagosome', REF_MIZUSHIMA),
  e('pcg:myocyte_mitochondrion', 'participates_in', CHEMIOSMOSIS, REF_MITCHELL),
  e('pcg:autophagosome', 'participates_in', AUTOPHAGY, REF_MIZUSHIMA),
  e('pcg:complex_i_nadh_dehydrogenase', 'participates_in', CHEMIOSMOSIS, REF_MITCHELL),
  e('pcg:atp_synthase_complex', 'participates_in', CHEMIOSMOSIS, REF_MITCHELL),
  e('pcg:lc3_ii_phosphatidylethanolamine', 'participates_in', AUTOPHAGY, REF_MIZUSHIMA),
  e('pcg:complex_i_nadh_dehydrogenase', 'encoded_by', 'pcg:gene_mt_nd1', ['ref:hgnc-mt-nd1']),
  e('pcg:ampk_catalytic_complex', 'encoded_by', 'pcg:gene_prkaa1', ['ref:hgnc-prkaa1']),
  e('pcg:ampk_catalytic_complex', 'regulates', AUTOPHAGY, REF_HARDIE),
]

export const SUBCELLULAR_ENERGETICS_AUTOPHAGY_SPEC: ConceptGraphSpec = {
  schemaVersion: CONCEPT_GRAPH_SCHEMA_VERSION,
  datasetVersion: '2026.11.03-subcellular-energetics-v1',
  references: REFS,
  nodes: NODES,
  edges: EDGES,
}
