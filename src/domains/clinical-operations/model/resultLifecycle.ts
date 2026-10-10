/**
 * Siklus hidup hasil (Alpha B3–B5): received → pending_review → reviewed → communicated → closed.
 * Transisi hanya satu langkah maju; lompat, mundur, dan status tak dikenal ditolak dengan alasan eksplisit tanpa mengubah state.
 * `reviewed` hanya oleh klinisi terotorisasi; `communicated`/`closed` hanya oleh orang (bukan sistem) — selaras dengan aturan
 * penutupan di resultClosure.ts. Setiap transisi sah menghasilkan entri audit append-only; `verifyResultAuditTrail` mendeteksi
 * celah urutan, rantai from/to yang putus, dan waktu mundur. Akses baca (B5): peran berwenang di tenant yang sama, atau pasien sendiri.
 * Fungsi murni: waktu disuntikkan. Ini kontrol alur kerja, BUKAN penilaian klinis.
 */
export const RESULT_STATUSES = ['received', 'pending_review', 'reviewed', 'communicated', 'closed'] as const
export type ResultStatus = (typeof RESULT_STATUSES)[number]

export type ResultActorRole = 'clinician' | 'nurse' | 'lab-staff' | 'admin' | 'patient' | 'system'

export interface ResultActor {
  actorId: string
  role: ResultActorRole
  tenantId: string
  /** Hanya bermakna untuk tinjauan: klinisi punya otorisasi klinis terverifikasi untuk pasien ini. */
  authorizedClinician?: boolean
  /** Untuk role `patient`: identitas pasien yang diwakili. */
  patientId?: string
}

export interface ResultAuditEntry {
  seq: number
  resultId: string
  actorId: string
  role: ResultActorRole
  at: string
  from: ResultStatus
  to: ResultStatus
}

export type TransitionRejection =
  | 'unknown-status' | 'not-next-step' | 'invalid-timestamp' | 'time-before-last-entry'
  | 'tenant-mismatch' | 'role-not-permitted' | 'clinician-not-authorized' | 'system-cannot-record'

export type TransitionResult =
  | { ok: true; status: ResultStatus; entry: ResultAuditEntry }
  | { ok: false; reason: TransitionRejection }

const ROLES_FOR: Readonly<Record<Exclude<ResultStatus, 'received'>, readonly ResultActorRole[]>> = {
  pending_review: ['lab-staff', 'nurse', 'clinician', 'admin', 'system'],
  reviewed: ['clinician'],
  communicated: ['clinician', 'nurse'],
  closed: ['clinician', 'nurse'],
}

const isStatus = (s: unknown): s is ResultStatus => RESULT_STATUSES.includes(s as ResultStatus)
const validTime = (s: string): boolean => /^\d{4}-\d{2}-\d{2}T/.test(s) && Number.isFinite(Date.parse(s))

export interface TransitionInput {
  resultId: string
  tenantId: string
  current: ResultStatus
  target: ResultStatus
  actor: ResultActor
  at: string
  trail: readonly ResultAuditEntry[]
}

export function transitionResult(i: TransitionInput): TransitionResult {
  if (!isStatus(i.current) || !isStatus(i.target)) return { ok: false, reason: 'unknown-status' }
  if (RESULT_STATUSES.indexOf(i.target) !== RESULT_STATUSES.indexOf(i.current) + 1) return { ok: false, reason: 'not-next-step' }
  if (!validTime(i.at)) return { ok: false, reason: 'invalid-timestamp' }
  const last = i.trail[i.trail.length - 1]
  if (last && Date.parse(i.at) < Date.parse(last.at)) return { ok: false, reason: 'time-before-last-entry' }
  if (i.actor.tenantId !== i.tenantId) return { ok: false, reason: 'tenant-mismatch' }
  const target = i.target as Exclude<ResultStatus, 'received'>
  if (!ROLES_FOR[target].includes(i.actor.role)) {
    return { ok: false, reason: i.actor.role === 'system' ? 'system-cannot-record' : 'role-not-permitted' }
  }
  if (target === 'reviewed' && i.actor.authorizedClinician !== true) return { ok: false, reason: 'clinician-not-authorized' }
  const entry: ResultAuditEntry = Object.freeze({
    seq: (last?.seq ?? 0) + 1, resultId: i.resultId, actorId: i.actor.actorId, role: i.actor.role, at: i.at, from: i.current, to: target,
  })
  return { ok: true, status: target, entry }
}

export type AuditTrailIssue = 'seq-gap' | 'chain-broken' | 'time-regression' | 'wrong-result' | 'not-forward' | 'unknown-status'

/** Status akhir dari jejak yang utuh, atau daftar masalah. Jejak kosong = `received`. */
export function verifyResultAuditTrail(resultId: string, trail: readonly ResultAuditEntry[]): { ok: true; status: ResultStatus } | { ok: false; issues: AuditTrailIssue[] } {
  const issues = new Set<AuditTrailIssue>()
  let status: ResultStatus = 'received'
  let prev: ResultAuditEntry | undefined
  trail.forEach((e, idx) => {
    if (e.resultId !== resultId) issues.add('wrong-result')
    if (!isStatus(e.from) || !isStatus(e.to)) { issues.add('unknown-status'); return }
    if (e.seq !== idx + 1) issues.add('seq-gap')
    if (e.from !== status) issues.add('chain-broken')
    if (RESULT_STATUSES.indexOf(e.to) !== RESULT_STATUSES.indexOf(e.from) + 1) issues.add('not-forward')
    if (prev && Date.parse(e.at) < Date.parse(prev.at)) issues.add('time-regression')
    status = e.to
    prev = e
  })
  return issues.size ? { ok: false, issues: [...issues].sort() } : { ok: true, status }
}

const READ_ROLES: readonly ResultActorRole[] = ['clinician', 'nurse', 'lab-staff', 'admin']

/** B5: baca hasil. Peran lain, tenant lain, pasien lain, dan sistem ditolak (fail closed). */
export function canReadResult(actor: ResultActor, result: { tenantId: string; patientId: string }): boolean {
  if (actor.role === 'patient') return typeof actor.patientId === 'string' && actor.patientId === result.patientId && actor.tenantId === result.tenantId
  return READ_ROLES.includes(actor.role) && actor.tenantId === result.tenantId
}
