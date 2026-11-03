// Test suite: Multiscale biological concept graph expansion, spec merger, and Teachable Causal Figures engine.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CARDIOVASCULAR_SPEC,
  HEMODYNAMIC_CAUSAL_NETWORK,
  NEUROMUSCULAR_SPEC,
  PULMONARY_SPEC,
  SAMPLE_TEACHABLE_INQUIRIES,
  buildConceptGraph,
  commonAncestor,
  descendants,
  drillDownOptions,
  evaluateLearnerPrediction,
  mergeConceptSpecs,
  pathFromRoot,
  simulateCausalNetwork,
} from '../../src/domains/biological-concept-graph/index.ts'

test('TF-1. Neuromuscular Concept Graph: builds cleanly, respects scale order, and links to NMJ pathway', () => {
  const res = buildConceptGraph(NEUROMUSCULAR_SPEC)
  assert.equal(res.ok, true, `Build failed with issues: ${JSON.stringify(res.issues)}`)
  const g = res.graph

  assert.equal(g.rootId, 'pcg:human_body')
  assert.equal(g.nodes.has('pcg:nervous_system'), true)
  assert.equal(g.nodes.has('pcg:alpha_motor_neuron'), true)
  assert.equal(g.nodes.has('pcg:nicotinic_ach_receptor'), true)
  assert.equal(g.nodes.has('pcg:neuromuscular_transmission'), true)

  // Verify breadcrumb path from root to postjunctional receptor
  const pathRes = pathFromRoot(g, 'pcg:nicotinic_ach_receptor')
  assert.equal(pathRes.ok, true)
  const scales = pathRes.value.map((n) => n.scale)
  assert.deepEqual(scales, [
    'whole_body',
    'organ_system',
    'organ',
    'substructure',
    'tissue',
    'cell',
    'organelle',
    'molecular_structure',
  ])
})

test('TF-2. Pulmonary Concept Graph: builds cleanly and models alveolar type II pneumocyte and surfactant', () => {
  const res = buildConceptGraph(PULMONARY_SPEC)
  assert.equal(res.ok, true, `Build failed with issues: ${JSON.stringify(res.issues)}`)
  const g = res.graph

  assert.equal(g.nodes.has('pcg:respiratory_system'), true)
  assert.equal(g.nodes.has('pcg:lung'), true)
  assert.equal(g.nodes.has('pcg:type_2_pneumocyte'), true)
  assert.equal(g.nodes.has('pcg:alveolar_gas_exchange'), true)

  const pneumocyte = g.nodes.get('pcg:type_2_pneumocyte')
  assert.equal(pneumocyte?.ontologyId, 'CL:0002063')

  // Drilldown from lung finds pulmonary alveolus and capillary bed
  const dd = drillDownOptions(g, 'pcg:lung')
  assert.equal(dd.ok, true)
  const childIds = dd.value.map((n) => n.id)
  assert.ok(childIds.includes('pcg:pulmonary_alveolus'))
  assert.ok(childIds.includes('pcg:pulmonary_capillary'))
})

test('TF-3. Spec Merger: unifies Cardiovascular, Neuromuscular, and Pulmonary specs under single root', () => {
  const mergeRes = mergeConceptSpecs([CARDIOVASCULAR_SPEC, NEUROMUSCULAR_SPEC, PULMONARY_SPEC])
  assert.equal(mergeRes.ok, true, `Merge failed with errors: ${mergeRes.errors?.join(', ')}`)
  assert.ok(mergeRes.spec)

  const buildRes = buildConceptGraph(mergeRes.spec)
  assert.equal(buildRes.ok, true, `Merged graph build failed: ${JSON.stringify(buildRes.issues)}`)
  const g = buildRes.graph

  // Single canonical root
  assert.equal(g.rootId, 'pcg:human_body')

  // 3 distinct organ systems reachable from root
  const rootChildren = g.children.get('pcg:human_body') ?? []
  assert.ok(rootChildren.includes('pcg:cardiovascular_system'))
  assert.ok(rootChildren.includes('pcg:nervous_system'))
  assert.ok(rootChildren.includes('pcg:respiratory_system'))

  // Cross-system common ancestor queries
  const lcaCardioNeuro = commonAncestor(g, 'pcg:cardiomyocyte', 'pcg:alpha_motor_neuron')
  assert.equal(lcaCardioNeuro.ok, true)
  assert.equal(lcaCardioNeuro.value.id, 'pcg:human_body')

  const lcaCardioSarcomere = commonAncestor(g, 'pcg:left_ventricle', 'pcg:sarcomere')
  assert.equal(lcaCardioSarcomere.ok, true)
  assert.equal(lcaCardioSarcomere.value.id, 'pcg:heart')
})

test('TF-4. Teachable Causal Simulation: baseline produces zero drift, preload elevation increases SV', () => {
  const net = HEMODYNAMIC_CAUSAL_NETWORK

  // 1. Zero perturbation test
  const baseSim = simulateCausalNetwork(net, [])
  assert.equal(baseSim.converged, true)
  assert.equal(baseSim.finalState.values.stroke_volume, 70)
  assert.equal(baseSim.finalState.values.cardiac_output, 5.0)

  // 2. Preload (+25% EDV) perturbation
  const preloadSim = simulateCausalNetwork(net, [
    { variableId: 'preload_edv', type: 'relative_delta', value: 0.25 },
  ])
  assert.equal(preloadSim.converged, true)
  // Frank-Starling mechanism: increased preload increases SV and CO
  assert.ok(
    preloadSim.finalState.values.stroke_volume > 70,
    `Expected SV > 70, got ${preloadSim.finalState.values.stroke_volume}`
  )
  assert.ok(
    preloadSim.finalState.values.cardiac_output > 5.0,
    `Expected CO > 5.0, got ${preloadSim.finalState.values.cardiac_output}`
  )
  assert.ok(preloadSim.explanations.length > 0)
  assert.ok(preloadSim.explanations[0].includes('Frank-Starling law'))
})

test('TF-5. Teachable Causal Simulation: acute afterload elevation reduces stroke volume and elevates MAP', () => {
  const net = HEMODYNAMIC_CAUSAL_NETWORK

  const afterloadSim = simulateCausalNetwork(net, [
    { variableId: 'afterload_svr', type: 'relative_delta', value: 0.4 },
  ])
  assert.equal(afterloadSim.converged, true)

  // SVR increase decreases SV while elevating arterial perfusion pressure
  assert.ok(
    afterloadSim.finalState.values.stroke_volume < 70,
    `Expected SV < 70, got ${afterloadSim.finalState.values.stroke_volume}`
  )
  assert.ok(
    afterloadSim.finalState.values.mean_arterial_pressure > 93.3,
    `Expected MAP > 93.3, got ${afterloadSim.finalState.values.mean_arterial_pressure}`
  )
})

test('TF-6. Teachable Inquiry Evaluation: correct prediction yields positive feedback, incorrect yields explanation', () => {
  const inquiry = SAMPLE_TEACHABLE_INQUIRIES[0]
  assert.ok(inquiry)

  // Test correct option (opt_1: decrease)
  const correctEval = evaluateLearnerPrediction(inquiry, 'opt_1')
  assert.equal(correctEval.isCorrect, true)
  assert.ok(correctEval.feedback.startsWith('Correct!'))
  assert.ok(correctEval.scientificExplanation.includes('Laplace’s law'))

  // Test incorrect option (opt_2: increase)
  const incorrectEval = evaluateLearnerPrediction(inquiry, 'opt_2')
  assert.equal(incorrectEval.isCorrect, false)
  assert.ok(incorrectEval.feedback.startsWith('Incorrect:'))

  // Test invalid option ID
  const invalidEval = evaluateLearnerPrediction(inquiry, 'opt_nonexistent')
  assert.equal(invalidEval.isCorrect, false)
  assert.ok(invalidEval.feedback.includes('Invalid option'))
})
