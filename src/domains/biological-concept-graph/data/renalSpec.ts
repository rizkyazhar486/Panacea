// Renal & Nephron vertical slice: whole body → urinary system → kidney → renal corpuscle & nephron → glomerular filtration barrier → podocyte → slit diaphragm → nephrin → ultrafiltration pathway → NPHS1 gene.
// Hierarchy note: `parentId` is hierarchical context. Typed biological relations live in `edges`.
import { CONCEPT_GRAPH_SCHEMA_VERSION, type ConceptEdge, type ConceptGraphSpec, type ConceptNode, type ScientificReference, type VisualizationBinding } from '../model/types.ts'

const REFS: ScientificReference[] = [
  { id: 'ref:openstax-ap2e-renal', kind: 'open_textbook', citation: 'OpenStax. Anatomy and Physiology 2e (ch. 25 The Urinary System). Rice University.', url: 'https://openstax.org/books/anatomy-and-physiology-2e', license: 'CC BY 4.0', verification: 'cited_not_retrieved' },
  { id: 'ref:guyton-renal-14e', kind: 'peer_reviewed', citation: 'Hall JE, Hall ME. Guyton and Hall Textbook of Medical Physiology. 14th ed. Elsevier; 2021: ch. 26 Urine Formation by the Kidneys: Glomerular Filtration, Tubular Processing.', license: 'publisher copyright; cited only, no text reproduced', verification: 'cited_not_retrieved' },
  { id: 'ref:kestila-1998', kind: 'peer_reviewed', citation: 'Kestilä M et al. Positionally cloned gene for a novel glomerular protein—nephrin—is mutated in congenital nephrotic syndrome. Mol Cell 1998;1:575–582.', doi: '10.1016/s1097-2765(00)80057-x', license: 'publisher copyright; cited only, no text reproduced', verification: 'cited_not_retrieved' },
  { id: 'ref:hgnc-nphs1', kind: 'peer_reviewed', citation: 'HUGO Gene Nomenclature Committee (HGNC). Approved gene symbol NPHS1 (NPHS1 adhesion molecule, nephrocidin).', url: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:7908', license: 'CC0', verification: 'cited_not_retrieved' },
  { id: 'ref:hgnc-slc5a2', kind: 'peer_reviewed', citation: 'HUGO Gene Nomenclature Committee (HGNC). Approved gene symbol SLC5A2 (solute carrier family 5 member 2 / SGLT2).', url: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:11006', license: 'CC0', verification: 'cited_not_retrieved' },
]

const NO3D: VisualizationBinding = { representation: 'schematic', spatialPrecision: 'none', note: 'Evidence-labelled educational schematic, not anatomical realism.' }
const CONCEPTUAL: VisualizationBinding = { representation: 'conceptual', spatialPrecision: 'none', note: 'Molecular concept; no spatial asset.' }
const KIDNEY3D: VisualizationBinding = { representation: 'anatomical_3d', assetKey: 'adult_male.urinary', spatialPrecision: 'organ_level', note: 'Organ-level kidney mesh; glomerular nephron microstructure is schematic.' }

const OS = ['ref:openstax-ap2e-renal'], GUYTON = ['ref:guyton-renal-14e'], BOTH = ['ref:openstax-ap2e-renal', 'ref:guyton-renal-14e']

// Pure: builds a node and touches nothing else. Without the annotation Rollup keeps the whole spec (the spread reads its
// argument) in every bundle that imports this domain's index, used or not.
const n = /* @__NO_SIDE_EFFECTS__ */ (x: Omit<ConceptNode, 'learningObjectives'> & { learningObjectives?: readonly string[] }): ConceptNode => ({ learningObjectives: [], ...x })

const NODES: ConceptNode[] = [
  n({ id: 'pcg:human_body', label: 'Human body', scale: 'whole_body', parentId: null, definition: 'The whole organism, root of the anatomical hierarchy.', referenceIds: OS, visualization: { representation: 'anatomical_3d', assetKey: 'adult_male.surface', spatialPrecision: 'organ_level' } }),
  n({ id: 'pcg:urinary_system', label: 'Urinary system', scale: 'organ_system', parentId: 'pcg:human_body', ontologyId: 'UBERON:0001008', definition: 'Kidneys, ureters, urinary bladder, and urethra maintaining fluid, electrolyte, and acid-base homeostasis and eliminating metabolic waste.', referenceIds: OS, visualization: KIDNEY3D }),
  n({ id: 'pcg:kidney', label: 'Kidney', scale: 'organ', parentId: 'pcg:urinary_system', ontologyId: 'UBERON:0002113', definition: 'Paired retroperitoneal bean-shaped organ filtering blood plasma to generate urine and regulating arterial blood pressure via renin secretion.', function: 'Glomerular filtration, tubular reabsorption/secretion, and endocrine secretion of erythropoietin and calcitriol.', referenceIds: OS, visualization: KIDNEY3D, learningObjectives: ['State the normal glomerular filtration rate (~125 mL/min or 180 L/day) in a healthy adult.'] }),
  n({ id: 'pcg:renal_cortex', label: 'Renal cortex', scale: 'substructure', parentId: 'pcg:kidney', ontologyId: 'UBERON:0001225', definition: 'Outer region of the kidney containing renal corpuscles, proximal and distal convoluted tubules, and cortical collecting ducts.', referenceIds: OS, visualization: NO3D }),
  n({ id: 'pcg:nephron', label: 'Nephron', scale: 'substructure', parentId: 'pcg:renal_cortex', ontologyId: 'UBERON:0001285', definition: 'Microscopic functional filtration unit of the kidney, comprising approximately 1 million units per human kidney.', function: 'Generates primary ultrafiltrate and selectively processes electrolytes, solutes, and water.', referenceIds: BOTH, visualization: NO3D, learningObjectives: ['Trace fluid flow through the nephron segments from Bowman’s capsule to the collecting duct.'] }),
  n({ id: 'pcg:renal_glomerular_capillaries', label: 'Glomerular capillary tuft', scale: 'substructure', parentId: 'pcg:nephron', definition: 'High-pressure capillary network interposed between afferent and efferent arterioles.', referenceIds: GUYTON, visualization: NO3D }),
  n({ id: 'pcg:glomerular_filtration_barrier', label: 'Glomerular filtration barrier', scale: 'tissue', parentId: 'pcg:nephron', ontologyId: 'UBERON:0005740', definition: 'Three-layer trilaminar sieve: fenestrated capillary endothelium, anionic glomerular basement membrane, and podocyte foot processes.', referenceIds: BOTH, visualization: NO3D }),
  n({ id: 'pcg:podocyte', label: 'Podocyte (visceral epithelial cell)', scale: 'cell', parentId: 'pcg:glomerular_filtration_barrier', ontologyId: 'CL:0000653', definition: 'Terminally differentiated visceral epithelial cell with interdigitating pedicels bridging the urinary space.', function: 'Forms the final size- and charge-selective barrier restricting passage of albumin and high-molecular-weight proteins.', referenceIds: BOTH, visualization: NO3D, learningObjectives: ['Explain how podocyte effacement leads to nephrotic-range proteinuria.'] }),
  n({ id: 'pcg:proximal_tubule_cell', label: 'Proximal tubule epithelial cell', scale: 'cell', parentId: 'pcg:glomerular_filtration_barrier', ontologyId: 'CL:0002306', definition: 'Highly metabolically active cuboidal cell with dense apical brush-border microvilli and abundant basolateral mitochondria.', function: 'Reabsorbs ~65% of filtered water and sodium, and virtually 100% of filtered glucose and amino acids.', referenceIds: BOTH, visualization: NO3D, learningObjectives: ['Describe secondary active transport of glucose via apical SGLT2 and basolateral GLUT2.'] }),
  n({ id: 'pcg:slit_diaphragm', label: 'Slit diaphragm', scale: 'organelle', parentId: 'pcg:podocyte', ontologyId: 'GO:0032301', definition: 'Specialized adherens junction spanning adjacent podocyte filtration slits with an effective pore diameter of ~40 Å.', referenceIds: ['ref:kestila-1998', 'ref:guyton-renal-14e'], visualization: NO3D }),
  n({ id: 'pcg:brush_border_membrane', label: 'Brush border microvilli', scale: 'organelle', parentId: 'pcg:proximal_tubule_cell', ontologyId: 'GO:0031526', definition: 'Dense apical membrane microvilli dramatically increasing absorptive surface area in the proximal convoluted tubule.', referenceIds: OS, visualization: NO3D }),
  n({ id: 'pcg:nephrin_protein', label: 'Nephrin (NPHS1)', scale: 'molecular_structure', parentId: 'pcg:slit_diaphragm', definition: 'Transmembrane immunoglobulin-superfamily adhesion protein forming the zipper-like filtration slit core.', referenceIds: ['ref:kestila-1998'], visualization: CONCEPTUAL }),
  n({ id: 'pcg:sglt2_transporter', label: 'Sodium-glucose cotransporter 2 (SGLT2)', scale: 'molecular_structure', parentId: 'pcg:brush_border_membrane', definition: 'High-capacity, low-affinity 1Na+:1glucose symporter localized to the early S1/S2 segments of the proximal convoluted tubule.', referenceIds: GUYTON, visualization: CONCEPTUAL }),
  n({ id: 'pcg:glomerular_ultrafiltration_pathway', label: 'Glomerular ultrafiltration', scale: 'pathway', parentId: 'pcg:podocyte', ontologyId: 'GO:0003094', definition: 'Fluid movement governed by net Starling filtration pressure: GFR = Kf × [(P_gc - P_bs) - (π_gc - π_bs)].', function: 'Generates cell-free and protein-free plasma ultrafiltrate for excretion of water-soluble toxins.', pathophysiology: 'Arteriolar resistance modulates GFR: afferent constriction drops P_gc and GFR; efferent constriction raises P_gc but high resistance eventually lowers renal blood flow and GFR.', referenceIds: BOTH, visualization: { representation: 'schematic', spatialPrecision: 'none', note: 'Educational Starling forces filtration diagram.' }, learningObjectives: ['Calculate net ultrafiltration pressure from hydrostatic and oncotic Starling forces.', 'Predict how afferent vs efferent arteriolar constriction influences glomerular capillary pressure and GFR.'] }),
  n({ id: 'pcg:proximal_tubular_glucose_reabsorption', label: 'Tubular glucose reabsorption', scale: 'pathway', parentId: 'pcg:proximal_tubule_cell', definition: 'Coupled secondary active glucose transport driven by the basolateral Na+/K+-ATPase gradient, preventing glycosuria until transport maximum (TmG ~375 mg/min) is exceeded.', function: 'Conserves filtered metabolic fuel.', pathophysiology: 'SGLT2 inhibitors block proximal glucose reabsorption, inducing therapeutic glycosuria and lowering intraglomerular pressure.', referenceIds: GUYTON, visualization: { representation: 'schematic', spatialPrecision: 'none', note: 'Tubular transport schematic.' }, learningObjectives: ['Define the renal threshold and tubular transport maximum (TmG) for glucose.'] }),
  n({ id: 'pcg:gene_nphs1', label: 'NPHS1', scale: 'gene', parentId: 'pcg:podocyte', definition: 'Gene encoding nephrin; biallelic loss-of-function causes Congenital Nephrotic Syndrome of the Finnish type (NPHS1).', referenceIds: ['ref:hgnc-nphs1'], visualization: CONCEPTUAL }),
  n({ id: 'pcg:gene_slc5a2', label: 'SLC5A2', scale: 'gene', parentId: 'pcg:proximal_tubule_cell', definition: 'Gene encoding sodium/glucose cotransporter 2 (SGLT2); targeted by gliflozin-class medications.', referenceIds: ['ref:hgnc-slc5a2'], visualization: CONCEPTUAL }),
]

const e = (from: string, type: ConceptEdge['type'], to: string, referenceIds: readonly string[], grade: ConceptEdge['grade'] = 'established', note?: string): ConceptEdge => ({ from, type, to, grade, referenceIds, ...(note ? { note } : {}) })
const GUF = 'pcg:glomerular_ultrafiltration_pathway'
const TGR = 'pcg:proximal_tubular_glucose_reabsorption'

const EDGES: ConceptEdge[] = [
  e('pcg:kidney', 'composed_of_tissue', 'pcg:glomerular_filtration_barrier', OS),
  e('pcg:nephron', 'composed_of_tissue', 'pcg:glomerular_filtration_barrier', OS),
  e('pcg:glomerular_filtration_barrier', 'contains_cell_type', 'pcg:podocyte', OS),
  e('pcg:glomerular_filtration_barrier', 'contains_cell_type', 'pcg:proximal_tubule_cell', OS),
  e('pcg:podocyte', 'contains_organelle', 'pcg:slit_diaphragm', ['ref:kestila-1998']),
  e('pcg:proximal_tubule_cell', 'contains_organelle', 'pcg:brush_border_membrane', OS),
  e('pcg:nephrin_protein', 'participates_in', GUF, ['ref:kestila-1998']),
  e('pcg:nephrin_protein', 'encoded_by', 'pcg:gene_nphs1', ['ref:hgnc-nphs1']),
  e('pcg:sglt2_transporter', 'participates_in', TGR, GUYTON),
  e('pcg:sglt2_transporter', 'encoded_by', 'pcg:gene_slc5a2', ['ref:hgnc-slc5a2']),
  e('pcg:nephron', 'supplied_by', 'pcg:renal_glomerular_capillaries', GUYTON),
]

export const RENAL_NEPHRON_SPEC: ConceptGraphSpec = {
  schemaVersion: CONCEPT_GRAPH_SCHEMA_VERSION,
  datasetVersion: '2026.11.02-renal1',
  references: REFS,
  nodes: NODES,
  edges: EDGES,
}
