import assert from 'node:assert/strict'
import test from 'node:test'
import { auditProductionReadiness } from '../../src/domains/master/panaceaMasterKernel.ts'
import { getArgonCoreStatus } from '../../src/domains/argon/argonNeuralCore.ts'
import { getGenesisEngineStatus } from '../../src/domains/argon/panaceaGenesisEngine.ts'

const TARGET_SHA = 'aecfbfc5abc39217c7d44c1f9d62e5614b25b819';

test('Positive Control: Complete valid evidence produces VERIFIED_READY', () => {
  const validRecords = Array.from({ length: 6 }, (_, i) => ({
    source: 'GitHub-CI-Action',
    commitSha: TARGET_SHA,
    checkId: `check-${i + 1}`,
    status: 'PASS',
    timestamp: new Date().toISOString(),
    freshnessSeconds: 300,
    provenanceValid: true,
    applicableCriteria: 'Enterprise-Gate'
  }));

  const result = auditProductionReadiness(validRecords, TARGET_SHA);
  assert.equal(result.readinessStatus, 'VERIFIED_READY');
  assert.equal(result.verifiedEvidenceCount, 6);
  assert.equal(result.failures.length, 0);
  console.log('✅ Positive Control Passed:', result);
});

test('Negative Control: Stale or mismatched commit SHA fails closed', () => {
  const invalidRecords = [{
    source: 'Untrusted-Source',
    commitSha: 'wrong-sha-123',
    checkId: 'check-1',
    status: 'PASS',
    timestamp: new Date().toISOString(),
    freshnessSeconds: 90000, // Stale (> 24 hours)
    provenanceValid: false,
    applicableCriteria: 'Enterprise-Gate'
  }];

  const result = auditProductionReadiness(invalidRecords, TARGET_SHA);
  assert.equal(result.readinessStatus, 'REJECTED');
  assert.ok(result.failures.length > 0);
  console.log('✅ Negative Control Passed - Rejected invalid/stale evidence:', result);
});

test('Module Verification: Recovered Argon and Genesis engines exist and are properly bounded', () => {
  const argon = getArgonCoreStatus();
  const genesis = getGenesisEngineStatus();
  assert.equal(argon.biomarkerSyncStatus, 'VERIFIED');
  assert.equal(genesis.clinicalAuthority, false);
  console.log('✅ Module Verification Passed.');
});
