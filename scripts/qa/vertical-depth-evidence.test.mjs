import test from 'node:test'
import assert from 'node:assert/strict'
import { assessVerticalDepth } from '../../src/lib/biology/verticalDepthEvidence.ts'
import { cardiovascularVerticalGraph } from '../../src/lib/biology/cardiovascularVerticalLineage.ts'
import { createVerticalBiologicalGraph } from '../../src/lib/biology/verticalBiologyGraph.ts'

const cardio = assessVerticalDepth({ graph: cardiovascularVerticalGraph(), evidence: [] })

test('current cardiovascular vertical graph remains partial while explicit biological gaps exist', () => {
  assert.equal(cardio.state, 'partial')
  assert.equal(cardio.tenOfTenEligible, false)
  assert.ok(cardio.unresolvedGapCount >= 2)
  assert.ok(cardio.lineages.some((lineage) => lineage.unresolvedGapScales.includes('cell-state')))
  assert.ok(cardio.lineages.some((lineage) => lineage.unresolvedGapScales.includes('post-translational')))
})

test('repository graph depth cannot self-award 10/10 without the full evidence chain', () => {
  const evidence = [
    { kind: 'real-input', sourceId: 'fixture:input', level: 'repository' },
    { kind: 'integration', sourceId: 'fixture:integration', level: 'repository' },
  ]
  const result = assessVerticalDepth({ graph: cardiovascularVerticalGraph(), evidence })
  assert.equal(result.tenOfTenEligible, false)
  assert.ok(result.missingEvidenceKinds.includes('validation'))
  assert.ok(result.missingEvidenceKinds.includes('outcome-feedback'))
})

const evidence = [{ sourceId: 'fixture:evidence', role: 'mechanism' }]
const completeGraph = createVerticalBiologicalGraph({
  id: 'fixture.complete',
  rootNodeId: 'human',
  requiredScalePath: ['person', 'system', 'organ', 'tissue', 'cell'],
  nodes: [
    { id: 'human', label: 'Human', scale: 'person', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'system', label: 'System', scale: 'system', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'organ', label: 'Organ', scale: 'organ', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'tissue', label: 'Tissue', scale: 'tissue', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'cell', label: 'Cell', scale: 'cell', status: 'implemented', truthScope: 'reference', evidence },
  ],
  relations: [
    { from: 'human', to: 'system', kind: 'contains' },
    { from: 'system', to: 'organ', kind: 'contains' },
    { from: 'organ', to: 'tissue', kind: 'contains' },
    { from: 'tissue', to: 'cell', kind: 'contains' },
  ],
  lineages: [{
    id: 'fixture.lineage',
    label: 'Complete declared scope',
    steps: [
      { scale: 'person', nodeId: 'human', status: 'implemented' },
      { scale: 'system', nodeId: 'system', status: 'implemented' },
      { scale: 'organ', nodeId: 'organ', status: 'implemented' },
      { scale: 'tissue', nodeId: 'tissue', status: 'implemented' },
      { scale: 'cell', nodeId: 'cell', status: 'implemented' },
    ],
  }],
})

test('even a gap-free graph remains below 10/10 when validation is not external', () => {
  const result = assessVerticalDepth({
    graph: completeGraph,
    evidence: [
      { kind: 'real-input', sourceId: 'fixture:input', level: 'field' },
      { kind: 'integration', sourceId: 'fixture:integration', level: 'field' },
      { kind: 'validation', sourceId: 'fixture:validation', level: 'field' },
      { kind: 'projection', sourceId: 'fixture:projection', level: 'field' },
      { kind: 'outcome-feedback', sourceId: 'fixture:outcome', level: 'field' },
    ],
  })
  assert.equal(result.state, 'technically-coherent')
  assert.equal(result.tenOfTenEligible, false)
  assert.equal(result.externalValidationPresent, false)
})

test('10/10 eligibility requires gap-free declared scope plus external validation and outcome feedback', () => {
  const result = assessVerticalDepth({
    graph: completeGraph,
    evidence: [
      { kind: 'real-input', sourceId: 'external:input', level: 'external' },
      { kind: 'integration', sourceId: 'external:integration', level: 'external' },
      { kind: 'validation', sourceId: 'external:validation', level: 'external' },
      { kind: 'projection', sourceId: 'external:projection', level: 'external' },
      { kind: 'outcome-feedback', sourceId: 'external:outcome', level: 'external' },
    ],
  })
  assert.equal(result.state, 'externally-validated-for-declared-scope')
  assert.equal(result.minimumLineageCompleteness, 1)
  assert.equal(result.unresolvedGapCount, 0)
  assert.deepEqual(result.missingEvidenceKinds, [])
  assert.equal(result.tenOfTenEligible, true)
  assert.deepEqual(result.boundary, {
    clinicalCorrectnessProven: false,
    universalPopulationValidityProven: false,
    patientSpecificMolecularTruthInferred: false,
  })
})

test('invalid evidence source fails closed', () => {
  const result = assessVerticalDepth({
    graph: completeGraph,
    evidence: [{ kind: 'validation', sourceId: '   ', level: 'external' }],
  })
  assert.equal(result.state, 'invalid')
  assert.equal(result.tenOfTenEligible, false)
})
