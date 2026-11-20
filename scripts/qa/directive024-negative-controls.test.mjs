import assert from 'node:assert/strict'
import test from 'node:test'
import { auditProductionReadiness } from '../../src/domains/master/panaceaMasterKernel.ts'

const sha = 'aecfbfc5abc39217c7d44c1f9d62e5614b25b819'
const valid = () => ({ source: 'synthetic-ci', commitSha: sha, checkId: 'synthetic-check', status: 'PASS', timestamp: '2026-10-29T00:00:00.000Z', freshnessSeconds: 300, provenanceValid: true, applicableCriteria: 'synthetic-gate' })

test('malformed, failed, stale or duplicate claims never promote readiness', () => {
  const cases = [
    [undefined, sha], [[], sha], [[null], sha], [[{}], sha], [[valid()], 'not-a-sha'],
    [[{ ...valid(), commitSha: 'bad-sha' }], sha], [[{ ...valid(), commitSha: '0'.repeat(40) }], sha],
    [[{ ...valid(), status: 'FAIL' }], sha], [[{ ...valid(), status: 'UNKNOWN' }], sha],
    [[{ ...valid(), provenanceValid: false }], sha], [[{ ...valid(), freshnessSeconds: NaN }], sha],
    [[{ ...valid(), freshnessSeconds: Infinity }], sha], [[{ ...valid(), freshnessSeconds: -1 }], sha],
    [[{ ...valid(), freshnessSeconds: 86401 }], sha], [[{ ...valid(), timestamp: 'not-a-time' }], sha],
    [[{ ...valid(), timestamp: '2026-02-30T12:00:00Z' }], sha],
    [[{ ...valid(), checkId: '' }], sha], [[valid(), valid()], sha],
  ]
  for (const [records, expectedSha] of cases) {
    const result = auditProductionReadiness(records, expectedSha)
    assert.equal(result.readinessStatus, 'REJECTED')
    assert.equal(result.verifiedEvidenceCount, 0)
    assert.ok(result.failures.length > 0)
  }
})

test('one invalid claim rejects the complete batch without exposing raw values', () => {
  const result = auditProductionReadiness([valid(), { ...valid(), checkId: 'private-marker', status: 'FAIL' }], sha)
  assert.equal(result.readinessStatus, 'REJECTED')
  assert.equal(result.verifiedEvidenceCount, 0)
  assert.ok(!JSON.stringify(result).includes('private-marker'))
})

test('six self-reported PASS claims are not independent evidence', () => {
  const records = Array.from({ length: 6 }, (_, i) => ({ ...valid(), checkId: `check-${i}` }))
  const result = auditProductionReadiness(records, sha)
  assert.equal(result.readinessStatus, 'PENDING_EVIDENCE')
  assert.equal(result.verifiedEvidenceCount, 0)
})
