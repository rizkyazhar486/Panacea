import assert from 'node:assert/strict'
import { SKIN_BARRIER_EDUCATION_BOUNDARY, SKIN_BARRIER_EVIDENCE, SKIN_BARRIER_LAYERS } from '../../src/lib/integumentaryBarrierEducation.ts'

assert.deepEqual(SKIN_BARRIER_LAYERS.map((layer) => layer.id), ['surface-microenvironment', 'stratum-corneum', 'viable-epidermis', 'dermis'])
for (const layer of SKIN_BARRIER_LAYERS) {
  assert.ok(layer.anatomy.length > 0)
  assert.ok(layer.physiology.length > 0)
  assert.ok(layer.disruption.length > 0)
  assert.ok(layer.educationalRelationships.length > 0)
}
assert.deepEqual(SKIN_BARRIER_EVIDENCE.map((source) => source.pmid), ['37717558', '32217811'])
assert.ok(SKIN_BARRIER_EVIDENCE.every((source) => source.url === `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`))
const boundary = JSON.stringify(SKIN_BARRIER_EDUCATION_BOUNDARY).toLowerCase()
for (const required of ['patient-specific', 'treatment', 'human clinical review', 'clinical validity']) assert.ok(boundary.includes(required))
assert.ok(JSON.stringify(SKIN_BARRIER_LAYERS).toLowerCase().includes('transepidermal water loss'))
console.log('integumentary barrier education: ok')
