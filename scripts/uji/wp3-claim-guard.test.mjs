import test from 'node:test'
import assert from 'node:assert/strict'
import { auditClaimDiff } from '../../src/governance/claimGuard.ts'

test('WP-3 Positive Case: Clean diff passes audit', () => {
  const result = auditClaimDiff('add verified engine implementation')
  assert.equal(result.passed, true)
  assert.equal(result.violations.length, 0)
})

test('WP-3 Negative Case (Fail-Closed): Placeholder diff fails audit strictly', () => {
  const result = auditClaimDiff('TODO-CLAIM: unverified data')
  assert.equal(result.passed, false)
  assert.ok(result.violations.length > 0)
})
