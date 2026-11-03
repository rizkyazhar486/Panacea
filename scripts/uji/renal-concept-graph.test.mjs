import assert from 'node:assert/strict'
import test from 'node:test'
import {
  RENAL_NEPHRON_SPEC,
  CARDIOVASCULAR_SPEC,
  NEUROMUSCULAR_SPEC,
  PULMONARY_SPEC,
  buildConceptGraph,
  mergeConceptSpecs,
  computeGlomerularFiltration,
} from '../../src/domains/biological-concept-graph/index.ts'

test('RG-1. Renal Nephron Concept Graph builds cleanly and respects strict scale ordering', () => {
  const built = buildConceptGraph(RENAL_NEPHRON_SPEC)
  assert.equal(built.ok, true, `Renal spec failed to build: ${built.errors?.join(', ')}`)
  const graph = built.graph
  assert.ok(graph, 'Graph must be present')

  // Verify scale traversal path from body down to gene
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
})

test('RG-2. Renal Nephron specifies verified biological relationships and gene encoding', () => {
  const { graph } = buildConceptGraph(RENAL_NEPHRON_SPEC)

  // Slit diaphragm participates in glomerular ultrafiltration
  const toPathway = graph.edgesTo.get('pcg:glomerular_ultrafiltration_pathway') ?? []
  assert.ok(toPathway.length >= 1, 'Ultrafiltration pathway must have participants')

  // Nephrin is encoded by NPHS1
  const nephrinOut = graph.edgesFrom.get('pcg:nephrin_protein') ?? []
  const nephrinEncoded = nephrinOut.find((e) => e.type === 'encoded_by')
  assert.ok(nephrinEncoded, 'Nephrin must have encoded_by edge')
  assert.equal(nephrinEncoded.to, 'pcg:gene_nphs1')

  // SGLT2 is encoded by SLC5A2
  const sglt2Out = graph.edgesFrom.get('pcg:sglt2_transporter') ?? []
  const sglt2Encoded = sglt2Out.find((e) => e.type === 'encoded_by')
  assert.ok(sglt2Encoded, 'SGLT2 must have encoded_by edge')
  assert.equal(sglt2Encoded.to, 'pcg:gene_slc5a2')
})

test('RG-3. Spec Merger unifies Cardiovascular, Neuromuscular, Pulmonary, and Renal specs', () => {
  const merged = mergeConceptSpecs([CARDIOVASCULAR_SPEC, NEUROMUSCULAR_SPEC, PULMONARY_SPEC, RENAL_NEPHRON_SPEC])
  assert.equal(merged.ok, true, `4-system merger failed: ${merged.errors?.join(', ')}`)
  assert.ok(merged.spec, 'Merged spec must be returned')

  const unified = buildConceptGraph(merged.spec)
  assert.equal(unified.ok, true, `Unified graph build failed: ${unified.errors?.join(', ')}`)
  const graph = unified.graph

  // Single shared root
  const roots = Array.from(graph.nodes.values()).filter((n) => n.parentId === null)
  assert.equal(roots.length, 1, 'Whole body must be the single root across all merged systems')
  assert.equal(roots[0].id, 'pcg:human_body')

  // Four organ systems present under root
  const organSystems = Array.from(graph.nodes.values()).filter((n) => n.scale === 'organ_system')
  const systemIds = new Set(organSystems.map((s) => s.id))
  assert.ok(systemIds.has('pcg:cardiovascular_system'), 'CV system present')
  assert.ok(systemIds.has('pcg:nervous_system'), 'Nervous/neuromuscular system present')
  assert.ok(systemIds.has('pcg:respiratory_system'), 'Respiratory system present')
  assert.ok(systemIds.has('pcg:urinary_system'), 'Urinary system present')
})

test('RG-4. Glomerular Starling Filtration calculation accurately evaluates normal adult physiology', () => {
  // Classic Guyton normal resting adult:
  // P_gc = 60, P_bs = 18, pi_gc = 32, pi_bs = 0, Kf = 12.5
  // Net Ultrafiltration Pressure = (60 - 18) - (32 - 0) = 42 - 32 = 10 mmHg
  // GFR = 12.5 * 10 = 125.0 mL/min
  // Daily Volume = 125 * 1440 / 1000 = 180.0 L/day
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
})

test('RG-5. Glomerular Starling Filtration models afferent constriction and barrier breakdown', () => {
  // Afferent arteriolar constriction: P_gc drops to 52 mmHg
  // NUP = (52 - 18) - 32 = 34 - 32 = 2 mmHg
  // GFR = 12.5 * 2 = 25.0 mL/min
  const afferentConstriction = computeGlomerularFiltration({
    P_gc_mmHg: 52,
    P_bs_mmHg: 18,
    pi_gc_mmHg: 32,
    pi_bs_mmHg: 0,
    Kf_mL_min_mmHg: 12.5,
  })
  assert.equal(afferentConstriction.netUltrafiltrationPressure_mmHg, 2.0)
  assert.equal(afferentConstriction.gfr_mL_per_min, 25.0)

  // Barrier breakdown (proteinuria / nephrotic state): pi_bs = 5 mmHg
  const barrierBreak = computeGlomerularFiltration({
    P_gc_mmHg: 60,
    P_bs_mmHg: 18,
    pi_gc_mmHg: 32,
    pi_bs_mmHg: 5,
    Kf_mL_min_mmHg: 12.5,
  })
  assert.equal(barrierBreak.barrierIntact, false)
  // NUP = (60 - 18) - (32 - 5) = 42 - 27 = 15 mmHg
  assert.equal(barrierBreak.netUltrafiltrationPressure_mmHg, 15.0)
  assert.equal(barrierBreak.gfr_mL_per_min, 187.5)
})

test('RG-6. Glomerular Starling Filtration rejects unphysiological or invalid parameters', () => {
  assert.throws(
    () =>
      computeGlomerularFiltration({
        P_gc_mmHg: NaN,
        P_bs_mmHg: 18,
        pi_gc_mmHg: 32,
        pi_bs_mmHg: 0,
        Kf_mL_min_mmHg: 12.5,
      }),
    TypeError
  )

  // Out of range pressure (< 10 mmHg)
  assert.throws(
    () =>
      computeGlomerularFiltration({
        P_gc_mmHg: 5,
        P_bs_mmHg: 18,
        pi_gc_mmHg: 32,
        pi_bs_mmHg: 0,
        Kf_mL_min_mmHg: 12.5,
      }),
    RangeError
  )

  // Negative Kf
  assert.throws(
    () =>
      computeGlomerularFiltration({
        P_gc_mmHg: 60,
        P_bs_mmHg: 18,
        pi_gc_mmHg: 32,
        pi_bs_mmHg: 0,
        Kf_mL_min_mmHg: -1,
      }),
    RangeError
  )
})
