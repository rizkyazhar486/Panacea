// Mesin siklus hidup generik (murni, deterministik) untuk hasil lab dan rujukan.
//
// Satu mesin, dua definisi (resultLifecycle / referralLifecycle) agar aturan transisi, jejak audit
// dan deteksi kerusakan jejak tidak disalin. Ini kontrol ALUR KERJA, bukan penilaian klinis.
// Waktu disuntikkan; hash rantai memakai node:crypto (deterministik, tanpa acak/jam).
import { createHash } from 'node:crypto'

export type ActorRole = 'clinician' | 'nurse' | 'lab-staff' | 'admin' | 'patient' | 'system'

export interface Actor {
  actorId: string
  role: ActorRole
  tenantId: string
  /** Hanya bermakna untuk klinisi: otorisasi klinis terverifikasi. */
  authorizedClinician?: boolean
  /** Hanya untuk peran pasien: identitas pasien yang boleh diwakili akun ini. */
  patientIds?: readonly string[]
}

export interface Lifecycle<S extends string> {
  readonly initial: S
  /** Tepi yang diizinkan: dari -> daftar tujuan. */
  readonly edges: Readonly<Record<S, readonly S[]>>
  /** Peran yang boleh MEMASUKI status; status tanpa entri tidak dapat dimasuki lewat transisi. */
  readonly roles: Readonly<Partial<Record<S, readonly ActorRole[]>>>
  /** Memasuki status ini mewajibkan klinisi terotorisasi. */
  readonly needsAuthorizedClinician: readonly S[]
}

export interface AuditEntry<S extends string = string> {
  seq: number
  subjectId: string
  actorId: string
  role: ActorRole
  at: string
  from: S
  to: S
  prevHash: string
  hash: string
}

export const GENESIS_HASH = '0'.repeat(64)

export type TransitionRejection =
  | 'unknown-status' | 'not-allowed-step' | 'invalid-timestamp' | 'time-before-last-entry'
  | 'tenant-mismatch' | 'role-not-permitted' | 'clinician-not-authorized' | 'system-cannot-record'

export type TransitionResult<S extends string> =
  | { ok: true; status: S; entry: AuditEntry<S> }
  | { ok: false; reason: TransitionRejection }

const validTime = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(s) && Number.isFinite(Date.parse(s))

export function entryHash(e: Omit<AuditEntry, 'hash'>): string {
  return createHash('sha256')
    .update([e.prevHash, e.seq, e.subjectId, e.actorId, e.role, e.at, e.from, e.to].join('|'))
    .digest('hex')
}

const known = <S extends string>(lc: Lifecycle<S>, s: unknown): s is S => typeof s === 'string' && Object.prototype.hasOwnProperty.call(lc.edges, s)

export interface TransitionInput<S extends string> {
  subjectId: string
  tenantId: string
  current: S
  target: S
  actor: Actor
  at: string
  trail: readonly AuditEntry<S>[]
}

export function transition<S extends string>(lc: Lifecycle<S>, i: TransitionInput<S>): TransitionResult<S> {
  if (!known(lc, i.current) || !known(lc, i.target)) return { ok: false, reason: 'unknown-status' }
  if (!lc.edges[i.current].includes(i.target)) return { ok: false, reason: 'not-allowed-step' }
  if (!validTime(i.at)) return { ok: false, reason: 'invalid-timestamp' }
  const last = i.trail[i.trail.length - 1]
  if (last && Date.parse(i.at) < Date.parse(last.at)) return { ok: false, reason: 'time-before-last-entry' }
  if (i.actor.tenantId !== i.tenantId) return { ok: false, reason: 'tenant-mismatch' }
  const allowed = lc.roles[i.target] ?? []
  if (!allowed.includes(i.actor.role)) return { ok: false, reason: i.actor.role === 'system' ? 'system-cannot-record' : 'role-not-permitted' }
  if (lc.needsAuthorizedClinician.includes(i.target) && i.actor.authorizedClinician !== true) return { ok: false, reason: 'clinician-not-authorized' }
  const base = { seq: (last?.seq ?? 0) + 1, subjectId: i.subjectId, actorId: i.actor.actorId, role: i.actor.role, at: i.at, from: i.current, to: i.target, prevHash: last?.hash ?? GENESIS_HASH }
  const entry: AuditEntry<S> = Object.freeze({ ...base, hash: entryHash(base) })
  return { ok: true, status: i.target, entry }
}

export type TrailIssue = 'seq-gap' | 'chain-broken' | 'time-regression' | 'wrong-subject' | 'step-not-allowed' | 'unknown-status' | 'hash-mismatch'

/** Status akhir dari jejak yang utuh, atau daftar masalah. Jejak kosong = status awal. */
export function verifyTrail<S extends string>(lc: Lifecycle<S>, subjectId: string, trail: readonly AuditEntry<S>[]):
  { ok: true; status: S } | { ok: false; issues: TrailIssue[] } {
  const issues = new Set<TrailIssue>()
  let status: S = lc.initial
  let prev: AuditEntry<S> | undefined
  trail.forEach((e, idx) => {
    if (e.subjectId !== subjectId) issues.add('wrong-subject')
    if (!known(lc, e.from) || !known(lc, e.to)) { issues.add('unknown-status'); return }
    if (e.seq !== idx + 1) issues.add('seq-gap')
    if (e.from !== status) issues.add('chain-broken')
    if (!lc.edges[e.from].includes(e.to)) issues.add('step-not-allowed')
    if (prev && Date.parse(e.at) < Date.parse(prev.at)) issues.add('time-regression')
    const { hash, ...rest } = e
    if (e.prevHash !== (prev?.hash ?? GENESIS_HASH) || hash !== entryHash(rest)) issues.add('hash-mismatch')
    status = e.to
    prev = e
  })
  return issues.size ? { ok: false, issues: [...issues].sort() } : { ok: true, status }
}
