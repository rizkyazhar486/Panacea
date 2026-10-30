import test from 'node:test'
import assert from 'node:assert/strict'
import { auditStructureReview } from '../../src/domains/body-exposure/engine/structureReviewEngine.ts'

test('BX-10 Golden Case: Clean structures audit passes with zero unresolved gaps', () => {
  const audit = auditStructureReview([
    { name: 'Heart', status: 'verified' },
    { name: 'Kidney', status: 'verified' }
  ])
  assert.equal(audit.auditStatus, 'passed')
  assert.equal(audit.unresolvedGaps, 0)
  assert.equal(audit.truthClass, 'reference')
})

test('BX-10 Negative Case: Unresolved gaps trigger failed audit status', () => {
  const audit = auditStructureReview([
    { name: 'Brain', status: 'gap' }
  ])
  assert.equal(audit.auditStatus, 'failed')
  assert.equal(audit.unresolvedGaps, 1)
})
