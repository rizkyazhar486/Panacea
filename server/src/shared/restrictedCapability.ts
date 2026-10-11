import { isRealCalendarDate } from './calendarDate.js'
// Kerangka umum akses kapabilitas terbatas: peran + lisensi profesional + audit.
// Netral terhadap isi kapabilitas — tidak tahu apa yang dilindungi, hanya SIAPA
// yang boleh. Fitur riset berisiko wajib melewati gerbang ini sebelum dirilis.
//
// Batas keras:
// - Status lisensi (STR/SIP) TIDAK diverifikasi otomatis di sini. Hanya status
//   yang sudah dicatat verifikator manusia (`verified`) yang dihitung.
// - Fail closed: tidak ada identitas, peran salah, lisensi tidak verified,
//   lisensi kedaluwarsa/tanggal tidak valid, atau kebijakan kosong → ditolak.
// - Waktu diinjeksikan (`now`); tidak ada Date.now() tersembunyi.
// - Catatan audit tidak memuat nomor lisensi maupun data pasien.

export type LicenceStatus = 'unverified' | 'pending' | 'verified' | 'revoked'

export interface Licence {
  status: LicenceStatus
  // ISO date (YYYY-MM-DD) habis berlaku; wajib untuk status verified.
  expiresOn?: string
}

export interface Principal {
  userId: string
  role: string // peran efektif (sudah melewati effectiveRoleForRequest)
  str?: Licence
  sip?: Licence
}

export interface CapabilityPolicy {
  capability: string
  allowedRoles: readonly string[]
  requireStr: boolean
  requireSip: boolean
}

export type DenyReason =
  | 'no-identity'
  | 'invalid-policy'
  | 'audit-unavailable'
  | 'role-not-allowed'
  | 'str-not-verified'
  | 'str-expired'
  | 'sip-not-verified'
  | 'sip-expired'

export type Decision = { allow: true } | { allow: false; reason: DenyReason }

function licenceProblem(l: Licence | undefined, today: string): 'not-verified' | 'expired' | null {
  if (!l || l.status !== 'verified') return 'not-verified'
  if (!l.expiresOn || !isRealCalendarDate(l.expiresOn)) return 'expired' // tanggal hilang/rusak = tidak boleh dianggap berlaku
  return l.expiresOn < today ? 'expired' : null // hari terakhir masih berlaku
}

export function decideAccess(principal: Principal | null | undefined, policy: CapabilityPolicy, now: Date): Decision {
  if (!policy || !policy.capability?.trim() || policy.allowedRoles.length === 0 || (!policy.requireStr && !policy.requireSip)) {
    return { allow: false, reason: 'invalid-policy' }
  }
  if (!principal || !principal.userId?.trim()) return { allow: false, reason: 'no-identity' }
  if (Number.isNaN(now.getTime())) return { allow: false, reason: 'invalid-policy' }
  if (!policy.allowedRoles.includes(principal.role)) return { allow: false, reason: 'role-not-allowed' }
  const today = now.toISOString().slice(0, 10)
  if (policy.requireStr) {
    const p = licenceProblem(principal.str, today)
    if (p) return { allow: false, reason: p === 'expired' ? 'str-expired' : 'str-not-verified' }
  }
  if (policy.requireSip) {
    const p = licenceProblem(principal.sip, today)
    if (p) return { allow: false, reason: p === 'expired' ? 'sip-expired' : 'sip-not-verified' }
  }
  return { allow: true }
}

export interface AuditRecord {
  at: string
  userId: string
  capability: string
  decision: 'allow' | 'deny'
  reason: DenyReason | null
}

export function buildAuditRecord(principal: Principal | null | undefined, policy: CapabilityPolicy, decision: Decision, now: Date): AuditRecord {
  return {
    at: now.toISOString(),
    userId: principal?.userId?.trim() || 'anonymous',
    capability: policy?.capability?.trim() || 'unknown',
    decision: decision.allow ? 'allow' : 'deny',
    reason: decision.allow ? null : decision.reason,
  }
}

// Keputusan dan audit tidak boleh terpisah: bila audit gagal ditulis, akses ditolak
// (tidak ada akses tanpa jejak).
export async function guardCapability(
  principal: Principal | null | undefined,
  policy: CapabilityPolicy,
  now: Date,
  writeAudit: (record: AuditRecord) => Promise<void>,
): Promise<Decision> {
  const decision = decideAccess(principal, policy, now)
  try {
    await writeAudit(buildAuditRecord(principal, policy, decision, now))
  } catch {
    return { allow: false, reason: 'audit-unavailable' }
  }
  return decision
}
