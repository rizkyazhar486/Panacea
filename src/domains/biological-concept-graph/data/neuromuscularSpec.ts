// Neuromuscular vertical slice: whole body → nervous system → spinal cord → ventral horn → alpha motor neuron → neuromuscular junction → ACh receptor → skeletal muscle contraction.
import { CONCEPT_GRAPH_SCHEMA_VERSION, type ConceptEdge, type ConceptGraphSpec, type ConceptNode, type ScientificReference, type VisualizationBinding } from '../model/types.ts'

const REFS: ScientificReference[] = [
  { id: 'ref:openstax-ap2e-nmj', kind: 'open_textbook', citation: 'OpenStax. Anatomy and Physiology 2e (ch. 10 Muscle Tissue: Nervous Stimulation of Muscle Contraction; ch. 12 The Nervous System). Rice University.', url: 'https://openstax.org/books/anatomy-and-physiology-2e', license: 'CC BY 4.0', verification: 'cited_not_retrieved' },
  { id: 'ref:kandel-principles-5e', kind: 'peer_reviewed', citation: 'Kandel ER, Schwartz JH, Jessell TM, Siegelbaum SA, Hudspeth AJ. Principles of Neural Science. 5th ed. McGraw-Hill; 2013: ch. 9 The Neuromuscular Junction.', license: 'publisher copyright; cited only, no text reproduced', verification: 'cited_not_retrieved' },
  { id: 'ref:hgnc-chrna1', kind: 'peer_reviewed', citation: 'HUGO Gene Nomenclature Committee (HGNC). Approved gene symbol CHRNA1 (cholinergic receptor nicotinic alpha 1 subunit).', url: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:1955', license: 'CC0', verification: 'cited_not_retrieved' },
]

const NO3D: VisualizationBinding = { representation: 'schematic', spatialPrecision: 'none', note: 'Evidence-labelled educational schematic, not anatomical realism.' }
const CONCEPTUAL: VisualizationBinding = { representation: 'conceptual', spatialPrecision: 'none', note: 'Molecular concept; no spatial asset.' }
const NERVOUS3D: VisualizationBinding = { representation: 'anatomical_3d', assetKey: 'adult_male.nervous', spatialPrecision: 'organ_level', note: 'Organ-level nervous system mesh; microstructures are schematic.' }

const OS = ['ref:openstax-ap2e-nmj'], KANDEL = ['ref:kandel-principles-5e'], BOTH = ['ref:openstax-ap2e-nmj', 'ref:kandel-principles-5e']

// Pure: builds a node and touches nothing else. Without the annotation Rollup keeps the whole spec (the spread reads its
// argument) in every bundle that imports this domain's index, used or not.
const n = /* @__NO_SIDE_EFFECTS__ */ (x: Omit<ConceptNode, 'learningObjectives'> & { learningObjectives?: readonly string[] }): ConceptNode => ({ learningObjectives: [], ...x })

const NODES: ConceptNode[] = [
  n({ id: 'pcg:human_body', label: 'Human body', scale: 'whole_body', parentId: null, definition: 'The whole organism, root of the anatomical hierarchy.', referenceIds: OS, visualization: { representation: 'anatomical_3d', assetKey: 'adult_male.surface', spatialPrecision: 'organ_level' } }),
  n({ id: 'pcg:nervous_system', label: 'Nervous system', scale: 'organ_system', parentId: 'pcg:human_body', ontologyId: 'UBERON:0001016', definition: 'Brain, spinal cord, and peripheral nerves mediating rapid electrical signaling.', referenceIds: OS, visualization: NERVOUS3D }),
  n({ id: 'pcg:spinal_cord', label: 'Spinal cord', scale: 'organ', parentId: 'pcg:nervous_system', ontologyId: 'UBERON:0002240', definition: 'Cylindrical bundle of nerve fibers and tissues connected with the brain, transmitting neural impulses.', function: 'Relays motor output and sensory input; executes spinal reflex arcs.', referenceIds: OS, visualization: NERVOUS3D, learningObjectives: ['Distinguish the ventral horn (motor) from the dorsal horn (sensory).'] }),
  n({ id: 'pcg:ventral_horn', label: 'Ventral horn of spinal cord', scale: 'substructure', parentId: 'pcg:spinal_cord', ontologyId: 'UBERON:0002257', definition: 'Anterior column of grey matter containing the somata of somatic lower motor neurons.', function: 'Final common path for voluntary and reflex motor commands.', referenceIds: OS, visualization: NO3D }),
  n({ id: 'pcg:peripheral_nerve', label: 'Peripheral nerve', scale: 'substructure', parentId: 'pcg:spinal_cord', ontologyId: 'UBERON:0002003', definition: 'Ensheathed bundle of somatic motor and sensory nerve fibers extending to target tissues.', referenceIds: OS, visualization: NO3D }),
  n({ id: 'pcg:motor_unit_tissue', label: 'Skeletal muscle motor unit', scale: 'tissue', parentId: 'pcg:ventral_horn', definition: 'One somatic motor neuron and all the skeletal muscle fibres it innervates.', function: 'Quantal element of voluntary force production.', referenceIds: BOTH, visualization: NO3D }),
  n({ id: 'pcg:alpha_motor_neuron', label: 'Alpha motor neuron', scale: 'cell', parentId: 'pcg:motor_unit_tissue', ontologyId: 'CL:0000095', definition: 'Large, multipolar lower motor neuron of the brainstem and spinal cord that directly innervates extrafusal muscle fibers.', function: 'Elicits muscle contraction via action potential propagation along myelinated axon.', referenceIds: BOTH, visualization: NO3D, learningObjectives: ['Contrast upper motor neuron signs (spasticity, hyperreflexia) with lower motor neuron signs (atrophy, fasciculations, flaccidity).'] }),
  n({ id: 'pcg:presynaptic_terminal', label: 'Presynaptic axon terminal', scale: 'organelle', parentId: 'pcg:alpha_motor_neuron', definition: 'Distal specialization of the motor axon filled with acetylcholine vesicles opposing the motor end plate.', referenceIds: KANDEL, visualization: NO3D }),
  n({ id: 'pcg:synaptic_cleft_nmj', label: 'Synaptic cleft of NMJ', scale: 'organelle', parentId: 'pcg:alpha_motor_neuron', definition: 'Extracellular gap (~20–50 nm) containing acetylcholinesterase and basal lamina.', referenceIds: KANDEL, visualization: NO3D }),
  n({ id: 'pcg:nicotinic_ach_receptor', label: 'Nicotinic acetylcholine receptor (muscle type)', scale: 'molecular_structure', parentId: 'pcg:presynaptic_terminal', definition: 'Pentameric ligand-gated cation channel on the postjunctional folds opened by two molecules of ACh.', referenceIds: KANDEL, visualization: CONCEPTUAL }),
  n({ id: 'pcg:acetylcholinesterase', label: 'Acetylcholinesterase', scale: 'molecular_structure', parentId: 'pcg:synaptic_cleft_nmj', definition: 'Synaptic enzyme rapidly hydrolyzing acetylcholine into acetate and choline to terminate transmission.', referenceIds: KANDEL, visualization: CONCEPTUAL }),
  n({ id: 'pcg:neuromuscular_transmission', label: 'Neuromuscular synaptic transmission', scale: 'pathway', parentId: 'pcg:alpha_motor_neuron', ontologyId: 'GO:0007274', definition: 'Depolarization of presynaptic bouton opens Cav2.1, triggering ACh exocytosis; ACh activates postjunctional nAChR, causing end-plate potential (EPP) and triggering muscle action potential.', function: 'Converts presynaptic electrical nerve impulse into postsynaptic muscular excitation.', pathophysiology: 'Autoantibodies against postjunctional nAChR (myasthenia gravis) cause fatigable weakness; presynaptic Cav2.1 autoantibodies (Lambert-Eaton) cause weakness with post-exercise facilitation.', referenceIds: BOTH, visualization: { representation: 'schematic', spatialPrecision: 'none', note: 'Educational synaptic pathway.' }, learningObjectives: ['Describe the sequence of events from presynaptic calcium entry to muscle end-plate potential.', 'Explain the pharmacological difference between AChE inhibitors and depolarizing neuromuscular blockers.'] }),
  n({ id: 'pcg:gene_chrna1', label: 'CHRNA1', scale: 'gene', parentId: 'pcg:alpha_motor_neuron', definition: 'Gene encoding the alpha-1 subunit of the muscle nicotinic acetylcholine receptor.', referenceIds: ['ref:hgnc-chrna1'], visualization: CONCEPTUAL }),
]

const e = (from: string, type: ConceptEdge['type'], to: string, referenceIds: readonly string[], grade: ConceptEdge['grade'] = 'established', note?: string): ConceptEdge => ({ from, type, to, grade, referenceIds, ...(note ? { note } : {}) })
const NMJ = 'pcg:neuromuscular_transmission'

const EDGES: ConceptEdge[] = [
  e('pcg:spinal_cord', 'composed_of_tissue', 'pcg:motor_unit_tissue', OS),
  e('pcg:ventral_horn', 'composed_of_tissue', 'pcg:motor_unit_tissue', OS),
  e('pcg:motor_unit_tissue', 'contains_cell_type', 'pcg:alpha_motor_neuron', OS),
  e('pcg:alpha_motor_neuron', 'contains_organelle', 'pcg:presynaptic_terminal', KANDEL),
  e('pcg:alpha_motor_neuron', 'contains_organelle', 'pcg:synaptic_cleft_nmj', KANDEL),
  e('pcg:nicotinic_ach_receptor', 'participates_in', NMJ, KANDEL),
  e('pcg:acetylcholinesterase', 'participates_in', NMJ, KANDEL),
  e('pcg:nicotinic_ach_receptor', 'encoded_by', 'pcg:gene_chrna1', ['ref:hgnc-chrna1']),
  e('pcg:spinal_cord', 'supplied_by', 'pcg:peripheral_nerve', OS),
]

export const NEUROMUSCULAR_SPEC: ConceptGraphSpec = { schemaVersion: CONCEPT_GRAPH_SCHEMA_VERSION, datasetVersion: '2026.11.02-nmj1', references: REFS, nodes: NODES, edges: EDGES }
