// Klaim dari pemanggil belum terhubung ke sumber bukti yang diautentikasi.
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

const validSha = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value)
const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
const validTimestamp = (value: unknown): boolean => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)) return false
  const calendarDay = new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
  return Number.isFinite(calendarDay.getTime()) && calendarDay.toISOString().slice(0, 10) === value.slice(0, 10) && Number.isFinite(Date.parse(value))
}

// Ini hanya memeriksa bentuk dan klaim; tidak memverifikasi asal atau waktu CI.
export function auditProductionReadiness(records: EvidenceRecord[], expectedCommitSha: string): InspectionResult {
  const failures = new Set<string>()
  if (!validSha(expectedCommitSha)) failures.add('INVALID_EXPECTED_SHA')
  if (!Array.isArray(records) || records.length === 0) failures.add('MISSING_EVIDENCE')
  const checks = new Set<string>()
  for (const record of Array.isArray(records) ? records : []) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      failures.add('MALFORMED_RECORD')
      continue
    }
    if (!nonempty(record.source) || !nonempty(record.checkId) || !nonempty(record.applicableCriteria)) failures.add('MALFORMED_RECORD')
    if (!validSha(record.commitSha) || !validSha(expectedCommitSha) || record.commitSha.toLowerCase() !== expectedCommitSha.toLowerCase()) failures.add('INVALID_COMMIT_SHA')
    if (nonempty(record.checkId)) {
      const checkId = record.checkId.trim()
      if (checks.has(checkId)) failures.add('DUPLICATE_CHECK')
      checks.add(checkId)
    }
    if (!validTimestamp(record.timestamp)) failures.add('INVALID_TIMESTAMP')
    if (typeof record.freshnessSeconds !== 'number' || !Number.isFinite(record.freshnessSeconds) || record.freshnessSeconds < 0 || record.freshnessSeconds > 86400) failures.add('INVALID_FRESHNESS_CLAIM')
    if (record.provenanceValid !== true) failures.add('INVALID_PROVENANCE_CLAIM')
    if (record.status !== 'PASS') failures.add('NON_PASS_STATUS')
  }
  if (failures.size) return { readinessStatus: 'REJECTED', verifiedEvidenceCount: 0, failures: [...failures] }
  return { readinessStatus: 'PENDING_EVIDENCE', verifiedEvidenceCount: 0, failures: ['UNVERIFIED_EVIDENCE'] }
}

export function evaluateMasterSystem() {
  return {
    productionReady: false,
    systemIntegrityScore: null,
    totalModulesIntegrated: null,
    branchName: null,
  }
}
