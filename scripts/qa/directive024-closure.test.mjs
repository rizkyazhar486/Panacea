import assert from 'node:assert/strict'
import test from 'node:test'
import { auditProductionReadiness } from '../../src/domains/master/panaceaMasterKernel.ts'
import { getArgonCoreStatus } from '../../src/domains/argon/argonNeuralCore.ts'
import { getGenesisEngineStatus } from '../../src/domains/argon/panaceaGenesisEngine.ts'

const sha = 'aecfbfc5abc39217c7d44c1f9d62e5614b25b819'
const claim = (i) => ({ source: 'synthetic-ci', commitSha: sha, checkId: `check-${i}`, status: 'PASS', timestamp: '2026-10-29T00:00:00.000Z', freshnessSeconds: 300, provenanceValid: true, applicableCriteria: 'synthetic-gate' })

test('well-formed caller claims remain unverified regardless of count', () => {
  for (const count of [1, 6, 20]) {
    const result = auditProductionReadiness(Array.from({ length: count }, (_, i) => claim(i)), sha)
    assert.equal(result.readinessStatus, 'PENDING_EVIDENCE')
    assert.equal(result.verifiedEvidenceCount, 0)
    assert.ok(result.failures.includes('UNVERIFIED_EVIDENCE'))
  }
})

test('Argon and Genesis status do not claim patient truth or clinical authority', () => {
  assert.equal(getArgonCoreStatus().biomarkerSyncStatus, 'UNVERIFIED')
  assert.equal(getGenesisEngineStatus().clinicalAuthority, false)
})
