import type { Account } from './types.ts'

export type VisitRuntimeIdentityFailure =
  | 'not-authenticated'
  | 'clinician-role-required'
  | 'patient-required'

export type VisitRuntimeIdentityResolution =
  | {
      ok: true
      clinicianId: string
      subjectId: string
      source: 'authenticated-account'
    }
  | {
      ok: false
      reason: VisitRuntimeIdentityFailure
    }

/**
 * Resolve the two identities that may enter VisitOperatingState.
 *
 * The clinician identity is intentionally derived only from the authenticated
 * account. Display names, room names and local doctor settings are not identity
 * sources. The active patient id is the subject authority for this client-side
 * runtime boundary.
 */
export function resolveVisitRuntimeIdentity(
  account: Pick<Account, 'email' | 'role'> | null | undefined,
  activePatientId: string,
): VisitRuntimeIdentityResolution {
  const email = account?.email.trim().toLowerCase()
  if (!email) return { ok: false, reason: 'not-authenticated' }
  if (account?.role !== 'dokter') return { ok: false, reason: 'clinician-role-required' }

  const subjectId = activePatientId.trim()
  if (!subjectId || subjectId === 'none') return { ok: false, reason: 'patient-required' }

  return {
    ok: true,
    clinicianId: `account:${email}`,
    subjectId,
    source: 'authenticated-account',
  }
}
