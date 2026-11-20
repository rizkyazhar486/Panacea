import type { Role } from '../../lib/types.ts'

/** Domain reserved for on-device guest sessions; it can never collide with a real mailbox. */
export const DEVICE_GUEST_DOMAIN = 'guest.panacea.local'
export const DEVICE_GUEST_STORAGE_KEY = 'pmd_device_guest_v1'

export interface DeviceGuestProfile {
  readonly email: string
  readonly name: string
  readonly role: Role
}

/**
 * Profile for "continue on this device" when Google or the server is unavailable. It is always a plain patient
 * with a device-scoped identity: no owner, admin, clinician or named-person identity can be produced here.
 * Returns null when the device id is too short to be unique (fail closed instead of sharing one guest account).
 */
export function deviceGuestProfile(deviceId: string): DeviceGuestProfile | null {
  const id = (typeof deviceId === 'string' ? deviceId : '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24)
  if (id.length < 8) return null
  return { email: `guest-${id}@${DEVICE_GUEST_DOMAIN}`, name: 'Guest', role: 'pasien' }
}
