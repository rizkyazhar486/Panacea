/**
 * Persistent geospatial cache + sync queue for source-backed Environment OS data.
 *
 * This layer stores payload bytes only after the existing offline-cache provenance
 * contract is valid and the declared SHA-256 digest matches the payload.
 */

import {
  assessEnvironmentOfflineCacheEntry,
  validateEnvironmentOfflineCacheEntry,
  type EnvironmentOfflineCacheAssessment,
  type EnvironmentOfflineCacheEntry,
} from './environmentOfflineCache.ts'
import type { EnvironmentSourceAdapter } from './environmentSourceAdapter.ts'

export type EnvironmentSpatialDescriptor =
  | { kind: 'global' }
  | { kind: 'tile'; z: number; x: number; y: number }
  | { kind: 'bbox'; west: number; south: number; east: number; north: number }

export type EnvironmentGeospatialPrivacyClass = 'public-source' | 'location-derived'

export interface EnvironmentGeospatialCacheRecord {
  metadata: EnvironmentOfflineCacheEntry
  storageKey: string
  contentType: string
  spatial: EnvironmentSpatialDescriptor
  lastAccessedAt: string
  privacyClass: EnvironmentGeospatialPrivacyClass
  consentScopeRef?: string
  pinned?: boolean
}

export type EnvironmentGeospatialSyncOperation = 'fetch' | 'revalidate' | 'delete-local'
export type EnvironmentGeospatialSyncState = 'pending' | 'in-flight' | 'failed'

export interface EnvironmentGeospatialSyncTask {
  taskId: string
  cacheId: string
  adapterId: string
  sourceVersion: string
  operation: EnvironmentGeospatialSyncOperation
  state: EnvironmentGeospatialSyncState
  priority: number
  attempts: number
  enqueuedAt: string
  nextAttemptAt: string
  lastError?: string
}

export interface EnvironmentGeospatialStoredEntry {
  record: EnvironmentGeospatialCacheRecord
  payload: Uint8Array
}

export interface EnvironmentGeospatialPersistence {
  getEntry(cacheId: string): Promise<EnvironmentGeospatialStoredEntry | null>
  putEntry(entry: EnvironmentGeospatialStoredEntry): Promise<void>
  deleteEntry(cacheId: string): Promise<void>
  listRecords(): Promise<readonly EnvironmentGeospatialCacheRecord[]>
  getSyncTask(taskId: string): Promise<EnvironmentGeospatialSyncTask | null>
  putSyncTask(task: EnvironmentGeospatialSyncTask): Promise<void>
  deleteSyncTask(taskId: string): Promise<void>
  listSyncTasks(): Promise<readonly EnvironmentGeospatialSyncTask[]>
}

export interface EnvironmentGeospatialReadResult {
  admitted: boolean
  errors: readonly string[]
  payload: Uint8Array | null
  record: EnvironmentGeospatialCacheRecord | null
  assessment: EnvironmentOfflineCacheAssessment | null
}

export interface EnvironmentGeospatialEvictionPolicy {
  maxBytes: number
  maxEntries: number
  protectPinned: boolean
}

export interface EnvironmentGeospatialEvictionPlan {
  evictCacheIds: readonly string[]
  totalBytesBefore: number
  totalBytesAfter: number
  totalEntriesBefore: number
  totalEntriesAfter: number
  satisfied: boolean
}

const SHA256_HEX = /^[a-f0-9]{64}$/i
const DB_NAME = 'panacea-environment-geospatial'
const DB_VERSION = 1
const ENTRY_STORE = 'entries'
const SYNC_STORE = 'syncQueue'

const finiteTime = (value: string): boolean => Number.isFinite(Date.parse(value))

function validateSpatialDescriptor(spatial: EnvironmentSpatialDescriptor): string[] {
  if (spatial.kind === 'global') return []

  if (spatial.kind === 'tile') {
    const errors: string[] = []
    if (!Number.isInteger(spatial.z) || spatial.z < 0 || spatial.z > 24) errors.push('spatial.z')
    const width = Number.isInteger(spatial.z) && spatial.z >= 0 && spatial.z <= 24
      ? 2 ** spatial.z
      : 0
    if (!Number.isInteger(spatial.x) || spatial.x < 0 || spatial.x >= width) errors.push('spatial.x')
    if (!Number.isInteger(spatial.y) || spatial.y < 0 || spatial.y >= width) errors.push('spatial.y')
    return errors
  }

  const errors: string[] = []
  if (!Number.isFinite(spatial.west) || spatial.west < -180 || spatial.west > 180) errors.push('spatial.west')
  if (!Number.isFinite(spatial.east) || spatial.east < -180 || spatial.east > 180) errors.push('spatial.east')
  if (!Number.isFinite(spatial.south) || spatial.south < -90 || spatial.south > 90) errors.push('spatial.south')
  if (!Number.isFinite(spatial.north) || spatial.north < -90 || spatial.north > 90) errors.push('spatial.north')
  if (Number.isFinite(spatial.south) && Number.isFinite(spatial.north) && spatial.south >= spatial.north) {
    errors.push('spatial.latitude-order')
  }
  if (Number.isFinite(spatial.west) && Number.isFinite(spatial.east) && spatial.west === spatial.east) {
    errors.push('spatial.zero-width')
  }
  return errors
}

export function validateEnvironmentGeospatialCacheRecord(
  adapter: EnvironmentSourceAdapter,
  record: EnvironmentGeospatialCacheRecord,
): string[] {
  const errors = [...validateEnvironmentOfflineCacheEntry(adapter, record.metadata)]

  if (!record.storageKey?.trim()) errors.push('storageKey')
  if (!record.contentType?.trim()) errors.push('contentType')
  if (!finiteTime(record.lastAccessedAt)) errors.push('lastAccessedAt')
  errors.push(...validateSpatialDescriptor(record.spatial))

  const cachedAtMs = Date.parse(record.metadata.cachedAt)
  const accessedAtMs = Date.parse(record.lastAccessedAt)
  if (Number.isFinite(cachedAtMs) && Number.isFinite(accessedAtMs) && accessedAtMs < cachedAtMs) {
    errors.push('access-before-cache')
  }

  if (record.privacyClass === 'location-derived' && !record.consentScopeRef?.trim()) {
    errors.push('consentScopeRef')
  }

  if (!SHA256_HEX.test(record.metadata.payloadSha256)) errors.push('payloadSha256')
  return [...new Set(errors)]
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

export async function sha256Hex(payload: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto SHA-256 is unavailable')
  }
  const copy = new Uint8Array(payload)
  return hex(await globalThis.crypto.subtle.digest('SHA-256', copy))
}

export async function persistEnvironmentGeospatialPayload(
  persistence: EnvironmentGeospatialPersistence,
  adapter: EnvironmentSourceAdapter,
  record: EnvironmentGeospatialCacheRecord,
  payload: Uint8Array,
): Promise<void> {
  const errors = validateEnvironmentGeospatialCacheRecord(adapter, record)
  if (payload.byteLength !== record.metadata.byteLength) errors.push('payload-byte-length')

  const digest = await sha256Hex(payload)
  if (digest.toLowerCase() !== record.metadata.payloadSha256.toLowerCase()) {
    errors.push('payload-digest')
  }

  if (errors.length) {
    throw new Error('Environment geospatial payload rejected: ' + [...new Set(errors)].join(','))
  }

  await persistence.putEntry({
    record: Object.freeze({ ...record, metadata: Object.freeze({ ...record.metadata }) }),
    payload: new Uint8Array(payload),
  })
}

export async function readEnvironmentGeospatialPayload(
  persistence: EnvironmentGeospatialPersistence,
  adapter: EnvironmentSourceAdapter,
  cacheId: string,
  now: string,
): Promise<EnvironmentGeospatialReadResult> {
  const stored = await persistence.getEntry(cacheId)
  if (!stored) {
    return Object.freeze({
      admitted: false,
      errors: Object.freeze(['cache-miss']),
      payload: null,
      record: null,
      assessment: null,
    })
  }

  const errors = validateEnvironmentGeospatialCacheRecord(adapter, stored.record)
  if (stored.payload.byteLength !== stored.record.metadata.byteLength) errors.push('payload-byte-length')

  const digest = await sha256Hex(stored.payload)
  if (digest.toLowerCase() !== stored.record.metadata.payloadSha256.toLowerCase()) {
    errors.push('payload-digest')
  }

  const assessment = assessEnvironmentOfflineCacheEntry(adapter, stored.record.metadata, now)
  if (!assessment.historicalReadable) errors.push('not-historically-readable')

  const uniqueErrors = [...new Set(errors)]
  if (uniqueErrors.length) {
    return Object.freeze({
      admitted: false,
      errors: Object.freeze(uniqueErrors),
      payload: null,
      record: stored.record,
      assessment,
    })
  }

  const nowMs = Date.parse(now)
  const accessedMs = Date.parse(stored.record.lastAccessedAt)
  if (Number.isFinite(nowMs) && (!Number.isFinite(accessedMs) || nowMs > accessedMs)) {
    await persistence.putEntry({
      record: { ...stored.record, lastAccessedAt: now },
      payload: stored.payload,
    })
  }

  return Object.freeze({
    admitted: true,
    errors: Object.freeze([]),
    payload: new Uint8Array(stored.payload),
    record: stored.record,
    assessment,
  })
}

function adapterMap(adapters: readonly EnvironmentSourceAdapter[]): Map<string, EnvironmentSourceAdapter> {
  return new Map(adapters.map((adapter) => [adapter.adapterId, adapter]))
}

function evictionRank(
  record: EnvironmentGeospatialCacheRecord,
  adapters: Map<string, EnvironmentSourceAdapter>,
  now: string,
): number {
  const adapter = adapters.get(record.metadata.adapterId)
  if (!adapter) return 0
  if (validateEnvironmentGeospatialCacheRecord(adapter, record).length) return 0
  const assessment = assessEnvironmentOfflineCacheEntry(adapter, record.metadata, now)
  if (!assessment.historicalReadable) return 1
  if (!assessment.usableAsCurrentSourceContext) return 2
  return 3
}

export function planEnvironmentGeospatialEviction(
  records: readonly EnvironmentGeospatialCacheRecord[],
  adapters: readonly EnvironmentSourceAdapter[],
  policy: EnvironmentGeospatialEvictionPolicy,
  now: string,
): EnvironmentGeospatialEvictionPlan {
  const maxBytes = Number.isFinite(policy.maxBytes) && policy.maxBytes >= 0 ? policy.maxBytes : 0
  const maxEntries = Number.isInteger(policy.maxEntries) && policy.maxEntries >= 0 ? policy.maxEntries : 0
  const map = adapterMap(adapters)

  let remainingBytes = records.reduce((sum, record) => sum + Math.max(0, record.metadata.byteLength), 0)
  let remainingEntries = records.length
  const beforeBytes = remainingBytes
  const beforeEntries = remainingEntries

  const candidates = [...records].sort((a, b) => {
    const rankDelta = evictionRank(a, map, now) - evictionRank(b, map, now)
    if (rankDelta) return rankDelta
    const timeDelta = Date.parse(a.lastAccessedAt) - Date.parse(b.lastAccessedAt)
    if (Number.isFinite(timeDelta) && timeDelta) return timeDelta
    return b.metadata.byteLength - a.metadata.byteLength
  })

  const evict: string[] = []
  for (const record of candidates) {
    if (remainingBytes <= maxBytes && remainingEntries <= maxEntries) break
    if (policy.protectPinned && record.pinned) continue
    evict.push(record.metadata.cacheId)
    remainingBytes -= Math.max(0, record.metadata.byteLength)
    remainingEntries -= 1
  }

  return Object.freeze({
    evictCacheIds: Object.freeze(evict),
    totalBytesBefore: beforeBytes,
    totalBytesAfter: Math.max(0, remainingBytes),
    totalEntriesBefore: beforeEntries,
    totalEntriesAfter: Math.max(0, remainingEntries),
    satisfied: remainingBytes <= maxBytes && remainingEntries <= maxEntries,
  })
}

export async function applyEnvironmentGeospatialEviction(
  persistence: EnvironmentGeospatialPersistence,
  plan: EnvironmentGeospatialEvictionPlan,
): Promise<void> {
  for (const cacheId of plan.evictCacheIds) {
    await persistence.deleteEntry(cacheId)
  }
}

export function validateEnvironmentGeospatialSyncTask(task: EnvironmentGeospatialSyncTask): string[] {
  const errors: string[] = []
  if (!task.taskId?.trim()) errors.push('taskId')
  if (!task.cacheId?.trim()) errors.push('cacheId')
  if (!task.adapterId?.trim()) errors.push('adapterId')
  if (!task.sourceVersion?.trim()) errors.push('sourceVersion')
  if (!Number.isInteger(task.priority) || task.priority < 0 || task.priority > 100) errors.push('priority')
  if (!Number.isInteger(task.attempts) || task.attempts < 0) errors.push('attempts')
  if (!finiteTime(task.enqueuedAt)) errors.push('enqueuedAt')
  if (!finiteTime(task.nextAttemptAt)) errors.push('nextAttemptAt')
  return [...new Set(errors)]
}

export async function enqueueEnvironmentGeospatialSyncTask(
  persistence: EnvironmentGeospatialPersistence,
  task: EnvironmentGeospatialSyncTask,
): Promise<void> {
  const errors = validateEnvironmentGeospatialSyncTask(task)
  if (errors.length) throw new Error('Environment geospatial sync task rejected: ' + errors.join(','))
  await persistence.putSyncTask(Object.freeze({ ...task }))
}

export function selectDueEnvironmentGeospatialSyncTasks(
  tasks: readonly EnvironmentGeospatialSyncTask[],
  now: string,
  limit = 1,
): EnvironmentGeospatialSyncTask[] {
  const nowMs = Date.parse(now)
  if (!Number.isFinite(nowMs) || !Number.isInteger(limit) || limit <= 0) return []

  return tasks
    .filter((task) =>
      validateEnvironmentGeospatialSyncTask(task).length === 0
      && task.state !== 'in-flight'
      && Date.parse(task.nextAttemptAt) <= nowMs)
    .sort((a, b) =>
      b.priority - a.priority
      || Date.parse(a.nextAttemptAt) - Date.parse(b.nextAttemptAt)
      || Date.parse(a.enqueuedAt) - Date.parse(b.enqueuedAt))
    .slice(0, limit)
}

export function markEnvironmentGeospatialSyncStarted(
  task: EnvironmentGeospatialSyncTask,
): EnvironmentGeospatialSyncTask {
  return Object.freeze({ ...task, state: 'in-flight' })
}

/**
 * Exponential retry:
 * delayMs = min(maxDelayMs, baseDelayMs * 2^(attempts_after_failure - 1))
 */
export function markEnvironmentGeospatialSyncFailed(
  task: EnvironmentGeospatialSyncTask,
  failedAt: string,
  error: string,
  baseDelayMs = 30_000,
  maxDelayMs = 6 * 60 * 60 * 1000,
): EnvironmentGeospatialSyncTask {
  const failedAtMs = Date.parse(failedAt)
  if (!Number.isFinite(failedAtMs)) throw new Error('Invalid failedAt time')
  const attempts = task.attempts + 1
  const exponent = Math.min(Math.max(0, attempts - 1), 20)
  const delayMs = Math.min(
    Math.max(0, maxDelayMs),
    Math.max(0, baseDelayMs) * (2 ** exponent),
  )

  return Object.freeze({
    ...task,
    state: 'failed',
    attempts,
    lastError: error.slice(0, 512),
    nextAttemptAt: new Date(failedAtMs + delayMs).toISOString(),
  })
}

function requestPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function transactionPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
  })
}

async function openEnvironmentGeospatialDatabase(name = DB_NAME): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is unavailable in this runtime')
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(ENTRY_STORE)) {
        db.createObjectStore(ENTRY_STORE, { keyPath: 'cacheId' })
      }
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        db.createObjectStore(SYNC_STORE, { keyPath: 'taskId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open environment geospatial cache'))
  })
}

export function createIndexedDbEnvironmentGeospatialPersistence(
  databaseName = DB_NAME,
): EnvironmentGeospatialPersistence {
  const db = () => openEnvironmentGeospatialDatabase(databaseName)

  return {
    async getEntry(cacheId) {
      const database = await db()
      const tx = database.transaction(ENTRY_STORE, 'readonly')
      const stored = await requestPromise<any>(tx.objectStore(ENTRY_STORE).get(cacheId))
      await transactionPromise(tx)
      if (!stored) return null
      return {
        record: stored.record as EnvironmentGeospatialCacheRecord,
        payload: new Uint8Array(stored.payload),
      }
    },

    async putEntry(entry) {
      const database = await db()
      const tx = database.transaction(ENTRY_STORE, 'readwrite')
      tx.objectStore(ENTRY_STORE).put({
        cacheId: entry.record.metadata.cacheId,
        record: entry.record,
        payload: new Uint8Array(entry.payload),
      })
      await transactionPromise(tx)
    },

    async deleteEntry(cacheId) {
      const database = await db()
      const tx = database.transaction(ENTRY_STORE, 'readwrite')
      tx.objectStore(ENTRY_STORE).delete(cacheId)
      await transactionPromise(tx)
    },

    async listRecords() {
      const database = await db()
      const tx = database.transaction(ENTRY_STORE, 'readonly')
      const rows = await requestPromise<any[]>(tx.objectStore(ENTRY_STORE).getAll())
      await transactionPromise(tx)
      return rows.map((row) => row.record as EnvironmentGeospatialCacheRecord)
    },

    async getSyncTask(taskId) {
      const database = await db()
      const tx = database.transaction(SYNC_STORE, 'readonly')
      const task = await requestPromise<EnvironmentGeospatialSyncTask | undefined>(
        tx.objectStore(SYNC_STORE).get(taskId),
      )
      await transactionPromise(tx)
      return task ?? null
    },

    async putSyncTask(task) {
      const database = await db()
      const tx = database.transaction(SYNC_STORE, 'readwrite')
      tx.objectStore(SYNC_STORE).put(task)
      await transactionPromise(tx)
    },

    async deleteSyncTask(taskId) {
      const database = await db()
      const tx = database.transaction(SYNC_STORE, 'readwrite')
      tx.objectStore(SYNC_STORE).delete(taskId)
      await transactionPromise(tx)
    },

    async listSyncTasks() {
      const database = await db()
      const tx = database.transaction(SYNC_STORE, 'readonly')
      const tasks = await requestPromise<EnvironmentGeospatialSyncTask[]>(
        tx.objectStore(SYNC_STORE).getAll(),
      )
      await transactionPromise(tx)
      return tasks
    },
  }
}

export const ENVIRONMENT_GEOSPATIAL_STORE_POLICY = Object.freeze({
  canonicalOfflineCacheMetadataRequired: true as const,
  digestVerifiedBeforePersist: true as const,
  sourceVersionAndLicenseRemainPinned: true as const,
  staleDataCannotMasqueradeAsCurrent: true as const,
  deterministicCapacityEviction: true as const,
  pinnedRecordsMayBeProtected: true as const,
  persistentSyncQueue: true as const,
  boundedExponentialRetry: true as const,
  locationDerivedRecordsRequireConsentScope: true as const,
  patientIdentityStoredByDefault: false as const,
})
