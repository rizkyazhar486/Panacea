import type { Role, User } from './store.js'

export type AccessSettings = { strStatus?: unknown } | undefined

const SELF_SERVICE_ROLES = new Set<Role>(['pasien', 'dokter', 'kontributor', 'verifikator'])

/**
 * Role requested by a brand-new account is onboarding intent, not a grant of
 * administrative privilege. `admin` and `owner` are never client-selectable.
 */
export function selfServiceRole(requested: unknown): Role {
  return typeof requested === 'string' && SELF_SERVICE_ROLES.has(requested as Role)
    ? requested as Role
    : 'pasien'
}

/**
 * Login must never mutate an existing account's server-owned role. For a new
 * account only the self-service onboarding roles are accepted.
 */
export function roleForLogin(existing: User | undefined, requested: unknown): Role {
  return existing?.role ?? selfServiceRole(requested)
}

/** Owner authority is anchored to deployment configuration, not a mutable DB role. */
export function isConfiguredOwner(user: Pick<User, 'email'>, ownerEmail: string): boolean {
  return user.email.trim().toLowerCase() === ownerEmail.trim().toLowerCase()
}

export function hasVerifiedProfessionalRole(
  user: Pick<User, 'role'>,
  settings: AccessSettings,
  role: 'dokter' | 'verifikator',
): boolean {
  return user.role === role && settings?.strStatus === 'verified'
}

/**
 * Derive the role visible to protected request handlers. The account can keep
 * its requested professional role for onboarding/profile display, while
 * backend privileges remain unavailable until the owner-approved verification
 * flag exists.
 *
 * Owner authority is derived from configured email, not from the mutable role
 * column. Conversely, legacy `owner`/`admin` values on any other account fail
 * closed so an account that exploited an older client-driven role bug does not
 * retain privilege after this fix.
 *
 * `allowOnboardingRole` is only for the professional-application submission
 * route so an unverified doctor/verifier can state which role is being reviewed.
 */
export function effectiveRoleForRequest(
  user: Pick<User, 'email' | 'role'>,
  settings: AccessSettings,
  ownerEmail: string,
  allowOnboardingRole = false,
): Role {
  if (isConfiguredOwner(user, ownerEmail)) return 'owner'
  if (allowOnboardingRole && ['dokter', 'kontributor', 'verifikator'].includes(user.role)) return user.role
  if (user.role === 'owner' || user.role === 'admin') return 'pasien'
  if (user.role === 'dokter' && settings?.strStatus !== 'verified') return 'pasien'
  if (user.role === 'verifikator' && settings?.strStatus !== 'verified') return 'pasien'
  return user.role
}

export function canReviewSecondOpinions(
  user: Pick<User, 'email' | 'role'>,
  settings: AccessSettings,
  ownerEmail: string,
): boolean {
  return isConfiguredOwner(user, ownerEmail) || hasVerifiedProfessionalRole(user, settings, 'dokter')
}

export function canSubmitSatusehat(
  user: Pick<User, 'email' | 'role'>,
  settings: AccessSettings,
  ownerEmail: string,
): boolean {
  return canReviewSecondOpinions(user, settings, ownerEmail)
}

export function canSendTargetNotification(
  user: Pick<User, 'email' | 'role'>,
  settings: AccessSettings,
  ownerEmail: string,
): boolean {
  return isConfiguredOwner(user, ownerEmail)
    || hasVerifiedProfessionalRole(user, settings, 'verifikator')
}
