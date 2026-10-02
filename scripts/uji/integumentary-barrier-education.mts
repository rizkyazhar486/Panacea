import assert from 'node:assert/strict'
import {
  SKIN_BARRIER_EDUCATION_BOUNDARY,
  SKIN_BARRIER_EVIDENCE,
  SKIN_BARRIER_LAYERS,
} from '../../src/lib/integumentaryBarrierEducation.ts'

assert.equal(SKIN_BARRIER_LAYERS.length, 4, 'expected four bounded skin-barrier teaching layers')
assert.deepEqual(
  SKIN_BARRIER_LAYERS.map((layer) => layer.id),
  ['surface-microenvironment', 'stratum-corneum', 'viable-epidermis', 'dermis'],
  'layer order must preserve surface-to-deep educational topology',
)

for (const layer of SKIN_BARRIER_LAYERS) {
  assert.ok(layer.anatomy.length > 0, `${layer.id} needs anatomy anchors`)
  assert.ok(layer.physiology.length > 0, `${layer.id} needs physiology anchors`)
  assert.ok(layer.disruption.length > 0, `${layer.id} needs a bounded disruption relationship`)
  assert.ok(layer.educationalRelationships.length > 0, `${layer.id} needs explicit educational relationships`)
}

assert.deepEqual(SKIN_BARRIER_EVIDENCE.map((source) => source.pmid), ['37717558', '32217811'])
for (const source of SKIN_BARRIER_EVIDENCE) {
  assert.equal(source.url, `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`, `${source.pmid} must use canonical PubMed provenance`)
  assert.ok(source.title.length > 20, `${source.pmid} needs a source title for inspectable provenance`)
  assert.ok(source.role.length > 20, `${source.pmid} needs an evidence-role boundary`)
}

const boundary = JSON.stringify(SKIN_BARRIER_EDUCATION_BOUNDARY).toLowerCase()
for (const required of ['patient-specific', 'treatment', 'human clinical review', 'clinical validity', 'allergy', 'infection', 'malignancy']) {
  assert.ok(boundary.includes(required), `publication boundary must explicitly contain: ${required}`)
}

const allClaims = JSON.stringify(SKIN_BARRIER_LAYERS).toLowerCase()
for (const required of ['transepidermal water loss', 'immune', 'microbial', 'ceramide', 'water retention']) {
  assert.ok(allClaims.includes(required), `bounded barrier teaching relationship must remain explicit: ${required}`)
}

console.log('integumentary barrier education: deterministic provenance and boundary checks passed')
