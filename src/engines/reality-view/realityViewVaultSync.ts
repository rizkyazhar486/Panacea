import { isRealityViewState, type RealityViewState } from '../../types/realityView.ts'
import { OverrideMemoryStore, type OverrideAuditEntry } from './overrideMemoryStore.ts'

export interface EncryptedVaultRecord {
  readonly version: 1
  readonly alg: 'AES-GCM'
  readonly patientIdHash: string
  readonly ivBase64: string
  readonly ciphertextBase64: string
  readonly updatedAtIso: string
}

export interface VaultStorageAdapter {
  get(key: string): Promise<EncryptedVaultRecord | null>
  put(key: string, record: EncryptedVaultRecord): Promise<void>
  delete(key: string): Promise<void>
}

export interface VaultAuthSession {
  readonly googleAuthVerified: boolean
  readonly vaultUnlocked: boolean
  readonly sessionExpiresAtMs: number
  readonly providerUserId: string
}

export interface SerializedRealityViewSnapshot {
  readonly state: Omit<RealityViewState, 'nodes'> & {
    readonly nodes: Readonly<Record<string, Omit<RealityViewState['nodes'][string], 'shaderUniforms'> & {
      readonly shaderUniforms: {
        readonly pulseBpm?: number
        readonly conductionState?: readonly number[]
        readonly perfusionIntensity: number
        readonly highlightHue: string
      }
    }>>
  }
  readonly overrideAudit: readonly OverrideAuditEntry[]
}

const DB_NAME = 'panaceamed_reality_view_vault_v1'
const STORE_NAME = 'encrypted_snapshots'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function serializeState(state: RealityViewState, store: OverrideMemoryStore): SerializedRealityViewSnapshot {
  const nodes = Object.fromEntries(
    Object.entries(state.nodes).map(([meshId, node]) => [
      meshId,
      {
        ...node,
        shaderUniforms: {
          ...node.shaderUniforms,
          ...(node.shaderUniforms.conductionState
            ? { conductionState: Array.from(node.shaderUniforms.conductionState) }
            : {}),
        },
      },
    ]),
  )
  return {
    state: { ...state, nodes },
    overrideAudit: store.toJSON().audit,
  }
}

function hydrateState(snapshot: SerializedRealityViewSnapshot): {
  readonly state: RealityViewState
  readonly overrideStore: OverrideMemoryStore
} {
  const nodes = Object.fromEntries(
    Object.entries(snapshot.state.nodes).map(([meshId, node]) => [
      meshId,
      {
        ...node,
        shaderUniforms: {
          ...node.shaderUniforms,
          ...(Array.isArray(node.shaderUniforms.conductionState)
            ? { conductionState: Float32Array.from(node.shaderUniforms.conductionState) }
            : {}),
        },
      },
    ]),
  )
  const state: RealityViewState = { ...snapshot.state, nodes }
  if (!isRealityViewState(state)) {
    throw new Error('Decrypted Reality View snapshot failed schema validation')
  }
  const overrideStore = new OverrideMemoryStore()
  for (const entry of snapshot.overrideAudit ?? []) {
    overrideStore.recordOverride(entry.ruleKey, entry.severity, entry.hardSafetyLock, entry.reason)
  }
  return { state, overrideStore }
}

/** Derives a 256-bit AES-GCM CryptoKey via PBKDF2 from an unlocked vault secret + salt. */
export async function deriveVaultAesKey(passphrase: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  if (!passphrase || passphrase.length < 12) {
    throw new RangeError('Vault key derivation requires a non-empty unlocked secret (>= 12 chars)')
  }
  const raw = new TextEncoder().encode(passphrase)
  const baseKey = await crypto.subtle.importKey('raw', raw, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function hashPatientStorageKey(patientId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`rv-vault:${patientId}`))
  return toBase64(new Uint8Array(digest)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
}

export async function saveEncryptedRealityViewSnapshot(params: {
  readonly state: RealityViewState
  readonly overrideStore: OverrideMemoryStore
  readonly vaultKey: CryptoKey
  readonly storage: VaultStorageAdapter
  readonly nowIso?: string
}): Promise<EncryptedVaultRecord> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(serializeState(params.state, params.overrideStore)))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, params.vaultKey, plaintext)
  const patientIdHash = await hashPatientStorageKey(params.state.patientId)
  const record: EncryptedVaultRecord = {
    version: 1,
    alg: 'AES-GCM',
    patientIdHash,
    ivBase64: toBase64(iv),
    ciphertextBase64: toBase64(new Uint8Array(encrypted)),
    updatedAtIso: params.nowIso ?? new Date().toISOString(),
  }
  await params.storage.put(patientIdHash, record)
  return record
}

export async function loadEncryptedRealityViewSnapshot(params: {
  readonly patientId: string
  readonly vaultKey: CryptoKey
  readonly storage: VaultStorageAdapter
}): Promise<{ readonly state: RealityViewState; readonly overrideStore: OverrideMemoryStore; readonly updatedAtIso: string } | null> {
  const key = await hashPatientStorageKey(params.patientId)
  const record = await params.storage.get(key)
  if (!record) return null
  const iv = fromBase64(record.ivBase64)
  const ciphertext = fromBase64(record.ciphertextBase64)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    params.vaultKey,
    ciphertext as BufferSource,
  )
  const parsed = JSON.parse(new TextDecoder().decode(decrypted)) as SerializedRealityViewSnapshot
  const hydrated = hydrateState(parsed)
  return { ...hydrated, updatedAtIso: record.updatedAtIso }
}

/**
 * Instant offline boot: hydrates `quiet` mode directly from encrypted local
 * cache without blocking on network auth or remote sync.
 */
export async function bootRealityViewOfflineFirst(params: {
  readonly patientId: string
  readonly isOnline: boolean
  readonly vaultKey: CryptoKey
  readonly storage: VaultStorageAdapter
}): Promise<{
  readonly hydratedFromCache: boolean
  readonly offlineIndicator: boolean
  readonly elapsedMs: number
  readonly state: RealityViewState | null
  readonly overrideStore: OverrideMemoryStore
}> {
  const started = performance.now()
  const cached = await loadEncryptedRealityViewSnapshot({
    patientId: params.patientId,
    vaultKey: params.vaultKey,
    storage: params.storage,
  })
  const elapsedMs = Math.max(0, Math.round((performance.now() - started) * 100) / 100)
  if (!cached) {
    return {
      hydratedFromCache: false,
      offlineIndicator: !params.isOnline,
      elapsedMs,
      state: null,
      overrideStore: new OverrideMemoryStore(),
    }
  }
  return {
    hydratedFromCache: true,
    offlineIndicator: !params.isOnline,
    elapsedMs,
    state: { ...cached.state, mode: 'quiet' },
    overrideStore: cached.overrideStore,
  }
}

/**
 * Hard security gate for ALL outbound SATUSEHAT/FHIR R4 sync & MedGemma
 * inference calls. Requires verified persistent Google Auth + unlocked vault.
 */
export function assertOutboundClinicalSyncAuthorized(
  session: VaultAuthSession | null | undefined,
  target: 'satusehat_fhir_r4' | 'medgemma_inference',
  nowMs = Date.now(),
): { readonly authorized: true; readonly target: string } | { readonly authorized: false; readonly reason: string } {
  if (!session || !session.providerUserId.trim()) {
    return { authorized: false, reason: `${target} blocked: missing authenticated user session` }
  }
  if (!session.googleAuthVerified) {
    return { authorized: false, reason: `${target} blocked: persistent Google Auth verification required` }
  }
  if (!session.vaultUnlocked) {
    return { authorized: false, reason: `${target} blocked: cryptographic identity vault is locked` }
  }
  if (!Number.isFinite(session.sessionExpiresAtMs) || session.sessionExpiresAtMs <= nowMs) {
    return { authorized: false, reason: `${target} blocked: session expired` }
  }
  return { authorized: true, target }
}

/** Strict sanitizer for OCR/FHIR clinical text interpolation (zero HTML injection). */
export function sanitizeClinicalText(raw: string): string {
  return String(raw ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export class MemoryVaultStorageAdapter implements VaultStorageAdapter {
  readonly #records = new Map<string, EncryptedVaultRecord>()
  async get(key: string): Promise<EncryptedVaultRecord | null> { return this.#records.get(key) ?? null }
  async put(key: string, record: EncryptedVaultRecord): Promise<void> { this.#records.set(key, record) }
  async delete(key: string): Promise<void> { this.#records.delete(key) }
}

export function createIndexedDbVaultAdapter(): VaultStorageAdapter {
  if (typeof indexedDB === 'undefined') return new MemoryVaultStorageAdapter()
  const openDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) req.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return {
    async get(key) {
      const db = await openDb()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).get(key)
        req.onsuccess = () => resolve((req.result as EncryptedVaultRecord | undefined) ?? null)
        req.onerror = () => reject(req.error)
      })
    },
    async put(key, record) {
      const db = await openDb()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).put(record, key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    },
    async delete(key) {
      const db = await openDb()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).delete(key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    },
  }
}
