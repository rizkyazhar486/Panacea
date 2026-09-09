import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  NUTRITION_EVIDENCE_BOUNDARIES,
  NUTRITION_EVIDENCE_SOURCE_POINTERS,
} from '../../src/lib/nutritionEvidenceLineage.ts'

const expected = [
  ['open_food_facts', 'data/source-registry/nutrition/open-food-facts.json', 'food-reference'],
  ['pubmed-ncbi-eutils', 'data/source-registry/evidence/pubmed-ncbi-eutils.json', 'literature-index'],
  ['europe-pmc-rest', 'data/source-registry/evidence/europe-pmc-rest.json', 'literature-index'],
] as const

assert.equal(NUTRITION_EVIDENCE_SOURCE_POINTERS.length, expected.length)
for (const [id, registryPath, layer] of expected) {
  const pointer = NUTRITION_EVIDENCE_SOURCE_POINTERS.find((source) => source.id === id)
  assert.ok(pointer, `Missing nutrition evidence pointer: ${id}`)
  assert.equal(pointer.registryPath, registryPath)
  assert.equal(pointer.layer, layer)

  const registry = JSON.parse(readFileSync(new URL(`../../${registryPath}`, import.meta.url), 'utf8'))
  assert.equal(registry.id, id, `Source Registry identity drifted for ${id}`)
  assert.equal(registry.adapter.status, 'ACTIVE', `${id} must remain adapter-backed before this evidence pointer is presented as active lineage.`)
  assert.equal(registry.validation.level, 'REFERENCE')
  assert.equal(registry.validation.clinicalDecisionUse, 'CONTEXT_ONLY')
  assert.equal(registry.provenance.sourceIdentityRequired, true)
}

assert.deepEqual(NUTRITION_EVIDENCE_BOUNDARIES, [
  'A food-reference record is not evidence that a health claim is true.',
  'A literature-index citation is a provenance pointer, not a study-quality or guideline verdict.',
  'Clinical or dietary claims require review of the original source, population, methods, outcomes, units, date, and applicability.',
])

const card = readFileSync(new URL('../../src/components/NutritionEvidenceLineageCard.tsx', import.meta.url), 'utf8')
const workbench = readFileSync(new URL('../../src/pages/NutritionDataWorkbench.tsx', import.meta.url), 'utf8')
assert.match(card, /makes no upstream request from the browser/)
assert.match(card, /does not turn a citation pointer into a verified nutrition claim/)
assert.match(card, /Full-text or figure reuse rights must never be inferred from indexing alone/)
assert.doesNotMatch(card, /fetch\(|axios\.|useQuery\(|setInterval\(/)
assert.match(workbench, /<NutritionEvidenceLineageCard \/>/)
assert.doesNotMatch(workbench, /fetch\(|axios\.|setInterval\(/)

console.log('Feature Factory nutrition evidence: Source Registry identities, reference-only validation, provenance boundaries, and no-direct-upstream UI are deterministically guarded.')
