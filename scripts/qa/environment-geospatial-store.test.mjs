import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { ENVIRONMENT_SOURCE_ADAPTERS } from '../../src/lib/environmentSourceAdapter.ts'
import {
  ENVIRONMENT_GEOSPATIAL_STORE_POLICY,
  enqueueEnvironmentGeospatialSyncTask,
  markEnvironmentGeospatialSyncFailed,
  markEnvironmentGeospatialSyncStarted,
  persistEnvironmentGeospatialPayload,
  planEnvironmentGeospatialEviction,
  readEnvironmentGeospatialPayload,
  selectDueEnvironmentGeospatialSyncTasks,
  validateEnvironmentGeospatialCacheRecord,
  validateEnvironmentGeospatialSyncTask,
} from '../../src/lib/environmentGeospatialStore.ts'

function memoryPersistence() {
  const entries = new Map()
  const tasks = new Map()
  return {
    entries,
    tasks,
    async getEntry(cacheId) {
      return entries.get(cacheId) ?? null
    },
    async putEntry(entry) {
      entries.set(entry.record.metadata.cacheId, {
        record: structuredClone(entry.record),
        payload: new Uint8Array(entry.payload),
      })
    },
    async deleteEntry(cacheId) {
      entries.delete(cacheId)
    },
    async listRecords() {
      return [...entries.values()].map((entry) => structuredClone(entry.record))
    },
    async getSyncTask(taskId) {
      return tasks.get(taskId) ?? null
    },
    async putSyncTask(task) {
      tasks.set(task.taskId, structuredClone(task))
    },
    async deleteSyncTask(taskId) {
      tasks.delete(taskId)
    },
    async listSyncTasks() {
      return [...tasks.values()].map((task) => structuredClone(task))
    },
  }
}

const gebco = ENVIRONMENT_SOURCE_ADAPTERS.find((entry) => entry.sourceId === 'gebco-2026')
assert.ok(gebco)

const payload = new TextEncoder().encode('panacea-geospatial-tile')
const digest = createHash('sha256').update(payload).digest('hex')

const baseMetadata = {
  cacheId: 'gebco:z4:1:2',
  adapterId: gebco.adapterId,
  sourceId: gebco.sourceId,
  sourceVersion: gebco.sourceVersion,
  sourceRef: 'gebco-2026:z4:1:2',
  payloadKind: 'gridded-raster',
  truthClass: gebco.truthClass,
  sourceTime: '2026-07-01T00:00:00Z',
  cachedAt: '2026-09-20T10:00:00Z',
  payloadSha256: digest,
  byteLength: payload.byteLength,
  licenseRef: gebco.licenseRef,
  authorityRef: gebco.authorityRef,
}

const baseRecord = {
  metadata: baseMetadata,
  storageKey: 'environment/gebco/z4/1/2',
  contentType: 'application/octet-stream',
  spatial: { kind: 'tile', z: 4, x: 1, y: 2 },
  lastAccessedAt: '2026-09-20T10:00:00Z',
  privacyClass: 'public-source',
}

test('geospatial cache validates canonical provenance, spatial identity and privacy scope', () => {
  assert.deepEqual(validateEnvironmentGeospatialCacheRecord(gebco, baseRecord), [])

  const invalidTile = validateEnvironmentGeospatialCacheRecord(gebco, {
    ...baseRecord,
    spatial: { kind: 'tile', z: 4, x: 16, y: 2 },
  })
  assert.ok(invalidTile.includes('spatial.x'))

  const missingConsent = validateEnvironmentGeospatialCacheRecord(gebco, {
    ...baseRecord,
    privacyClass: 'location-derived',
  })
  assert.ok(missingConsent.includes('consentScopeRef'))

  const consented = validateEnvironmentGeospatialCacheRecord(gebco, {
    ...baseRecord,
    privacyClass: 'location-derived',
    consentScopeRef: 'consent:environment-map:v1',
  })
  assert.deepEqual(consented, [])
})

test('payload persists only when byte length and SHA-256 digest match declared metadata', async () => {
  const persistence = memoryPersistence()

  await persistEnvironmentGeospatialPayload(persistence, gebco, baseRecord, payload)
  assert.ok(persistence.entries.has(baseMetadata.cacheId))

  await assert.rejects(
    () => persistEnvironmentGeospatialPayload(
      persistence,
      gebco,
      {
        ...baseRecord,
        metadata: {
          ...baseMetadata,
          cacheId: 'gebco:tampered',
          payloadSha256: '0'.repeat(64),
        },
      },
      payload,
    ),
    /payload-digest/,
  )

  await assert.rejects(
    () => persistEnvironmentGeospatialPayload(
      persistence,
      gebco,
      {
        ...baseRecord,
        metadata: {
          ...baseMetadata,
          cacheId: 'gebco:length',
          byteLength: payload.byteLength + 1,
        },
      },
      payload,
    ),
    /payload-byte-length/,
  )
})

test('read path revalidates digest/provenance, preserves freshness and updates LRU access time', async () => {
  const persistence = memoryPersistence()
  await persistEnvironmentGeospatialPayload(persistence, gebco, baseRecord, payload)

  const result = await readEnvironmentGeospatialPayload(
    persistence,
    gebco,
    baseMetadata.cacheId,
    '2026-09-21T00:00:00Z',
  )

  assert.equal(result.admitted, true)
  assert.equal(result.assessment.usableAsCurrentSourceContext, true)
  assert.deepEqual([...result.payload], [...payload])

  const touched = await persistence.getEntry(baseMetadata.cacheId)
  assert.equal(touched.record.lastAccessedAt, '2026-09-21T00:00:00Z')

  touched.payload[0] = touched.payload[0] ^ 0xff
  await persistence.putEntry(touched)
  const tampered = await readEnvironmentGeospatialPayload(
    persistence,
    gebco,
    baseMetadata.cacheId,
    '2026-09-21T00:01:00Z',
  )
  assert.equal(tampered.admitted, false)
  assert.ok(tampered.errors.includes('payload-digest'))
})

test('eviction is deterministic and removes invalid or historical-only data before fresh current context', () => {
  const stale = {
    ...baseRecord,
    metadata: {
      ...baseMetadata,
      cacheId: 'gebco:stale',
      sourceRef: 'gebco-2024:stale',
      sourceTime: '2024-01-01T00:00:00Z',
      cachedAt: '2024-01-02T00:00:00Z',
      byteLength: 40,
    },
    storageKey: 'environment/gebco/stale',
    lastAccessedAt: '2024-01-02T00:00:00Z',
  }

  const fresh = {
    ...baseRecord,
    metadata: {
      ...baseMetadata,
      cacheId: 'gebco:fresh',
      byteLength: 40,
    },
    storageKey: 'environment/gebco/fresh',
  }

  const pinned = {
    ...baseRecord,
    metadata: {
      ...baseMetadata,
      cacheId: 'gebco:pinned',
      byteLength: 40,
    },
    storageKey: 'environment/gebco/pinned',
    pinned: true,
  }

  const plan = planEnvironmentGeospatialEviction(
    [fresh, pinned, stale],
    ENVIRONMENT_SOURCE_ADAPTERS,
    { maxBytes: 80, maxEntries: 2, protectPinned: true },
    '2026-09-21T00:00:00Z',
  )

  assert.deepEqual(plan.evictCacheIds, ['gebco:stale'])
  assert.equal(plan.totalBytesBefore, 120)
  assert.equal(plan.totalBytesAfter, 80)
  assert.equal(plan.totalEntriesAfter, 2)
  assert.equal(plan.satisfied, true)
})

const baseTask = {
  taskId: 'sync-1',
  cacheId: 'gebco:z4:1:2',
  adapterId: gebco.adapterId,
  sourceVersion: gebco.sourceVersion,
  operation: 'revalidate',
  state: 'pending',
  priority: 50,
  attempts: 0,
  enqueuedAt: '2026-09-21T00:00:00Z',
  nextAttemptAt: '2026-09-21T00:00:00Z',
}

test('sync queue is persistent, due-aware, priority ordered and uses bounded exponential retry', async () => {
  assert.deepEqual(validateEnvironmentGeospatialSyncTask(baseTask), [])
  const persistence = memoryPersistence()
  await enqueueEnvironmentGeospatialSyncTask(persistence, baseTask)

  const high = {
    ...baseTask,
    taskId: 'sync-high',
    priority: 90,
    enqueuedAt: '2026-09-21T00:01:00Z',
    nextAttemptAt: '2026-09-21T00:01:00Z',
  }
  const future = {
    ...baseTask,
    taskId: 'sync-future',
    priority: 100,
    nextAttemptAt: '2026-09-21T02:00:00Z',
  }

  const due = selectDueEnvironmentGeospatialSyncTasks(
    [baseTask, high, future],
    '2026-09-21T00:30:00Z',
    2,
  )
  assert.deepEqual(due.map((task) => task.taskId), ['sync-high', 'sync-1'])

  const started = markEnvironmentGeospatialSyncStarted(baseTask)
  assert.equal(started.state, 'in-flight')

  const failedOnce = markEnvironmentGeospatialSyncFailed(
    started,
    '2026-09-21T00:30:00Z',
    'offline',
    30_000,
    300_000,
  )
  assert.equal(failedOnce.attempts, 1)
  assert.equal(failedOnce.nextAttemptAt, '2026-09-21T00:30:30.000Z')

  const failedTwice = markEnvironmentGeospatialSyncFailed(
    failedOnce,
    '2026-09-21T00:31:00Z',
    'offline again',
    30_000,
    300_000,
  )
  assert.equal(failedTwice.attempts, 2)
  assert.equal(failedTwice.nextAttemptAt, '2026-09-21T00:32:00.000Z')
})

test('policy keeps cache source-bound, privacy-aware and non-clinical by default', () => {
  assert.equal(ENVIRONMENT_GEOSPATIAL_STORE_POLICY.canonicalOfflineCacheMetadataRequired, true)
  assert.equal(ENVIRONMENT_GEOSPATIAL_STORE_POLICY.digestVerifiedBeforePersist, true)
  assert.equal(ENVIRONMENT_GEOSPATIAL_STORE_POLICY.locationDerivedRecordsRequireConsentScope, true)
  assert.equal(ENVIRONMENT_GEOSPATIAL_STORE_POLICY.patientIdentityStoredByDefault, false)
})
