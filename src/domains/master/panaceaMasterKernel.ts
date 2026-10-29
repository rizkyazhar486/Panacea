/**
 * PanaceaMed Master Evidence-Driven Governance Kernel (Directive 024 Closure)
 * Replaces self-reported readiness with inspectable, cryptographically signed or CI-verified evidence records.
 */

export interface EvidenceRecord {
  source: string;
  commitSha: string;
  checkId: string;
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  timestamp: string;
  freshnessSeconds: number;
  provenanceValid: boolean;
  applicableCriteria: string;
}

export interface InspectionResult {
  readinessStatus: 'VERIFIED_READY' | 'PENDING_EVIDENCE' | 'REJECTED';
  verifiedEvidenceCount: number;
  failures: string[];
}

export function auditProductionReadiness(records: EvidenceRecord[], expectedCommitSha: string): InspectionResult {
  let passed = 0;
  const failures: string[] = [];

  if (!records || records.length === 0) {
    return { readinessStatus: 'REJECTED', verifiedEvidenceCount: 0, failures: ['No evidence records provided. Failing closed.'] };
  }

  for (const rec of records) {
    if (rec.commitSha !== expectedCommitSha) {
      failures.push(`Commit SHA mismatch for check ${rec.checkId}: expected ${expectedCommitSha}, got ${rec.commitSha}`);
      continue;
    }
    if (!rec.provenanceValid) {
      failures.push(`Invalid evidence provenance for check ${rec.checkId}`);
      continue;
    }
    if (rec.freshnessSeconds > 86400) {
      failures.push(`Stale evidence for check ${rec.checkId} (age: ${rec.freshnessSeconds}s)`);
      continue;
    }
    if (rec.status === 'PASS') {
      passed++;
    } else {
      failures.push(`Evidence check ${rec.checkId} failed or unknown status: ${rec.status}`);
    }
  }

  let status: 'VERIFIED_READY' | 'PENDING_EVIDENCE' | 'REJECTED' = 'REJECTED';
  if (failures.length === 0 && passed >= 6) {
    status = 'VERIFIED_READY';
  } else if (passed > 0) {
    status = 'PENDING_EVIDENCE';
  }

  return {
    readinessStatus: status,
    verifiedEvidenceCount: passed,
    failures
  };
}
