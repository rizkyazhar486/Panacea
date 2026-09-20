import test from 'node:test'
import assert from 'node:assert/strict'
import { ENVIRONMENT_SOURCE_ADAPTERS } from '../../src/lib/environmentSourceAdapter.ts'
import {
  ENVIRONMENT_OFFLINE_CACHE_POLICY,
  assessEnvironmentOfflineCacheEntry,
  validateEnvironmentOfflineCacheEntry,
} from '../../src/lib/environmentOfflineCache.ts'

const digest = 'a'.repeat(64)
const gebco = ENVIRONMENT_SOURCE_ADAPTERS.find((entry) => entry.sourceId === 'gebco-2026')
assert.ok(gebco)

const base = {
  cacheId: 'gebco:tile-1',
  adapterId: gebco.adapterId,
  sourceId: gebco.sourceId,
  sourceVersion: gebco.sourceVersion,
  sourceRef: 'gebco-2026:tile-1',
  payloadKind: 'gridded-raster',
  truthClass: gebco.truthClass,
  sourceTime: '2026-07-01T00:00:00Z',
  cachedAt: '2026-09-20T10:00:00Z',
  payloadSha256: digest,
  byteLength: 4096,
  licenseRef: gebco.licenseRef,
  authorityRef: gebco.authorityRef,
}

test('valid offline source snapshot pins identity, provenance, digest and license', () => {
  assert.deepEqual(validateEnvironmentOfflineCacheEntry(gebco, base), [])
  const result = assessEnvironmentOfflineCacheEntry(
    gebco,
    base,
    '2026-09-21T00:00:00Z',
  )
  assert.equal(result.valid, true)
  assert.equal(result.freshness.state, 'fresh')
  assert.equal(result.usableAsCurrentSourceContext, true)
  assert.equal(result.historicalReadable, true)
  assert.equal(ENVIRONMENT_OFFLINE_CACHE_POLICY.sourceVersionPinned, true)
})

test('stale snapshots remain readable history but cannot masquerade as current context', () => {
  const result = assessEnvironmentOfflineCacheEntry(
    gebco,
    base,
    '2028-09-21T00:00:00Z',
  )
  assert.equal(result.valid, true)
  assert.equal(result.freshness.state, 'stale')
  assert.equal(result.usableAsCurrentSourceContext, false)
  assert.equal(result.historicalReadable, true)
})

test('tampered or mismatched cache provenance fails closed', () => {
  for (const patch of [
    { adapterId: 'wrong' },
    { sourceVersion: 'wrong' },
    { payloadSha256: 'not-a-digest' },
    { byteLength: 0 },
    { licenseRef: 'wrong' },
    { authorityRef: 'wrong' },
  ]) {
    const errors = validateEnvironmentOfflineCacheEntry(gebco, { ...base, ...patch })
    assert.ok(errors.length > 0)
  }
})

test('forecast cache keeps issue and target time distinct', () => {
  const noaa = ENVIRONMENT_SOURCE_ADAPTERS.find((entry) => entry.sourceId === 'noaa-ofs')
  assert.ok(noaa)
  const forecast = {
    cacheId: 'ofs:cycle-1',
    adapterId: noaa.adapterId,
    sourceId: noaa.sourceId,
    sourceVersion: noaa.sourceVersion,
    sourceRef: 'ofs:cycle-1',
    payloadKind: 'forecast-report',
    truthClass: noaa.truthClass,
    sourceTime: '2026-09-20T08:00:00Z',
    validAt: '2026-09-20T12:00:00Z',
    cachedAt: '2026-09-20T08:05:00Z',
    payloadSha256: digest,
    byteLength: 1024,
    licenseRef: noaa.licenseRef,
    authorityRef: noaa.authorityRef,
  }

  const beforeTarget = assessEnvironmentOfflineCacheEntry(
    noaa,
    forecast,
    '2026-09-20T09:00:00Z',
  )
  assert.equal(beforeTarget.targetState, 'future-target')
  assert.equal(beforeTarget.usableAsCurrentSourceContext, true)

  const afterTarget = assessEnvironmentOfflineCacheEntry(
    noaa,
    forecast,
    '2026-09-20T13:00:00Z',
  )
  assert.equal(afterTarget.targetState, 'target-reached-or-past')
  assert.equal(afterTarget.usableAsCurrentSourceContext, false)
  assert.equal(afterTarget.historicalReadable, true)
})

test('future cache timestamps and invalid forecast chronology fail closed', () => {
  const futureCache = assessEnvironmentOfflineCacheEntry(
    gebco,
    { ...base, cachedAt: '2026-09-22T00:00:00Z' },
    '2026-09-21T00:00:00Z',
  )
  assert.equal(futureCache.valid, false)
  assert.ok(futureCache.errors.includes('future-cache-time'))

  const invalidTarget = validateEnvironmentOfflineCacheEntry(
    {
      ...gebco,
      payloadKinds: [...gebco.payloadKinds, 'forecast-report'],
    },
    {
      ...base,
      payloadKind: 'forecast-report',
      validAt: '2026-06-01T00:00:00Z',
    },
  )
  assert.ok(invalidTarget.includes('validAt'))
})
