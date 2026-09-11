import type { Role, User } from './store.js'

export type AccessSettings = { strStatus?: unknown } | undefined

const SELF_SERVICE_ROLES = new Set<Role>(['pasien', 'dokter', 'kontributor', 'verifikator'])

export function selfServiceRole(requested: unknown): Role {
  return typeof requested === 'string' && SELF_SERVICE_ROLES.has(requested as Role)
    ? requested as Role
    : 'pasien'
}

export function roleForLogin(existing: User | undefined, requested: unknown): Role {
  return existing?.role ?? selfServiceRole(requested)
}

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
