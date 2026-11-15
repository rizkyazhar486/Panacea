// Pulmonary / respiratory vertical slice: whole body → respiratory system → lung → alveolus → alveolar epithelium → type II pneumocyte → lamellar body → surfactant → gas exchange pathway.
import { CONCEPT_GRAPH_SCHEMA_VERSION, type ConceptEdge, type ConceptGraphSpec, type ConceptNode, type ScientificReference, type VisualizationBinding } from '../model/types.ts'

const REFS: ScientificReference[] = [
  { id: 'ref:west-pulmonary-10e', kind: 'peer_reviewed', citation: 'West JB, Luks AM. West’s Respiratory Physiology: The Essentials. 10th ed. Wolters Kluwer; 2016: ch. 2 Ventilation, ch. 5 V/Q Relationships.', license: 'publisher copyright; cited only, no text reproduced', verification: 'cited_not_retrieved' },
  { id: 'ref:openstax-ap2e-resp', kind: 'open_textbook', citation: 'OpenStax. Anatomy and Physiology 2e (ch. 22 The Respiratory System). Rice University.', url: 'https://openstax.org/books/anatomy-and-physiology-2e', license: 'CC BY 4.0', verification: 'cited_not_retrieved' },
  { id: 'ref:hgnc-sftpb', kind: 'peer_reviewed', citation: 'HUGO Gene Nomenclature Committee (HGNC). Approved gene symbol SFTPB (surfactant protein B).', url: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:10801', license: 'CC0', verification: 'cited_not_retrieved' },
]

const NO3D: VisualizationBinding = { representation: 'schematic', spatialPrecision: 'none', note: 'Evidence-labelled educational schematic, not anatomical realism.' }
const CONCEPTUAL: VisualizationBinding = { representation: 'conceptual', spatialPrecision: 'none', note: 'Molecular concept; no spatial asset.' }
const LUNG3D: VisualizationBinding = { representation: 'anatomical_3d', assetKey: 'adult_male.respiratory', spatialPrecision: 'organ_level', note: 'Organ-level lung mesh; acinar microarchitecture is schematic.' }

const OS = ['ref:openstax-ap2e-resp'], WEST = ['ref:west-pulmonary-10e'], BOTH = ['ref:openstax-ap2e-resp', 'ref:west-pulmonary-10e']

// Pure: builds a node and touches nothing else. Without the annotation Rollup keeps the whole spec (the spread reads its
// argument) in every bundle that imports this domain's index, used or not.
const n = /* @__NO_SIDE_EFFECTS__ */ (x: Omit<ConceptNode, 'learningObjectives'> & { learningObjectives?: readonly string[] }): ConceptNode => ({ learningObjectives: [], ...x })

const NODES: ConceptNode[] = [
  n({ id: 'pcg:human_body', label: 'Human body', scale: 'whole_body', parentId: null, definition: 'The whole organism, root of the anatomical hierarchy.', referenceIds: OS, visualization: { representation: 'anatomical_3d', assetKey: 'adult_male.surface', spatialPrecision: 'organ_level' } }),
  n({ id: 'pcg:respiratory_system', label: 'Respiratory system', scale: 'organ_system', parentId: 'pcg:human_body', ontologyId: 'UBERON:0001004', definition: 'Airways, lungs, and respiratory muscles mediating pulmonary ventilation and external gas exchange.', referenceIds: OS, visualization: LUNG3D }),
  n({ id: 'pcg:lung', label: 'Lung', scale: 'organ', parentId: 'pcg:respiratory_system', ontologyId: 'UBERON:0002048', definition: 'Paired spongy respiratory organ enclosed by pleura, facilitating O2 uptake and CO2 elimination.', function: 'Ventilation and perfusion coupling for blood oxygenation and acid-base regulation.', referenceIds: OS, visualization: LUNG3D, learningObjectives: ['State the physiological determinants of alveolar ventilation and dead space.'] }),
  n({ id: 'pcg:pulmonary_alveolus', label: 'Pulmonary alveolus', scale: 'substructure', parentId: 'pcg:lung', ontologyId: 'UBERON:0002299', definition: 'Microscopic sac-like dilatation of terminal bronchioles where gas exchange across the blood-air barrier occurs.', function: 'Minimizes diffusion distance (~0.2–0.5 µm) to capillary blood.', referenceIds: BOTH, visualization: NO3D }),
  n({ id: 'pcg:pulmonary_capillary', label: 'Pulmonary capillary bed', scale: 'substructure', parentId: 'pcg:lung', definition: 'Dense capillary network surrounding alveoli receiving the entire right ventricular cardiac output.', referenceIds: BOTH, visualization: NO3D }),
  n({ id: 'pcg:alveolar_epithelium', label: 'Alveolar epithelium', scale: 'tissue', parentId: 'pcg:pulmonary_alveolus', definition: 'Monolayer composed of squamous type I pneumocytes and secretory cuboidal type II pneumocytes.', referenceIds: OS, visualization: NO3D }),
  n({ id: 'pcg:type_2_pneumocyte', label: 'Type II pneumocyte', scale: 'cell', parentId: 'pcg:alveolar_epithelium', ontologyId: 'CL:0002063', definition: 'Cuboidal alveolar cell that synthesizes, packages, and secretes pulmonary surfactant, and acts as stem cell for re-epithelialization.', function: 'Reduces surface tension to prevent end-expiratory alveolar collapse (atelectasis).', referenceIds: BOTH, visualization: NO3D, learningObjectives: ['Explain Laplace’s law (P = 2T/r) and how surfactant stabilizes alveoli of differing radii.'] }),
  n({ id: 'pcg:lamellar_body', label: 'Lamellar body', scale: 'organelle', parentId: 'pcg:type_2_pneumocyte', ontologyId: 'GO:0042599', definition: 'Lysosome-related organelle storing tightly packed concentric phospholipid bilayers (dipalmitoylphosphatidylcholine and surfactant proteins).', referenceIds: WEST, visualization: NO3D }),
  n({ id: 'pcg:surfactant_protein_b', label: 'Surfactant protein B (SP-B)', scale: 'molecular_structure', parentId: 'pcg:lamellar_body', definition: 'Hydrophobic protein critical for spreading surfactant phospholipids and forming the tubular myelin lattice.', referenceIds: WEST, visualization: CONCEPTUAL }),
  n({ id: 'pcg:alveolar_gas_exchange', label: 'Alveolar gas exchange', scale: 'pathway', parentId: 'pcg:type_2_pneumocyte', ontologyId: 'GO:0007585', definition: 'Passive diffusion of oxygen from alveolar gas to hemoglobin down its partial pressure gradient, and reverse diffusion of carbon dioxide.', function: 'Achieves alveolar-arterial partial pressure equilibrium across the respiratory membrane.', pathophysiology: 'V/Q mismatch elevates the alveolar-arterial (A-a) PO2 gradient; true anatomic shunt (V/Q = 0) causes hypoxemia refractory to 100% supplemental FiO2.', referenceIds: BOTH, visualization: { representation: 'schematic', spatialPrecision: 'none', note: 'Educational gas diffusion pathway.' }, learningObjectives: ['Calculate ideal PAO2 using the alveolar gas equation: PAO2 = FiO2(Patm - 47) - PaCO2/R.', 'Differentiate high A-a gradient hypoxemia (V/Q mismatch, shunt, diffusion impairment) from normal A-a hypoxemia (hypoventilation, high altitude).'] }),
  n({ id: 'pcg:gene_sftpb', label: 'SFTPB', scale: 'gene', parentId: 'pcg:type_2_pneumocyte', definition: 'Gene encoding surfactant protein B; congenital deficiency causes fatal neonatal respiratory distress syndrome.', referenceIds: ['ref:hgnc-sftpb'], visualization: CONCEPTUAL }),
]

const e = (from: string, type: ConceptEdge['type'], to: string, referenceIds: readonly string[], grade: ConceptEdge['grade'] = 'established', note?: string): ConceptEdge => ({ from, type, to, grade, referenceIds, ...(note ? { note } : {}) })
const AGE = 'pcg:alveolar_gas_exchange'

const EDGES: ConceptEdge[] = [
  e('pcg:lung', 'composed_of_tissue', 'pcg:alveolar_epithelium', OS),
  e('pcg:pulmonary_alveolus', 'composed_of_tissue', 'pcg:alveolar_epithelium', OS),
  e('pcg:alveolar_epithelium', 'contains_cell_type', 'pcg:type_2_pneumocyte', OS),
  e('pcg:type_2_pneumocyte', 'contains_organelle', 'pcg:lamellar_body', WEST),
  e('pcg:surfactant_protein_b', 'participates_in', AGE, WEST),
  e('pcg:surfactant_protein_b', 'encoded_by', 'pcg:gene_sftpb', ['ref:hgnc-sftpb']),
  e('pcg:pulmonary_alveolus', 'supplied_by', 'pcg:pulmonary_capillary', BOTH),
]

export const PULMONARY_SPEC: ConceptGraphSpec = { schemaVersion: CONCEPT_GRAPH_SCHEMA_VERSION, datasetVersion: '2026.11.02-pulm1', references: REFS, nodes: NODES, edges: EDGES }
