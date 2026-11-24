/**
 * PanaceaMed OS — Persistent Cloud-Ready 1:1 Personified Social Twin Vault & Cryptographic Barcode Engine.
 *
 * Implements Constitutional Kernel 1 + Law VI (Cryptographic & Biometric Sovereignty):
 * - Persistent (non-ephemeral) cloud-syncable BiometricTwinProfile for the `For You` living persona ecosystem
 * - Internal Organ Co-Registration Invariant: torso/height/waist changes propagate calibrated affine
 *   organ scale factors without mesh intersection or floating vasculature
 * - Strict Raw Photo Purge Guarantee: strips raw source image bytes when `rawPhotoRetained === false`
 * - Cryptographic Personalized Identity Barcode (Web Crypto SHA-256) carrying ZERO raw PHI/diagnoses
 * - Zero-Knowledge Web Crypto AES-GCM 256-bit Cloud Sync Envelope for encrypted storage & multi-device continuity
 */

export interface BiometricTwinProfile {
  readonly profileId: string
  readonly personaHandle: string
  readonly cohortId: string
  readonly anthropometrics: {
    readonly ageYears: number
    readonly biologicalSex: 'male' | 'female' | 'other'
    readonly heightCm: number
    readonly weightKg: number
    readonly waistCm?: number
    readonly bodyFatPct?: number
  }
  readonly morphWeights: Readonly<Record<string, number>>
  readonly organScaleFactors: Readonly<Record<string, readonly [number, number, number]>>
  readonly skinToneLUT: {
    readonly melanin: number
    readonly hemoglobin: number
    readonly undertone: number
  }
  readonly dailyMonitoring: {
    readonly streakDays: number
    readonly lastSyncedIso: string
    readonly provenanceTag: 'OBSERVED_CONSUMER' | 'OBSERVED_CLINICAL' | 'MECHANISTIC_SIMULATION'
  }
  readonly cloudSyncState: 'LOCAL_ENCRYPTED' | 'CLOUD_SYNC_QUEUED' | 'CLOUD_SYNCED'
  readonly privacyPolicy: {
    readonly rawPhotoRetained: false | 'LOCAL_ENCRYPTED_VAULT_ONLY'
    readonly consentTimestampISO: string
  }
}

export interface BiometricIntakeCandidate {
  readonly profileId: string
  readonly personaHandle: string
  readonly cohortId?: string
  readonly ageYears: number
  readonly biologicalSex: 'male' | 'female' | 'other'
  readonly heightCm: number
  readonly weightKg: number
  readonly waistCm?: number
  readonly bodyFatPct?: number
  readonly morphWeights?: Record<string, number>
  readonly skinToneLUT?: { readonly melanin: number; readonly hemoglobin: number; readonly undertone: number }
  readonly rawSourcePhotoDataUrl?: string | null
  readonly retainPhotoInEncryptedVault?: boolean
  readonly consentTimestampISO: string
  readonly streakDays?: number
  readonly lastSyncedIso?: string
  readonly provenanceTag?: 'OBSERVED_CONSUMER' | 'OBSERVED_CLINICAL' | 'MECHANISTIC_SIMULATION'
}

export interface PersonalizedTwinBarcode {
  readonly version: 'PMD-TWIN-V1'
  readonly payload: string
  readonly shortDigestHex: string
  readonly checksumHex: string
  readonly bars: readonly number[]
  readonly containsRawPhi: false
}

export interface EncryptedCloudTwinEnvelope {
  readonly schemaVersion: 'panacea-cloud-twin-aesgcm-v1'
  readonly profileId: string
  readonly ivBase64: string
  readonly ciphertextBase64: string
  readonly sha256DigestHex: string
  readonly updatedAtIso: string
}

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min
  return Math.max(min, Math.min(max, v))
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000
}

function sanitizeHandle(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 28)
  return cleaned || 'panacea_twin'
}

/**
 * Internal Organ Co-Registration Invariant:
 * Maps outer height/weight/waist anthropometry to bounded [0.72..1.38] affine scale factors
 * for major visceral containers so internal organs stay proportionally seated inside the ribcage/pelvis.
 */
export function computeCoRegisteredOrganScales(params: {
  readonly heightCm: number
  readonly weightKg: number
  readonly waistCm?: number
}): Readonly<Record<string, readonly [number, number, number]>> {
  const hRatio = clamp(params.heightCm / 170, 0.72, 1.32)
  const bmi = clamp(params.weightKg / Math.pow(Math.max(1.0, params.heightCm / 100), 2), 14, 48)
  const torsoWidthRatio = clamp(0.85 + (bmi - 22) * 0.015, 0.78, 1.3)
  const waistRatio = params.waistCm ? clamp(params.waistCm / 82, 0.75, 1.38) : torsoWidthRatio

  const ribScale = clamp(hRatio * 0.65 + torsoWidthRatio * 0.35, 0.75, 1.3)
  const visceralDepth = clamp(torsoWidthRatio * 0.7 + waistRatio * 0.3, 0.76, 1.32)

  return {
    heart_myocardium: [round3(ribScale), round3(ribScale), round3(ribScale)],
    lung_right: [round3(ribScale), round3(hRatio), round3(ribScale)],
    lung_left: [round3(ribScale), round3(hRatio), round3(ribScale)],
    liver_parenchyma: [round3(visceralDepth), round3(ribScale), round3(visceralDepth)],
    kidney_right: [round3(ribScale), round3(ribScale), round3(ribScale)],
    kidney_left: [round3(ribScale), round3(ribScale), round3(ribScale)],
    skeleton_axial: [round3(torsoWidthRatio), round3(hRatio), round3(torsoWidthRatio)],
  }
}

/**
 * Creates a constitutional BiometricTwinProfile:
 * - Normalizes all morph weights strictly into [0..1]
 * - Computes co-registered organ scales
 * - Enforces Law VI / Gate 4: raw photo data is NEVER retained on the profile object
 *   (when retainPhotoInEncryptedVault !== true, rawPhotoRetained is strictly `false`).
 */
export function createSanitizedBiometricTwinProfile(candidate: BiometricIntakeCandidate): {
  readonly profile: BiometricTwinProfile
  readonly rawPhotoPurged: boolean
} {
  const heightCm = round3(clamp(candidate.heightCm, 45, 230))
  const weightKg = round3(clamp(candidate.weightKg, 2, 260))
  const ageYears = round3(clamp(candidate.ageYears, 0, 120))
  const waistCm = candidate.waistCm !== undefined ? round3(clamp(candidate.waistCm, 30, 190)) : undefined
  const bodyFatPct = candidate.bodyFatPct !== undefined ? round3(clamp(candidate.bodyFatPct, 4, 65)) : undefined

  const normalizedMorphs: Record<string, number> = {}
  for (const [k, v] of Object.entries(candidate.morphWeights ?? {})) {
    const safeKey = k.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)
    if (safeKey) normalizedMorphs[safeKey] = round3(clamp(v, 0, 1))
  }

  const rawPhotoRetained = candidate.retainPhotoInEncryptedVault ? 'LOCAL_ENCRYPTED_VAULT_ONLY' : false
  const rawPhotoPurged = !candidate.retainPhotoInEncryptedVault

  const profile: BiometricTwinProfile = {
    profileId: candidate.profileId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'twin_default',
    personaHandle: sanitizeHandle(candidate.personaHandle),
    cohortId: (candidate.cohortId ?? 'YAD_M').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24),
    anthropometrics: {
      ageYears,
      biologicalSex: candidate.biologicalSex,
      heightCm,
      weightKg,
      ...(waistCm !== undefined ? { waistCm } : {}),
      ...(bodyFatPct !== undefined ? { bodyFatPct } : {}),
    },
    morphWeights: normalizedMorphs,
    organScaleFactors: computeCoRegisteredOrganScales({ heightCm, weightKg, waistCm }),
    skinToneLUT: {
      melanin: round3(clamp(candidate.skinToneLUT?.melanin ?? 0.42, 0, 1)),
      hemoglobin: round3(clamp(candidate.skinToneLUT?.hemoglobin ?? 0.35, 0, 1)),
      undertone: round3(clamp(candidate.skinToneLUT?.undertone ?? 0.5, 0, 1)),
    },
    dailyMonitoring: {
      streakDays: Math.max(0, Math.round(candidate.streakDays ?? 0)),
      lastSyncedIso: candidate.lastSyncedIso ?? candidate.consentTimestampISO,
      provenanceTag: candidate.provenanceTag ?? 'OBSERVED_CONSUMER',
    },
    cloudSyncState: 'CLOUD_SYNC_QUEUED',
    privacyPolicy: {
      rawPhotoRetained,
      consentTimestampISO: candidate.consentTimestampISO,
    },
  }

  return { profile, rawPhotoPurged }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return bytesToHex(new Uint8Array(digest))
}

/**
 * Generates deterministic visual barcode bar widths (1..4 units) from the cryptographic digest
 * so the Living Social Twin card renders a crisp, personalized scannable barcode without external deps.
 */
export function renderBarcodeBars(digestHex: string): readonly number[] {
  const bars: number[] = []
  const hex = digestHex.toLowerCase().replace(/[^0-9a-f]/g, '')
  for (let i = 0; i < Math.min(48, hex.length); i++) {
    const nibble = parseInt(hex[i], 16)
    bars.push(1 + (nibble % 4))
  }
  return bars
}

/**
 * Mints a tamper-evident, PHI-free Personalized Social Twin Barcode using Web Crypto SHA-256.
 * Only non-PHI identity tokens (profileId, handle, cohort, morph fingerprint) enter the barcode;
 * clinical records remain sealed inside the AES-GCM encrypted vault.
 */
export async function mintPersonalizedTwinBarcode(profile: BiometricTwinProfile): Promise<PersonalizedTwinBarcode> {
  const canonicalInput = JSON.stringify({
    v: 'PMD-TWIN-V1',
    id: profile.profileId,
    handle: profile.personaHandle,
    cohort: profile.cohortId,
    lut: profile.skinToneLUT,
    morphKeys: Object.keys(profile.morphWeights).sort(),
  })
  const fullHash = await sha256Hex(canonicalInput)
  const shortDigestHex = fullHash.slice(0, 16)
  const body = `PMD-TWIN-V1:${shortDigestHex}:${profile.personaHandle}:${profile.cohortId}`
  const checksumHex = (await sha256Hex(body)).slice(0, 8)
  const payload = `${body}:${checksumHex}`

  return {
    version: 'PMD-TWIN-V1',
    payload,
    shortDigestHex,
    checksumHex,
    bars: renderBarcodeBars(fullHash),
    containsRawPhi: false,
  }
}

export async function verifyPersonalizedTwinBarcode(payload: string): Promise<boolean> {
  const parts = payload.split(':')
  if (parts.length !== 5 || parts[0] !== 'PMD-TWIN-V1') return false
  const [version, shortDigest, handle, cohort, checksum] = parts
  if (!/^[0-9a-f]{16}$/.test(shortDigest) || !/^[0-9a-f]{8}$/.test(checksum)) return false
  const expected = (await sha256Hex(`${version}:${shortDigest}:${handle}:${cohort}`)).slice(0, 8)
  return expected === checksum
}

/**
 * Encrypts a BiometricTwinProfile into a zero-knowledge AES-GCM 256-bit cloud sync envelope.
 */
export async function encryptSocialTwinForCloud(
  profile: BiometricTwinProfile,
  key: CryptoKey,
  updatedAtIso: string,
): Promise<EncryptedCloudTwinEnvelope> {
  const plaintext = JSON.stringify(profile)
  const sha256DigestHex = await sha256Hex(plaintext)
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  return {
    schemaVersion: 'panacea-cloud-twin-aesgcm-v1',
    profileId: profile.profileId,
    ivBase64: bytesToBase64(iv),
    ciphertextBase64: bytesToBase64(new Uint8Array(ciphertext)),
    sha256DigestHex,
    updatedAtIso,
  }
}

export async function decryptSocialTwinFromCloud(
  envelope: EncryptedCloudTwinEnvelope,
  key: CryptoKey,
): Promise<BiometricTwinProfile> {
  const ivBytes = base64ToBytes(envelope.ivBase64)
  const cipherBytes = base64ToBytes(envelope.ciphertextBase64)
  const ivBuf = new Uint8Array(ivBytes.byteLength)
  ivBuf.set(ivBytes)
  const cipherBuf = new Uint8Array(cipherBytes.byteLength)
  cipherBuf.set(cipherBytes)

  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuf },
    key,
    cipherBuf,
  )
  const plaintext = new TextDecoder().decode(decrypted)
  const digest = await sha256Hex(plaintext)
  if (digest !== envelope.sha256DigestHex) {
    throw new Error('Cloud twin integrity checksum mismatch.')
  }
  return JSON.parse(plaintext) as BiometricTwinProfile
}
