// Cardiovascular vertical slice: whole body → heart → myocardium → cardiomyocyte → sarcomere/SR/T-tubule → channels → EC coupling → genes.
// Hierarchy note: `parentId` is hierarchical context (part_of for structures; for pathway/gene nodes, the cell type in which the cited function is described).
// Typed biological relations live only in `edges`. Ontology ids are format-checked, not live-resolved. All references are `cited_not_retrieved`
// (recorded from known bibliographic data; text not machine-verified in-repo) — review before any stronger claim.
import { CONCEPT_GRAPH_SCHEMA_VERSION, type ConceptEdge, type ConceptGraphSpec, type ConceptNode, type ScientificReference, type VisualizationBinding } from '../model/types.ts'

const REFS: ScientificReference[] = [
  { id: 'ref:openstax-ap2e', kind: 'open_textbook', citation: 'OpenStax. Anatomy and Physiology 2e (ch. 10 Muscle Tissue; ch. 19 The Cardiovascular System: The Heart). Rice University.', url: 'https://openstax.org/books/anatomy-and-physiology-2e', license: 'CC BY 4.0', verification: 'cited_not_retrieved' },
  { id: 'ref:bers-2002', kind: 'peer_reviewed', citation: 'Bers DM. Cardiac excitation–contraction coupling. Nature 2002;415:198–205.', doi: '10.1038/415198a', license: 'publisher copyright; cited only, no text reproduced', verification: 'cited_not_retrieved' },
  { id: 'ref:hgnc-symbols', kind: 'peer_reviewed', citation: 'HUGO Gene Nomenclature Committee (HGNC). Approved gene symbols RYR2, CACNA1C, ATP2A2.', url: 'https://www.genenames.org', license: 'CC0', verification: 'cited_not_retrieved' },
]

const NO3D: VisualizationBinding = { representation: 'schematic', spatialPrecision: 'none', note: 'Evidence-labelled educational schematic, not anatomical realism.' }
const CONCEPTUAL: VisualizationBinding = { representation: 'conceptual', spatialPrecision: 'none', note: 'Molecular concept; no spatial asset.' }
const HEART3D: VisualizationBinding = { representation: 'anatomical_3d', assetKey: 'adult_male.cardiovascular', spatialPrecision: 'organ_level', note: 'Organ-level mesh only; substructure positions are not claimed.' }
const OS = ['ref:openstax-ap2e'], BERS = ['ref:bers-2002'], BOTH = ['ref:openstax-ap2e', 'ref:bers-2002']

const n = (x: Omit<ConceptNode, 'learningObjectives'> & { learningObjectives?: readonly string[] }): ConceptNode => ({ learningObjectives: [], ...x })

const NODES: ConceptNode[] = [
  n({ id: 'pcg:human_body', label: 'Human body', scale: 'whole_body', parentId: null, definition: 'The whole organism, root of the anatomical hierarchy.', referenceIds: OS, visualization: { representation: 'anatomical_3d', assetKey: 'adult_male.surface', spatialPrecision: 'organ_level' } }),
  n({ id: 'pcg:cardiovascular_system', label: 'Cardiovascular system', scale: 'organ_system', parentId: 'pcg:human_body', ontologyId: 'UBERON:0004535', definition: 'Heart and vessels that circulate blood.', referenceIds: OS, visualization: HEART3D }),
  n({ id: 'pcg:heart', label: 'Heart', scale: 'organ', parentId: 'pcg:cardiovascular_system', ontologyId: 'UBERON:0000948', definition: 'Four-chambered muscular pump that drives blood through the pulmonary and systemic circuits.', function: 'Generates pressure to propel blood.', referenceIds: OS, visualization: HEART3D, learningObjectives: ['Name the four chambers and the great vessels they connect to.'] }),
  n({ id: 'pcg:left_ventricle', label: 'Left ventricle', scale: 'substructure', parentId: 'pcg:heart', ontologyId: 'UBERON:0002084', definition: 'Chamber that ejects blood into the aorta for the systemic circulation.', function: 'Systemic pressure pump; stroke volume is the volume ejected per beat.', referenceIds: OS, visualization: NO3D, learningObjectives: ['Compute cardiac output from heart rate and stroke volume with correct units.'] }),
  n({ id: 'pcg:cardiac_conduction_system', label: 'Cardiac conduction system', scale: 'substructure', parentId: 'pcg:heart', definition: 'Specialised myocardial cells (sinoatrial node, atrioventricular node, His–Purkinje fibres) that initiate and coordinate the heartbeat.', referenceIds: OS, visualization: NO3D }),
  n({ id: 'pcg:coronary_arteries', label: 'Coronary arteries', scale: 'substructure', parentId: 'pcg:heart', definition: 'Arteries arising from the aortic root that perfuse the myocardium.', referenceIds: OS, visualization: NO3D }),
  n({ id: 'pcg:myocardium', label: 'Myocardium', scale: 'tissue', parentId: 'pcg:heart', ontologyId: 'UBERON:0002349', definition: 'Cardiac muscle layer of the heart wall.', referenceIds: OS, visualization: NO3D }),
  n({ id: 'pcg:cardiomyocyte', label: 'Cardiomyocyte', scale: 'cell', parentId: 'pcg:myocardium', ontologyId: 'CL:0000746', definition: 'Striated, typically uninucleate or binucleate contractile cell of the myocardium joined by intercalated discs.', function: 'Converts an electrical action potential into force via excitation–contraction coupling.', referenceIds: BOTH, visualization: NO3D, learningObjectives: ['Describe how a cardiomyocyte action potential triggers contraction.'] }),
  n({ id: 'pcg:sarcomere', label: 'Sarcomere', scale: 'organelle', parentId: 'pcg:cardiomyocyte', ontologyId: 'GO:0030017', definition: 'Repeating contractile unit of the myofibril formed by overlapping thin (actin) and thick (myosin) filaments.', referenceIds: OS, visualization: NO3D }),
  n({ id: 'pcg:sarcoplasmic_reticulum', label: 'Sarcoplasmic reticulum', scale: 'organelle', parentId: 'pcg:cardiomyocyte', ontologyId: 'GO:0016529', definition: 'Specialised endoplasmic reticulum that stores and releases the calcium used for contraction.', referenceIds: BOTH, visualization: NO3D }),
  n({ id: 'pcg:sarcolemma_t_tubule', label: 'Sarcolemma and T-tubules', scale: 'organelle', parentId: 'pcg:cardiomyocyte', definition: 'Plasma membrane and its transverse invaginations that bring the action potential close to the sarcoplasmic reticulum.', referenceIds: BOTH, visualization: NO3D }),
  n({ id: 'pcg:mitochondrion', label: 'Mitochondrion', scale: 'organelle', parentId: 'pcg:cardiomyocyte', ontologyId: 'GO:0005739', definition: 'Organelle producing most of the ATP that fuels cross-bridge cycling and calcium re-uptake.', referenceIds: OS, visualization: NO3D }),
  n({ id: 'pcg:ltype_calcium_channel', label: 'L-type calcium channel', scale: 'molecular_structure', parentId: 'pcg:sarcolemma_t_tubule', definition: 'Voltage-gated channel admitting a small Ca²⁺ influx during the action potential plateau.', referenceIds: BERS, visualization: CONCEPTUAL }),
  n({ id: 'pcg:ryanodine_receptor_2', label: 'Ryanodine receptor 2 (RyR2)', scale: 'molecular_structure', parentId: 'pcg:sarcoplasmic_reticulum', definition: 'Ca²⁺-release channel of the sarcoplasmic reticulum, opened by trigger calcium.', referenceIds: BERS, visualization: CONCEPTUAL }),
  n({ id: 'pcg:serca2a', label: 'SERCA2a', scale: 'molecular_structure', parentId: 'pcg:sarcoplasmic_reticulum', definition: 'ATP-driven pump returning cytosolic Ca²⁺ to the sarcoplasmic reticulum, enabling relaxation.', referenceIds: BERS, visualization: CONCEPTUAL }),
  n({ id: 'pcg:troponin_c', label: 'Troponin C', scale: 'molecular_structure', parentId: 'pcg:sarcomere', definition: 'Thin-filament protein that binds Ca²⁺ and permits actin–myosin interaction.', referenceIds: OS, visualization: CONCEPTUAL }),
  n({ id: 'pcg:excitation_contraction_coupling', label: 'Excitation–contraction coupling', scale: 'pathway', parentId: 'pcg:cardiomyocyte', ontologyId: 'GO:0060048', definition: 'Calcium-induced calcium release: depolarisation opens L-type channels, trigger Ca²⁺ opens RyR2, released Ca²⁺ binds troponin C to start contraction; SERCA2a and extrusion restore diastolic calcium.', function: 'Couples membrane excitation to force generation.', pathophysiology: 'Altered calcium handling is discussed in the cited review in the context of heart failure; no diagnostic inference is made here.', referenceIds: BOTH, visualization: { representation: 'schematic', spatialPrecision: 'none', note: 'Educational pathway diagram.' }, learningObjectives: ['Order the steps of calcium-induced calcium release.', 'Explain why relaxation needs ATP.'] }),
  n({ id: 'pcg:gene_cacna1c', label: 'CACNA1C', scale: 'gene', parentId: 'pcg:cardiomyocyte', definition: 'Gene encoding the pore-forming α1C subunit of the cardiac L-type calcium channel.', referenceIds: ['ref:hgnc-symbols'], visualization: CONCEPTUAL }),
  n({ id: 'pcg:gene_ryr2', label: 'RYR2', scale: 'gene', parentId: 'pcg:cardiomyocyte', definition: 'Gene encoding ryanodine receptor 2.', referenceIds: ['ref:hgnc-symbols'], visualization: CONCEPTUAL }),
  n({ id: 'pcg:gene_atp2a2', label: 'ATP2A2', scale: 'gene', parentId: 'pcg:cardiomyocyte', definition: 'Gene encoding SERCA2 (SERCA2a is the cardiac splice isoform).', referenceIds: ['ref:hgnc-symbols'], visualization: CONCEPTUAL }),
]

const e = (from: string, type: ConceptEdge['type'], to: string, referenceIds: readonly string[], grade: ConceptEdge['grade'] = 'established', note?: string): ConceptEdge => ({ from, type, to, grade, referenceIds, ...(note ? { note } : {}) })
const EC = 'pcg:excitation_contraction_coupling'

const EDGES: ConceptEdge[] = [
  e('pcg:heart', 'composed_of_tissue', 'pcg:myocardium', OS),
  e('pcg:heart', 'supplied_by', 'pcg:coronary_arteries', OS),
  e('pcg:left_ventricle', 'supplied_by', 'pcg:coronary_arteries', OS),
  e('pcg:myocardium', 'contains_cell_type', 'pcg:cardiomyocyte', OS),
  e('pcg:cardiomyocyte', 'contains_organelle', 'pcg:sarcomere', OS),
  e('pcg:cardiomyocyte', 'contains_organelle', 'pcg:sarcoplasmic_reticulum', BOTH),
  e('pcg:cardiomyocyte', 'contains_organelle', 'pcg:sarcolemma_t_tubule', BOTH),
  e('pcg:cardiomyocyte', 'contains_organelle', 'pcg:mitochondrion', OS),
  e('pcg:ltype_calcium_channel', 'participates_in', EC, BERS),
  e('pcg:ryanodine_receptor_2', 'participates_in', EC, BERS),
  e('pcg:serca2a', 'participates_in', EC, BERS),
  e('pcg:troponin_c', 'participates_in', EC, OS),
  e('pcg:ltype_calcium_channel', 'encoded_by', 'pcg:gene_cacna1c', ['ref:hgnc-symbols']),
  e('pcg:ryanodine_receptor_2', 'encoded_by', 'pcg:gene_ryr2', ['ref:hgnc-symbols']),
  e('pcg:serca2a', 'encoded_by', 'pcg:gene_atp2a2', ['ref:hgnc-symbols']),
]

export const CARDIOVASCULAR_SPEC: ConceptGraphSpec = { schemaVersion: CONCEPT_GRAPH_SCHEMA_VERSION, datasetVersion: '2026.11.01-cv1', references: REFS, nodes: NODES, edges: EDGES }
