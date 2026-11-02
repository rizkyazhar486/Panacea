// Uji integrasi Teachable Figures & Multiscale Concept Graph
import assert from 'node:assert/strict'
import {
  CARDIOVASCULAR_SPEC,
  HEMODYNAMIC_CAUSAL_NETWORK,
  NEUROMUSCULAR_SPEC,
  PULMONARY_SPEC,
  SAMPLE_TEACHABLE_INQUIRIES,
  buildConceptGraph,
  commonAncestor,
  drillDownOptions,
  evaluateLearnerPrediction,
  mergeConceptSpecs,
  pathFromRoot,
  simulateCausalNetwork,
} from '../../src/domains/biological-concept-graph/index.ts'

// 1. Neuromuscular Concept Graph
const resNeuro = buildConceptGraph(NEUROMUSCULAR_SPEC)
assert.equal(resNeuro.ok, true, 'Neuromuscular graph build must succeed')
const gNeuro = resNeuro.graph!
assert.equal(gNeuro.rootId, 'pcg:human_body')
assert.equal(gNeuro.nodes.has('pcg:alpha_motor_neuron'), true)
assert.equal(gNeuro.nodes.has('pcg:nicotinic_ach_receptor'), true)

const pathNeuro = pathFromRoot(gNeuro, 'pcg:nicotinic_ach_receptor')
assert.equal(pathNeuro.ok, true)
assert.equal(pathNeuro.value.length, 8)

// 2. Pulmonary Concept Graph
const resPulm = buildConceptGraph(PULMONARY_SPEC)
assert.equal(resPulm.ok, true, 'Pulmonary graph build must succeed')
const gPulm = resPulm.graph!
assert.equal(gPulm.nodes.has('pcg:type_2_pneumocyte'), true)
assert.equal(gPulm.nodes.has('pcg:alveolar_gas_exchange'), true)

// 3. Spec Merger across systems
const mergeRes = mergeConceptSpecs([CARDIOVASCULAR_SPEC, NEUROMUSCULAR_SPEC, PULMONARY_SPEC])
assert.equal(mergeRes.ok, true, 'Spec merger must succeed')
const buildMerged = buildConceptGraph(mergeRes.spec!)
assert.equal(buildMerged.ok, true, 'Merged whole-body atlas build must succeed')
const gMerged = buildMerged.graph!

assert.equal(gMerged.rootId, 'pcg:human_body')
const lca = commonAncestor(gMerged, 'pcg:cardiomyocyte', 'pcg:alpha_motor_neuron')
assert.equal(lca.ok, true)
assert.equal(lca.value.id, 'pcg:human_body')

// 4. Teachable Causal Simulation
const net = HEMODYNAMIC_CAUSAL_NETWORK
const baseSim = simulateCausalNetwork(net, [])
assert.equal(baseSim.converged, true)
assert.equal(baseSim.finalState.values.stroke_volume, 70)

// Preload test
const preloadSim = simulateCausalNetwork(net, [
  { variableId: 'preload_edv', type: 'relative_delta', value: 0.25 },
])
assert.equal(preloadSim.converged, true)
assert.ok(preloadSim.finalState.values.stroke_volume > 70)
assert.ok(preloadSim.finalState.values.cardiac_output > 5.0)

// Afterload test
const afterloadSim = simulateCausalNetwork(net, [
  { variableId: 'afterload_svr', type: 'relative_delta', value: 0.4 },
])
assert.equal(afterloadSim.converged, true)
assert.ok(afterloadSim.finalState.values.stroke_volume < 70)
assert.ok(afterloadSim.finalState.values.mean_arterial_pressure > 93.3)

// 5. Learner Inquiry Evaluation
const inquiry = SAMPLE_TEACHABLE_INQUIRIES[0]
assert.ok(inquiry)
const evalCorrect = evaluateLearnerPrediction(inquiry, 'opt_1')
assert.equal(evalCorrect.isCorrect, true)
const evalIncorrect = evaluateLearnerPrediction(inquiry, 'opt_2')
assert.equal(evalIncorrect.isCorrect, false)

console.log('teachable-figures-and-multisystem: neuromuscular, pulmonary, and whole-body causal simulation verified')
