/**
 * Next-Gen Passwordless Authentication, Authenticator (RFC 6238 TOTP),
 * WebAuthn Passkey (TouchID / FaceID), and QR/Barcode Pairing helpers.
 *
 * Uses native browser Web Crypto (`crypto.subtle`) and WebAuthn
 * (`navigator.credentials`) without third-party dependencies or synthetic bypasses.
 */

import type { Account, Role } from '../../lib/types.ts'
import {
  PASSKEY_STORAGE_KEY,
  TOTP_STORAGE_KEY,
  REMEMBERED_ACCOUNTS_KEY,
  readJsonArray,
  writeJsonArray,
  rememberAccountProfile,
  listRememberedAccounts,
  type RememberedProfile,
} from './bootVitals.ts'

export {
  PASSKEY_STORAGE_KEY,
  TOTP_STORAGE_KEY,
  REMEMBERED_ACCOUNTS_KEY,
  rememberAccountProfile,
  listRememberedAccounts,
  type RememberedProfile,
}

export interface PasskeyRecord {
  readonly credentialIdB64: string
  readonly email: string
  readonly name: string
  readonly role: Role
  readonly createdAt: string
  readonly lastUsedAt?: string
}

export interface TotpEnrollment {
  readonly email: string
  readonly name: string
  readonly role: Role
  readonly secret: string
  readonly enabledAt: string
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function toB64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64Url(value: string): Uint8Array<ArrayBuffer> {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4))
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  const buf = new ArrayBuffer(bin.length)
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// ── RFC 6238 TOTP (Authenticator App: Google Authenticator / Authy / Apple Passwords) ──

export function encodeBase32(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''
  for (let i = 0; i < bytes.length; i += 1) {
    value = (value << 8) | bytes[i]
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output
}

export function decodeBase32(secret: string): Uint8Array<ArrayBuffer> {
  const clean = secret.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (let i = 0; i < clean.length; i += 1) {
    const idx = BASE32_ALPHABET.indexOf(clean[i])
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  const buf = new ArrayBuffer(bytes.length)
  const arr = new Uint8Array(buf)
  arr.set(bytes)
  return arr
}

export function generateTotpSecret(byteLength = 20): string {
  const arr = new Uint8Array(byteLength)
  crypto.getRandomValues(arr)
  return encodeBase32(arr)
}

export function buildOtpAuthUri({
  email,
  secret,
  issuer = 'PanaceaMed',
}: {
  readonly email: string
  readonly secret: string
  readonly issuer?: string
}): string {
  const cleanEmail = email.trim().toLowerCase()
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(cleanEmail)}`
  return `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

export async function computeTotpToken(
  secretBase32: string,
  nowMs = Date.now(),
  stepOffset = 0,
): Promise<string> {
  const keyBytes = decodeBase32(secretBase32)
  if (!keyBytes.length || typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto subtle HMAC is unavailable.')
  }
  const counter = Math.floor(nowMs / 1000 / 30) + stepOffset
  const msg = new ArrayBuffer(8)
  const view = new DataView(msg)
  view.setUint32(0, Math.floor(counter / 0x100000000), false)
  view.setUint32(4, counter >>> 0, false)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, msg))
  const offset = sig[sig.length - 1] & 0x0f
  const binCode =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff)
  return String(binCode % 1_000_000).padStart(6, '0')
}

export async function verifyTotpCode(
  secretBase32: string,
  code: string,
  nowMs = Date.now(),
): Promise<boolean> {
  const clean = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(clean)) return false
  for (const offset of [-1, 0, 1]) {
    const candidate = await computeTotpToken(secretBase32, nowMs, offset)
    if (candidate === clean) return true
  }
  return false
}

export function listTotpEnrollments(): TotpEnrollment[] {
  return readJsonArray<TotpEnrollment>(TOTP_STORAGE_KEY)
}

export function getTotpEnrollment(email: string): TotpEnrollment | null {
  const clean = email.trim().toLowerCase()
  return listTotpEnrollments().find((e) => e.email.toLowerCase() === clean) ?? null
}

export function saveTotpEnrollment(record: TotpEnrollment): void {
  const clean = record.email.trim().toLowerCase()
  const rest = listTotpEnrollments().filter((e) => e.email.toLowerCase() !== clean)
  writeJsonArray(TOTP_STORAGE_KEY, [{ ...record, email: clean }, ...rest])
}

export function removeTotpEnrollment(email: string): void {
  const clean = email.trim().toLowerCase()
  writeJsonArray(TOTP_STORAGE_KEY, listTotpEnrollments().filter((e) => e.email.toLowerCase() !== clean))
}

// ── WebAuthn Passkey (TouchID / FaceID / Device Biometric) ──

export function isWebAuthnAvailable(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.credentials)
}

export function listPasskeys(email?: string): PasskeyRecord[] {
  const all = readJsonArray<PasskeyRecord>(PASSKEY_STORAGE_KEY)
  if (!email) return all
  const clean = email.trim().toLowerCase()
  return all.filter((r) => r.email.toLowerCase() === clean)
}

export function removePasskey(credentialIdB64: string): void {
  writeJsonArray(
    PASSKEY_STORAGE_KEY,
    listPasskeys().filter((r) => r.credentialIdB64 !== credentialIdB64),
  )
}

function resolveRpEntity(): PublicKeyCredentialRpEntity {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'panaceamed.id'
  const validDomain = /^[a-z0-9.-]+$/i.test(hostname) && hostname !== '127.0.0.1'
  return validDomain ? { name: 'PanaceaMed', id: hostname } : { name: 'PanaceaMed' }
}

export async function enrollDevicePasskey(account: {
  readonly email: string
  readonly name: string
  readonly role: Role
}): Promise<{ readonly ok: true; readonly record: PasskeyRecord } | { readonly ok: false; readonly message: string }> {
  if (!isWebAuthnAvailable()) {
    return { ok: false, message: 'WebAuthn Passkey is not available on this browser or origin.' }
  }
  const email = account.email.trim().toLowerCase()
  if (!email) return { ok: false, message: 'Account email is required to enroll a Passkey.' }

  try {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)
    const userId = new TextEncoder().encode(email)
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: resolveRpEntity(),
        user: {
          id: userId,
          name: email,
          displayName: account.name?.trim() || email,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null

    if (!cred?.rawId) return { ok: false, message: 'Passkey registration cancelled.' }
    const record: PasskeyRecord = {
      credentialIdB64: toB64Url(new Uint8Array(cred.rawId)),
      email,
      name: account.name?.trim() || email.split('@')[0],
      role: account.role,
      createdAt: new Date().toISOString(),
    }
    const next = [record, ...listPasskeys().filter((r) => r.credentialIdB64 !== record.credentialIdB64)]
    writeJsonArray(PASSKEY_STORAGE_KEY, next)
    rememberAccountProfile(account)
    return { ok: true, record }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('NotAllowedError')) return { ok: false, message: 'TouchID / Passkey prompt was cancelled.' }
    return { ok: false, message: `Passkey setup could not complete: ${msg}` }
  }
}

export async function verifyDevicePasskey(
  email?: string,
): Promise<{ readonly ok: true; readonly record: PasskeyRecord } | { readonly ok: false; readonly message: string }> {
  if (!isWebAuthnAvailable()) {
    return { ok: false, message: 'WebAuthn Passkey is not available on this browser.' }
  }
  const enrolled = listPasskeys(email)
  if (!enrolled.length) {
    return { ok: false, message: 'No Passkey is enrolled on this device yet. Sign in once and tap Register Passkey in QR/Auth menu.' }
  }

  try {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: enrolled.map((r) => ({ id: fromB64Url(r.credentialIdB64), type: 'public-key' })),
        userVerification: 'preferred',
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null

    if (!assertion?.rawId) return { ok: false, message: 'Passkey verification cancelled.' }
    const matchedId = toB64Url(new Uint8Array(assertion.rawId))
    const found = enrolled.find((r) => r.credentialIdB64 === matchedId) ?? enrolled[0]
    const updated: PasskeyRecord = { ...found, lastUsedAt: new Date().toISOString() }
    writeJsonArray(PASSKEY_STORAGE_KEY, [
      updated,
      ...listPasskeys().filter((r) => r.credentialIdB64 !== found.credentialIdB64),
    ])
    return { ok: true, record: updated }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, message: msg.includes('NotAllowedError') ? 'TouchID / FaceID cancelled.' : msg }
  }
}

// ── QR & Barcode Access Pairing Token ──

export interface PairingTokenData {
  readonly v: 1
  readonly email: string
  readonly name: string
  readonly role: Role
  readonly patientId?: string
  readonly at: number
}

export function encodePairingQrPayload(profile: {
  readonly email: string
  readonly name: string
  readonly role: Role
  readonly patientId?: string
}): string {
  const payload: PairingTokenData = {
    v: 1,
    email: profile.email.trim().toLowerCase(),
    name: profile.name.trim(),
    role: profile.role,
    patientId: profile.patientId,
    at: Date.now(),
  }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  return `PANACEA:PAIR:v1:${toB64Url(bytes)}`
}

export function parsePairingQrPayload(raw: string): PairingTokenData | null {
  const text = raw.trim()
  if (!text.startsWith('PANACEA:PAIR:v1:')) return null
  try {
    const encoded = text.slice('PANACEA:PAIR:v1:'.length)
    const decoded = new TextDecoder().decode(fromB64Url(encoded))
    const parsed = JSON.parse(decoded) as Partial<PairingTokenData>
    if (
      parsed?.v === 1 &&
      typeof parsed.email === 'string' &&
      parsed.email.includes('@') &&
      typeof parsed.name === 'string' &&
      typeof parsed.role === 'string'
    ) {
      return parsed as PairingTokenData
    }
    return null
  } catch {
    return null
  }
}
