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
    || user.role === 'admin'
    || hasVerifiedProfessionalRole(user, settings, 'verifikator')
}
