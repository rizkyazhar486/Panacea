// scripts/qa/subcellular-mitochondrial-dynamics.test.mjs
// Deterministic unit tests for Subcellular Mitochondrial Dynamics, Mitchell PMF, and Autophagic Flux

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  computeMitchellProtonMotiveForce,
  evaluateSubcellularMitochondrialDynamics,
} from '../../src/domains/quantum-biology/engine/subcellularMitochondrialDynamicsEngine.ts'
import {
  SUBCELLULAR_ENERGETICS_AUTOPHAGY_SPEC,
} from '../../src/domains/biological-concept-graph/data/subcellularEnergeticsAutophagySpec.ts'
import {
  buildConceptGraph,
} from '../../src/domains/biological-concept-graph/engine/conceptGraph.ts'
import {
  mergeConceptSpecs,
} from '../../src/domains/biological-concept-graph/engine/specMerger.ts'
import {
  CARDIOVASCULAR_SPEC,
} from '../../src/domains/biological-concept-graph/data/cardiovascularSpec.ts'
import {
  RENAL_NEPHRON_SPEC,
} from '../../src/domains/biological-concept-graph/data/renalSpec.ts'

test('Mitchell Proton Motive Force calculation is mathematically rigorous', () => {
  // Delta-p = Delta-Psi - 61.54 * Delta-pH
  // Resting: Delta-Psi = -160 mV, matrix pH = 7.8, IMS pH = 7.0 -> Delta-pH = 0.8
  // Expected Delta-p = -160 - (61.54 * 0.8) = -160 - 49.232 = -209.23 mV
  const pmf = computeMitchellProtonMotiveForce(-160, 7.8, 7.0)
  assert.equal(pmf.deltaPh, 0.8)
  assert.equal(pmf.pmfMv, -209.23)

  // Sepsis / depolarized: Delta-Psi = -80 mV, Delta-pH = 0.4
  const sepsisPmf = computeMitchellProtonMotiveForce(-80, 7.4, 7.0)
  assert.equal(sepsisPmf.deltaPh, 0.4)
  assert.equal(sepsisPmf.pmfMv, -104.62)
})

test('Subcellular dynamics: resting homeostasis exhibits high ATP synthesis, low ROS, and coupled respiration', () => {
  const result = evaluateSubcellularMitochondrialDynamics({
    membranePotentialDeltaPsiMv: -160,
    nadhToNadRatio: 0.15,
    succinateConcentrationMm: 0.5,
    uncouplingProteinActivityFraction: 0.05,
    atpConcentrationMm: 4.8,
    adpConcentrationMm: 1.0,
    ampConcentrationMm: 0.08,
    aminoAcidAvailabilityScore: 0.75,
    lysosomalAcidityPh: 4.8,
    hypoxiaFractionFiO2: 0.21,
    evaluationIsoTimestamp: '2026-11-03T12:00:00.000Z',
  })

  assert.equal(result.viabilityStatus, 'HEALTHY_COUPLED_HOMEOSTASIS')
  assert.ok(result.bioenergetics.atpSynthesisFlux_nmol_mg_min > 80, 'Resting ATP flux must be robust')
  assert.ok(result.rosDynamics.superoxideGenerationRate_pmol_min < 30, 'ROS emission in coupled state is restrained')
  assert.equal(result.rosDynamics.oxidativeStressWarning, false)
  assert.equal(result.autophagicFlux.lysosomalFusionStatus, 'PERFECT_ACIDIC_DEGRADATION')
  assert.ok(result.cryptographicSha256Digest.length === 64, 'SHA-256 digest must be genuine 64 hex characters')
})

test('Subcellular dynamics: intermittent fasting triggers AMPK Thr172 and robust autophagic clearance', () => {
  const fastingResult = evaluateSubcellularMitochondrialDynamics({
    membranePotentialDeltaPsiMv: -155,
    nadhToNadRatio: 0.12,
    succinateConcentrationMm: 0.4,
    uncouplingProteinActivityFraction: 0.08,
    atpConcentrationMm: 3.2,
    adpConcentrationMm: 1.6,
    ampConcentrationMm: 0.35, // High AMP -> high AMP/ATP
    aminoAcidAvailabilityScore: 0.25, // Low amino acids
    lysosomalAcidityPh: 4.7,
    hypoxiaFractionFiO2: 0.21,
    evaluationIsoTimestamp: '2026-11-03T12:00:00.000Z',
  })

  assert.equal(fastingResult.viabilityStatus, 'FASTING_AUTOPHAGIC_PROTECTION')
  assert.equal(fastingResult.metabolicRheostat.metabolicOrientation, 'CATABOLIC_AUTOPHAGIC_REPAIR')
  assert.ok(fastingResult.metabolicRheostat.ampkAlphaThr172Phosphorylation > 0.55, 'AMPK must be strongly phosphorylated')
  assert.ok(fastingResult.autophagicFlux.autophagosomeClearanceRate_pct_hr > 50, 'Autophagic clearance rate is elevated during fasting')
  assert.ok(fastingResult.autophagicFlux.lc3IILipidationRatio > 0.5, 'LC3-II lipidation is high')
})

test('Subcellular dynamics: sepsis cytopathic hypoxia causes depolarization, ROS storm, and arrested lysosomal degradation', () => {
  const sepsisResult = evaluateSubcellularMitochondrialDynamics({
    membranePotentialDeltaPsiMv: -75, // Severe depolarization
    nadhToNadRatio: 0.85, // Substrate stall
    succinateConcentrationMm: 0.2,
    uncouplingProteinActivityFraction: 0.02,
    atpConcentrationMm: 1.2,
    adpConcentrationMm: 2.2,
    ampConcentrationMm: 0.70,
    aminoAcidAvailabilityScore: 0.30,
    lysosomalAcidityPh: 6.2, // Impaired lysosomal acidification
    hypoxiaFractionFiO2: 0.07, // Severe tissue hypoxia
    evaluationIsoTimestamp: '2026-11-03T12:00:00.000Z',
  })

  assert.ok(
    sepsisResult.viabilityStatus === 'CYTOPATHIC_SEPSIS_FAILURE' || sepsisResult.viabilityStatus === 'CYTOTOXIC_AUTOPHAGIC_ARREST',
    'Must classify severe sepsis metabolic failure'
  )
  assert.equal(sepsisResult.autophagicFlux.lysosomalFusionStatus, 'ARRESTED_ALKALINIZATION')
  assert.ok(sepsisResult.rosDynamics.oxidativeStressWarning, 'Must flag severe oxidative stress warning')
  assert.ok(sepsisResult.autophagicFlux.mitophagyCommitmentIndex > 0.5, 'PINK1-Parkin mitophagy recruitment triggered')
})

test('Biological Concept Graph: subcellular energetics spec builds cleanly and merges with whole-body atlas', () => {
  const buildRes = buildConceptGraph(SUBCELLULAR_ENERGETICS_AUTOPHAGY_SPEC)
  assert.equal(buildRes.ok, true, `Build issues: ${JSON.stringify(buildRes.issues)}`)
  assert.ok(buildRes.graph, 'Graph should be generated')

  // Verify key nodes exist
  const mitoNode = buildRes.graph.nodes.get('pcg:myocyte_mitochondrion')
  assert.ok(mitoNode, 'Myocyte mitochondrion node must exist')
  assert.equal(mitoNode.scale, 'organelle')
  assert.equal(mitoNode.ontologyId, 'GO:0005739')

  const ampkNode = buildRes.graph.nodes.get('pcg:ampk_catalytic_complex')
  assert.ok(ampkNode, 'AMPK node must exist')
  assert.equal(ampkNode.scale, 'molecular_structure')

  // Multi-system merge test: merge Cardiovascular, Renal, and Subcellular specs
  const mergeRes = mergeConceptSpecs([CARDIOVASCULAR_SPEC, RENAL_NEPHRON_SPEC, SUBCELLULAR_ENERGETICS_AUTOPHAGY_SPEC])
  assert.equal(mergeRes.ok, true, `Merge errors: ${JSON.stringify(mergeRes.errors)}`)
  assert.ok(mergeRes.spec, 'Merged spec must be produced')

  // Build the combined multi-scale graph
  const mergedBuild = buildConceptGraph(mergeRes.spec)
  assert.equal(mergedBuild.ok, true, `Merged graph build issues: ${JSON.stringify(mergedBuild.issues)}`)
  assert.ok(mergedBuild.graph.nodes.has('pcg:kidney'), 'Merged graph contains renal nodes')
  assert.ok(mergedBuild.graph.nodes.has('pcg:heart'), 'Merged graph contains cardiovascular nodes')
  assert.ok(mergedBuild.graph.nodes.has('pcg:myocyte_mitochondrion'), 'Merged graph contains myocyte mitochondrion nodes')
})

test('Input boundary validation fail-closed behavior', () => {
  assert.throws(
    () => computeMitchellProtonMotiveForce(50), // Positive membrane potential invalid
    /Invalid subcellular input/
  )

  assert.throws(
    () =>
      evaluateSubcellularMitochondrialDynamics({
        membranePotentialDeltaPsiMv: -160,
        nadhToNadRatio: 0.15,
        evaluationIsoTimestamp: 'not-a-timestamp',
      }),
    /Invalid evaluation ISO timestamp/
  )
})
