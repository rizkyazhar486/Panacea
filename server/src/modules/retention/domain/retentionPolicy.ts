// Harness retensi dan penghapusan (ENG-E4-03). Murni dan deterministik: waktu disuntik, penyimpanan disuntik, tidak ada jadwal produksi.
// Angka masa simpan TIDAK ditetapkan di kode: semuanya datang dari berkas kebijakan. Berkas produksi berstatus `unset` dengan semua nilai
// null sampai pemilik memutuskan (EXT-E4-A); harness gagal-tertutup pada kebijakan yang tidak sah dan tidak pernah menghapus karena angka
// yang hilang. Ini alat penegak, bukan keputusan: tidak ada angka hukum atau klinis di sini.

export type PolicyStatus = 'unset' | 'test' | 'approved'
export interface RetentionRule { maxAgeDays: number | null }
export interface RetentionPolicy {
  schemaVersion: 1
  status: PolicyStatus
  /** Wajib bila status = approved: siapa dan kapan memutuskan, serta rujukan keputusan. */
  approvedBy?: string
  approvedAt?: string
  decisionRef?: string
  /** Aturan per koleksi data pribadi. Koleksi tanpa aturan tidak pernah disentuh. */
  rules: Record<string, RetentionRule>
  /** Masa simpan jejak audit penghapusan itu sendiri; null = tidak pernah dipangkas. */
  audit: RetentionRule
}

export const DAY_MS = 86_400_000
export const MAX_DAYS = 36_500
const COLLECTION = /^[a-z][a-z0-9-]{0,40}$/
const FIELDS = new Set(['schemaVersion', 'status', 'approvedBy', 'approvedAt', 'decisionRef', 'rules', 'audit'])
const filled = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const validDays = (v: unknown) => v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= MAX_DAYS)

export type PolicyCheck = { ok: true; policy: RetentionPolicy } | { ok: false; errors: string[] }

/** Kebijakan hanya sah bila seluruhnya sah; satu cacat = tidak ada yang dijalankan. */
export function validatePolicy(raw: unknown): PolicyCheck {
  const errors: string[] = []
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: ['policy-not-object'] }
  const p = raw as Record<string, unknown>
  for (const k of Object.keys(p)) if (!FIELDS.has(k)) errors.push(`unknown-field:${k}`)
  if (p.schemaVersion !== 1) errors.push('schema-version-invalid')
  if (p.status !== 'unset' && p.status !== 'test' && p.status !== 'approved') errors.push('status-invalid')
  if (!p.rules || typeof p.rules !== 'object' || Array.isArray(p.rules)) errors.push('rules-invalid')
  const rules = (p.rules && typeof p.rules === 'object' && !Array.isArray(p.rules) ? p.rules : {}) as Record<string, unknown>
  const values: unknown[] = []
  for (const [name, rule] of Object.entries(rules)) {
    if (!COLLECTION.test(name)) { errors.push(`collection-name-invalid:${name}`); continue }
    if (!rule || typeof rule !== 'object' || Array.isArray(rule) || Object.keys(rule).some((k) => k !== 'maxAgeDays')) { errors.push(`rule-invalid:${name}`); continue }
    const days = (rule as { maxAgeDays?: unknown }).maxAgeDays
    if (!validDays(days)) { errors.push(`days-invalid:${name}`); continue }
    values.push(days)
  }
  const audit = p.audit as { maxAgeDays?: unknown } | undefined
  if (!audit || typeof audit !== 'object' || Array.isArray(audit) || Object.keys(audit).some((k) => k !== 'maxAgeDays') || !validDays(audit.maxAgeDays)) errors.push('audit-days-invalid')
  else values.push(audit.maxAgeDays)
  if (p.status === 'unset' && values.some((v) => v !== null)) errors.push('unset-with-values')
  if (p.status === 'approved') {
    if (!filled(p.approvedBy)) errors.push('approved-without-approver')
    if (!filled(p.approvedAt) || Number.isNaN(Date.parse(p.approvedAt))) errors.push('approved-without-date')
    if (!filled(p.decisionRef)) errors.push('approved-without-decision-ref')
  } else if ('approvedBy' in p || 'approvedAt' in p || 'decisionRef' in p) errors.push('approval-fields-without-approved-status')
  return errors.length ? { ok: false, errors } : { ok: true, policy: raw as RetentionPolicy }
}

export interface StoredRecord { id: string; createdAt: unknown }
/** Jejak penghapusan: hanya siapa-kapan-apa, tanpa isi rekaman. */
export interface RetentionAuditEntry { at: string; action: 'retention.delete'; collection: string; recordId: string; ageDays: number; ruleDays: number }
export interface AuditRecord { id: string; createdAt: string; entry: RetentionAuditEntry }

export interface RetentionPlan {
  deletions: Array<{ collection: string; recordId: string; ageDays: number; ruleDays: number }>
  /** Rekaman yang umurnya tidak dapat dibuktikan (createdAt hilang atau tidak sah): tidak pernah dihapus. */
  unknownAge: Array<{ collection: string; recordId: string }>
  /** Koleksi beraturan tetapi nilainya null: tidak ada yang dihapus. */
  unsetCollections: string[]
  auditPrune: string[]
}
export type PlanResult = { ok: true; plan: RetentionPlan } | { ok: false; errors: string[] }

/** Umur dalam hari penuh; rekaman kedaluwarsa hanya bila LEBIH tua dari batas (tepat di batas masih disimpan). */
function expired(createdAt: unknown, now: Date, days: number): { age: number } | 'unknown' | null {
  if (typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt))) return 'unknown'
  const elapsed = now.getTime() - Date.parse(createdAt)
  return elapsed > days * DAY_MS ? { age: Math.floor(elapsed / DAY_MS) } : null
}

export function planRetention(input: { policy: unknown; data: Readonly<Record<string, readonly StoredRecord[]>>; audit: readonly AuditRecord[]; now: Date }): PlanResult {
  const checked = validatePolicy(input.policy)
  if (!checked.ok) return checked
  if (!(input.now instanceof Date) || Number.isNaN(input.now.getTime())) return { ok: false, errors: ['now-invalid'] }
  const { policy } = checked
  const plan: RetentionPlan = { deletions: [], unknownAge: [], unsetCollections: [], auditPrune: [] }
  for (const [collection, rule] of Object.entries(policy.rules)) {
    if (rule.maxAgeDays === null) { plan.unsetCollections.push(collection); continue }
    for (const rec of input.data[collection] ?? []) {
      const verdict = expired(rec.createdAt, input.now, rule.maxAgeDays)
      if (verdict === 'unknown') plan.unknownAge.push({ collection, recordId: rec.id })
      else if (verdict) plan.deletions.push({ collection, recordId: rec.id, ageDays: verdict.age, ruleDays: rule.maxAgeDays })
    }
  }
  if (policy.audit.maxAgeDays !== null) {
    for (const a of input.audit) {
      const verdict = expired(a.createdAt, input.now, policy.audit.maxAgeDays)
      if (verdict && verdict !== 'unknown') plan.auditPrune.push(a.id)
    }
  }
  return { ok: true, plan }
}

/** Antarmuka penyimpanan yang disuntikkan; implementasi produksi belum ada dengan sengaja. */
export interface RetentionStore {
  list(collection: string): readonly StoredRecord[]
  remove(collection: string, id: string): void
  listAudit(): readonly AuditRecord[]
  appendAudit(rec: AuditRecord): void
  removeAudit(id: string): void
}

export type SweepResult = { ok: true; deleted: number; audited: number; auditPruned: number; plan: RetentionPlan } | { ok: false; errors: string[] }

/** Satu sapuan: rencana dihitung dulu, lalu dijalankan. Kebijakan tidak sah = tidak ada efek samping. Jejak ditulis SEBELUM rekaman dihapus. */
export function applyRetention(store: RetentionStore, policy: unknown, now: Date): SweepResult {
  const checked = validatePolicy(policy)
  if (!checked.ok) return checked
  const data: Record<string, readonly StoredRecord[]> = {}
  for (const name of Object.keys(checked.policy.rules)) data[name] = store.list(name)
  const planned = planRetention({ policy, data, audit: store.listAudit(), now })
  if (!planned.ok) return planned
  const { plan } = planned
  for (const d of plan.deletions) {
    const entry: RetentionAuditEntry = { at: now.toISOString(), action: 'retention.delete', collection: d.collection, recordId: d.recordId, ageDays: d.ageDays, ruleDays: d.ruleDays }
    store.appendAudit({ id: `ret-${d.collection}-${d.recordId}-${now.getTime()}`, createdAt: now.toISOString(), entry })
    store.remove(d.collection, d.recordId)
  }
  for (const id of plan.auditPrune) store.removeAudit(id)
  return { ok: true, deleted: plan.deletions.length, audited: plan.deletions.length, auditPruned: plan.auditPrune.length, plan }
}
