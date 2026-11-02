// scripts/uji/renal-concept-graph.mts
// Multiscale Renal & Nephron Concept Graph & Starling Ultrafiltration Model Test
import assert from 'node:assert/strict'
import {
  RENAL_NEPHRON_SPEC,
  CARDIOVASCULAR_SPEC,
  NEUROMUSCULAR_SPEC,
  PULMONARY_SPEC,
  buildConceptGraph,
  mergeConceptSpecs,
  computeGlomerularFiltration,
} from '../../src/domains/biological-concept-graph/index.ts'

// 1. Build and verify Renal & Nephron vertical hierarchy
const built = buildConceptGraph(RENAL_NEPHRON_SPEC)
assert.equal(built.ok, true, `Renal spec failed to build: ${built.errors?.join(', ')}`)
const graph = built.graph!
assert.ok(graph, 'Graph must be present')

const nephrin = graph.nodes.get('pcg:nephrin_protein')
assert.ok(nephrin, 'Nephrin protein node must exist')
assert.equal(nephrin.scale, 'molecular_structure')

const nphs1 = graph.nodes.get('pcg:gene_nphs1')
assert.ok(nphs1, 'NPHS1 gene node must exist')
assert.equal(nphs1.scale, 'gene')

const podocyte = graph.nodes.get('pcg:podocyte')
assert.ok(podocyte, 'Podocyte node must exist')
assert.equal(podocyte.scale, 'cell')

const slitDiaphragm = graph.nodes.get('pcg:slit_diaphragm')
assert.ok(slitDiaphragm, 'Slit diaphragm node must exist')
assert.equal(slitDiaphragm.scale, 'organelle')

// 2. Functional relationships & gene encodings
const toPathway = graph.edgesTo.get('pcg:glomerular_ultrafiltration_pathway') ?? []
assert.ok(toPathway.length >= 1, 'Ultrafiltration pathway must have participants')

const nephrinOut = graph.edgesFrom.get('pcg:nephrin_protein') ?? []
const nephrinEncoded = nephrinOut.find((e) => e.type === 'encoded_by')
assert.ok(nephrinEncoded, 'Nephrin must have encoded_by edge')
assert.equal(nephrinEncoded.to, 'pcg:gene_nphs1')

const sglt2Out = graph.edgesFrom.get('pcg:sglt2_transporter') ?? []
const sglt2Encoded = sglt2Out.find((e) => e.type === 'encoded_by')
assert.ok(sglt2Encoded, 'SGLT2 must have encoded_by edge')
assert.equal(sglt2Encoded.to, 'pcg:gene_slc5a2')

// 3. 4-System Unification (Cardiovascular, Neuromuscular, Pulmonary, Renal)
const merged = mergeConceptSpecs([CARDIOVASCULAR_SPEC, NEUROMUSCULAR_SPEC, PULMONARY_SPEC, RENAL_NEPHRON_SPEC])
assert.equal(merged.ok, true, `4-system merger failed: ${merged.errors?.join(', ')}`)
assert.ok(merged.spec, 'Merged spec must be returned')

const unified = buildConceptGraph(merged.spec!)
assert.equal(unified.ok, true, `Unified graph build failed: ${unified.errors?.join(', ')}`)
const uGraph = unified.graph!

const roots = Array.from(uGraph.nodes.values()).filter((n) => n.parentId === null)
assert.equal(roots.length, 1, 'Whole body must be the single root across all merged systems')
assert.equal(roots[0].id, 'pcg:human_body')

const organSystems = Array.from(uGraph.nodes.values()).filter((n) => n.scale === 'organ_system')
const systemIds = new Set(organSystems.map((s) => s.id))
assert.ok(systemIds.has('pcg:cardiovascular_system'), 'CV system present')
assert.ok(systemIds.has('pcg:nervous_system'), 'Nervous/neuromuscular system present')
assert.ok(systemIds.has('pcg:respiratory_system'), 'Respiratory system present')
assert.ok(systemIds.has('pcg:urinary_system'), 'Urinary system present')

// 4. Glomerular Starling Filtration calculation
const normal = computeGlomerularFiltration({
  P_gc_mmHg: 60,
  P_bs_mmHg: 18,
  pi_gc_mmHg: 32,
  pi_bs_mmHg: 0,
  Kf_mL_min_mmHg: 12.5,
})
assert.equal(normal.netUltrafiltrationPressure_mmHg, 10.0)
assert.equal(normal.gfr_mL_per_min, 125.0)
assert.equal(normal.dailyFilteredVolume_L_day, 180.0)
assert.equal(normal.barrierIntact, true)

// 5. Afferent constriction & barrier breakdown
const shock = computeGlomerularFiltration({
  P_gc_mmHg: 45,
  P_bs_mmHg: 18,
  pi_gc_mmHg: 30,
  pi_bs_mmHg: 0,
  Kf_mL_min_mmHg: 12.5,
})
assert.equal(shock.netUltrafiltrationPressure_mmHg, -3)
assert.equal(shock.gfr_mL_per_min, 0)
assert.equal(shock.dailyFilteredVolume_L_day, 0)

const nephrotic = computeGlomerularFiltration({
  P_gc_mmHg: 55,
  P_bs_mmHg: 18,
  pi_gc_mmHg: 22,
  pi_bs_mmHg: 5,
  Kf_mL_min_mmHg: 10.0,
})
assert.equal(nephrotic.barrierIntact, false)

// 6. Validation bounds
assert.throws(() => computeGlomerularFiltration({
  P_gc_mmHg: 160,
  P_bs_mmHg: 18,
  pi_gc_mmHg: 32,
  pi_bs_mmHg: 0,
  Kf_mL_min_mmHg: 12.5,
}), /must be in range/)

console.log('Renal & Nephron multiscale concept graph and Starling filtration model verified.')
