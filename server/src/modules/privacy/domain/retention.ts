export type RetentionRecord = { id: string; createdAtMs: number; payload: unknown }
export type RetentionAudit = { recordId: string; atMs: number; action: 'created' | 'expired' }
export type RetentionSnapshot = { records: RetentionRecord[]; audit: RetentionAudit[] }
export type RetentionPolicy = { recordRetentionMs: number; auditRetentionMs: number }

export function parseRetentionPolicy(value: unknown): RetentionPolicy {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('invalid-retention-policy')
  const policy = value as Record<string, unknown>
  const keys = Object.keys(policy).sort()
  if (keys.length !== 3 || keys.join(',') !== 'auditRetentionMs,recordRetentionMs,schemaVersion' || policy.schemaVersion !== 1) {
    throw new Error('invalid-retention-policy')
  }
  if (policy.recordRetentionMs === null || policy.auditRetentionMs === null) throw new Error('retention-policy-unset')
  for (const period of [policy.recordRetentionMs, policy.auditRetentionMs]) {
    if (typeof period !== 'number' || !Number.isSafeInteger(period) || period <= 0) throw new Error('invalid-retention-period')
  }
  return { recordRetentionMs: policy.recordRetentionMs as number, auditRetentionMs: policy.auditRetentionMs as number }
}

function validId(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function validTime(value: unknown, nowMs: number): boolean {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= nowMs
}

// Murni dan belum disambungkan ke store/jadwal produksi: kebijakan nyata tetap belum ditetapkan.
export function sweepRetention(snapshot: RetentionSnapshot, policyValue: unknown, nowMs: number): RetentionSnapshot {
  const policy = parseRetentionPolicy(policyValue)
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) throw new Error('invalid-retention-clock')
  if (!snapshot || !Array.isArray(snapshot.records) || !Array.isArray(snapshot.audit)) throw new Error('invalid-retention-snapshot')
  const ids = new Set<string>()
  for (const record of snapshot.records) {
    if (!record || !validId(record.id) || !validTime(record.createdAtMs, nowMs) || ids.has(record.id)) {
      throw new Error('invalid-retention-record')
    }
    ids.add(record.id)
  }
  for (const event of snapshot.audit) {
    if (!event || !validId(event.recordId) || !validTime(event.atMs, nowMs) || !['created', 'expired'].includes(event.action)) {
      throw new Error('invalid-retention-audit')
    }
    // Field tak dikenal ditolak; jangan diam-diam mempertahankan payload dalam jejak audit.
    const keys = Object.keys(event).sort()
    if (keys.length !== 3 || keys.join(',') !== 'action,atMs,recordId') throw new Error('invalid-retention-audit')
  }
  const expired = snapshot.records.filter(record => nowMs - record.createdAtMs >= policy.recordRetentionMs)
  return {
    records: snapshot.records.filter(record => nowMs - record.createdAtMs < policy.recordRetentionMs),
    audit: [
      ...snapshot.audit.filter(event => nowMs - event.atMs < policy.auditRetentionMs),
      // Jejak penghapusan tidak menyalin payload yang sudah kedaluwarsa.
      ...expired.map(record => ({ recordId: record.id, atMs: nowMs, action: 'expired' as const })),
    ],
  }
}
