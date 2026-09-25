import assert from 'node:assert/strict'
import { ADRENAL_EDUCATION_NODES, validateAdrenalEducationGraph } from '../../src/lib/bodyAdrenalEducation.ts'

const audit = validateAdrenalEducationGraph()
assert.deepEqual(audit.incompleteProvenance, [])
assert.deepEqual(audit.falseHumanReviewClaims, [])

for (const node of ADRENAL_EDUCATION_NODES.filter((item) => item.evidenceState !== 'educational-only')) {
  for (const item of node.evidence) {
    assert.ok(item.sourceType.length > 0)
    assert.ok(item.sourceLocator.length > 0)
    assert.match(item.accessedOrReviewedAt, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(item.claimScope.length > 20)
    assert.ok(['anatomy-reference', 'physiology-reference', 'mechanism-reference'].includes(item.evidenceRole))
    assert.ok(['draft', 'source-checked'].includes(item.reviewState))
    assert.notEqual(item.reviewState, 'human-reviewed')
  }
}

console.log('body-adrenal-provenance-boundary: bounded source metadata OK')
