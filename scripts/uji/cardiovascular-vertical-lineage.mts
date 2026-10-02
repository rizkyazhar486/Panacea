import assert from 'node:assert/strict'
import { assessVerticalLineage, validateVerticalBiologicalGraph } from '../../src/lib/biology/verticalBiologyGraph.ts'
import {
  CARDIOVASCULAR_VERTICAL_EVIDENCE,
  CARDIOVASCULAR_VERTICAL_GRAPH,
  cardiovascularVerticalGraph,
} from '../../src/lib/biology/cardiovascularVerticalLineage.ts'

const graph = cardiovascularVerticalGraph()
assert.deepEqual(validateVerticalBiologicalGraph(graph), [])
assert.equal(graph.id, CARDIOVASCULAR_VERTICAL_GRAPH.id)
assert.ok(CARDIOVASCULAR_VERTICAL_EVIDENCE.some((entry) => entry.sourceId === 'PMID:28956314'))
assert.ok(CARDIOVASCULAR_VERTICAL_EVIDENCE.some((entry) => entry.sourceId === 'NCBI-GENE:6262'))
assert.ok(CARDIOVASCULAR_VERTICAL_EVIDENCE.some((entry) => entry.sourceId === 'NCBI-GENE:7134'))

const ryr2 = graph.lineages.find((lineage) => lineage.id === 'cardio.ryr2-calcium-handling')
const troponin = graph.lineages.find((lineage) => lineage.id === 'cardio.troponin-sarcomere')
assert.ok(ryr2)
assert.ok(troponin)

const implementedNodeIds = (lineage: typeof ryr2) =>
  (lineage?.steps ?? []).filter((step) => step.status === 'implemented').map((step) => step.nodeId)

assert.deepEqual(implementedNodeIds(ryr2).slice(0, 7), [
  'human',
  'cardiovascular-system',
  'heart',
  'left-ventricle',
  'lv-myocardium',
  'cardiac-dyad',
  'ventricular-cardiomyocyte',
])
assert.ok(implementedNodeIds(ryr2).includes('ryr2-channel-complex'))
assert.ok(implementedNodeIds(ryr2).includes('ryr2-protein'))
assert.ok(implementedNodeIds(ryr2).includes('calcium-induced-calcium-release'))
assert.ok(implementedNodeIds(ryr2).includes('cytosolic-calcium'))
assert.ok(implementedNodeIds(ryr2).includes('ryr2-transcript'))
assert.ok(implementedNodeIds(ryr2).includes('ryr2-gene'))
assert.ok(implementedNodeIds(ryr2).includes('ryr2-chromatin'))
assert.equal(ryr2?.steps.at(-1)?.nodeId, 'ryr2-dna')

assert.ok(implementedNodeIds(troponin).includes('sarcomere'))
assert.ok(implementedNodeIds(troponin).includes('cardiac-troponin-complex'))
assert.ok(implementedNodeIds(troponin).includes('tnnc1-protein'))
assert.ok(implementedNodeIds(troponin).includes('thin-filament-calcium-activation'))
assert.ok(implementedNodeIds(troponin).includes('tnnc1-transcript'))
assert.ok(implementedNodeIds(troponin).includes('tnnc1-gene'))
assert.equal(troponin?.steps.at(-1)?.nodeId, 'tnnc1-dna')

for (const lineage of graph.lineages) {
  const assessment = assessVerticalLineage(lineage)
  assert.ok(assessment.gaps > 0, `${lineage.id} must expose remaining vertical gaps rather than imply completion`)
  assert.ok(assessment.completeness < 1)
  assert.ok(lineage.steps.some((step) => step.status === 'gap' && step.reason?.includes('VERTICAL GAP — NOT YET MODELED')))
}

const deepScales = new Set(['molecular-complex', 'protein', 'pathway', 'metabolite-ion', 'rna', 'gene-regulatory', 'chromatin', 'dna'])
for (const node of graph.nodes) {
  if (deepScales.has(node.scale)) {
    assert.notEqual(node.truthScope, 'patient-specific', `${node.id} must remain reference/model scoped without patient molecular evidence`)
    assert.ok(node.evidence.length > 0)
  }
}

const ryr2Node = graph.nodes.find((node) => node.id === 'ryr2-protein')
const tnnc1Node = graph.nodes.find((node) => node.id === 'tnnc1-protein')
assert.ok(ryr2Node?.evidence.some((evidence) => evidence.sourceId === 'NCBI-GENE:6262'))
assert.ok(tnnc1Node?.evidence.some((evidence) => evidence.sourceId === 'NCBI-GENE:7134'))

console.log('cardiovascular-vertical-lineage: person→myocardium→cell→mechanism→RNA/chromatin/DNA with explicit unresolved gaps')
