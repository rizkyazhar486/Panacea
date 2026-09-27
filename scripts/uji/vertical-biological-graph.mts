import assert from 'node:assert/strict'
import {
  BIOLOGICAL_SCALE_ORDER,
  assessVerticalLineage,
  createVerticalBiologicalGraph,
  validateVerticalBiologicalGraph,
  type VerticalBiologicalGraph,
} from '../../src/lib/biology/verticalBiologyGraph.ts'

const evidence = [{ sourceId: 'PMID:28956314', role: 'mechanism' as const }]

const valid: VerticalBiologicalGraph = {
  id: 'fixture.valid',
  rootNodeId: 'human',
  requiredScalePath: ['person', 'system', 'organ', 'tissue', 'cell', 'protein', 'rna', 'gene-regulatory', 'dna'],
  nodes: [
    { id: 'human', label: 'Human', scale: 'person', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'system', label: 'System', scale: 'system', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'organ', label: 'Organ', scale: 'organ', status: 'implemented', truthScope: 'reference', evidence, representation: { kind: '3d-reference', sourceId: 'atlas:fixture' } },
    { id: 'tissue', label: 'Tissue', scale: 'tissue', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'cell', label: 'Cell', scale: 'cell', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'protein', label: 'Protein', scale: 'protein', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'rna', label: 'RNA', scale: 'rna', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'gene', label: 'Gene', scale: 'gene-regulatory', status: 'implemented', truthScope: 'reference', evidence },
    { id: 'dna', label: 'DNA', scale: 'dna', status: 'implemented', truthScope: 'reference', evidence },
  ],
  relations: [
    { from: 'human', to: 'system', kind: 'contains' },
    { from: 'system', to: 'organ', kind: 'contains' },
    { from: 'organ', to: 'tissue', kind: 'contains' },
    { from: 'tissue', to: 'cell', kind: 'contains' },
    { from: 'cell', to: 'protein', kind: 'mechanistic' },
    { from: 'protein', to: 'rna', kind: 'encoded-by' },
    { from: 'rna', to: 'gene', kind: 'transcribed-from' },
    { from: 'gene', to: 'dna', kind: 'located-in' },
  ],
  lineages: [{
    id: 'fixture-lineage',
    label: 'Fixture lineage',
    steps: [
      { scale: 'person', nodeId: 'human', status: 'implemented' },
      { scale: 'system', nodeId: 'system', status: 'implemented' },
      { scale: 'organ', nodeId: 'organ', status: 'implemented' },
      { scale: 'tissue', nodeId: 'tissue', status: 'implemented' },
      { scale: 'cell', nodeId: 'cell', status: 'implemented' },
      { scale: 'protein', nodeId: 'protein', status: 'implemented' },
      { scale: 'rna', nodeId: 'rna', status: 'implemented' },
      { scale: 'gene-regulatory', nodeId: 'gene', status: 'implemented' },
      { scale: 'dna', nodeId: 'dna', status: 'implemented' },
    ],
  }],
}

assert.deepEqual(validateVerticalBiologicalGraph(valid), [])
const built = createVerticalBiologicalGraph(valid)
assert.equal(built.id, 'fixture.valid')
assert.ok(BIOLOGICAL_SCALE_ORDER.indexOf('cell') > BIOLOGICAL_SCALE_ORDER.indexOf('tissue'))

const coverage = assessVerticalLineage(valid.lineages[0])
assert.deepEqual(coverage, { implemented: 9, gaps: 0, notApplicable: 0, total: 9, completeness: 1 })

const duplicate = { ...valid, nodes: [...valid.nodes, valid.nodes[0]] }
assert.ok(validateVerticalBiologicalGraph(duplicate).some((error) => /duplicate node id human/.test(error)))

const dangling = { ...valid, relations: [...valid.relations, { from: 'missing', to: 'dna', kind: 'contains' as const }] }
assert.ok(validateVerticalBiologicalGraph(dangling).some((error) => /relation references missing node/.test(error)))

const noEvidence = {
  ...valid,
  nodes: valid.nodes.map((node) => node.id === 'organ'
    ? { ...node, evidence: [], representation: { kind: '3d-reference' as const, sourceId: '' } }
    : node),
}
assert.ok(validateVerticalBiologicalGraph(noEvidence).some((error) => /implemented node organ requires evidence/.test(error)))
assert.ok(validateVerticalBiologicalGraph(noEvidence).some((error) => /representation sourceId/.test(error)))

const fakePatientGenome = {
  ...valid,
  nodes: valid.nodes.map((node) => node.id === 'dna' ? { ...node, truthScope: 'patient-specific' as const } : node),
}
assert.ok(validateVerticalBiologicalGraph(fakePatientGenome).some((error) => /reference-only molecular/genomic node dna cannot be patient-specific/.test(error)))

const skipped: VerticalBiologicalGraph = {
  ...valid,
  requiredScalePath: ['person', 'system', 'organ', 'tissue', 'cell'],
  lineages: [{
    id: 'skipped',
    label: 'Skipped tissue',
    steps: [
      { scale: 'person', nodeId: 'human', status: 'implemented' },
      { scale: 'system', nodeId: 'system', status: 'implemented' },
      { scale: 'organ', nodeId: 'organ', status: 'implemented' },
      { scale: 'cell', nodeId: 'cell', status: 'implemented' },
    ],
  }],
}
assert.ok(validateVerticalBiologicalGraph(skipped).some((error) => /lineage skipped missing required scale tissue/.test(error)))

const explicitGap: VerticalBiologicalGraph = {
  ...skipped,
  lineages: [{
    id: 'gap',
    label: 'Explicit gap',
    steps: [
      { scale: 'person', nodeId: 'human', status: 'implemented' },
      { scale: 'system', nodeId: 'system', status: 'implemented' },
      { scale: 'organ', nodeId: 'organ', status: 'implemented' },
      { scale: 'tissue', status: 'gap', reason: 'VERTICAL GAP — NOT YET MODELED' },
      { scale: 'cell', nodeId: 'cell', status: 'implemented' },
    ],
  }],
}
assert.deepEqual(validateVerticalBiologicalGraph(explicitGap), [])
assert.deepEqual(assessVerticalLineage(explicitGap.lineages[0]), { implemented: 4, gaps: 1, notApplicable: 0, total: 5, completeness: 0.8 })

console.log('vertical-biological-graph: fail-closed evidence, no-hollow-gap lineage, truth-scope and coverage gates')
