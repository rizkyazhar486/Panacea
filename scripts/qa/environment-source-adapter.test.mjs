import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ENVIRONMENT_SOURCE_ADAPTERS,
  assessEnvironmentSourceFreshness,
  validateEnvironmentSourceAdapter,
  validateNumericObservationAgainstSource,
} from '../../src/lib/environmentSourceAdapter.ts'

test('canonical environment sources declare resolution provenance uncertainty licensing and failure semantics', () => {
  const ids = ENVIRONMENT_SOURCE_ADAPTERS.map((entry) => entry.sourceId)
  for (const expected of ['gebco-2026', 'noaa-ofs', 'obis', 'aviation-weather-center']) {
    assert.ok(ids.includes(expected))
  }

  for (const adapter of ENVIRONMENT_SOURCE_ADAPTERS) {
    assert.deepEqual(validateEnvironmentSourceAdapter(adapter), [])
    assert.ok(adapter.sourceVersion.trim())
    assert.ok(adapter.spatialResolution.description.trim())
    assert.ok(adapter.temporalResolution.description.trim())
    assert.ok(adapter.unitSemantics.trim())
    assert.ok(adapter.uncertaintySemantics.trim())
    assert.ok(adapter.licenseRef.trim())
    assert.ok(adapter.failureSemantics.length > 0)
  }
})

test('source validator fails closed when provenance or legal/source semantics are incomplete', () => {
  const invalid = {
    adapterId: 'bad',
    sourceId: 'bad-source',
    sourceName: 'Bad source',
    sourceVersion: '',
    domains: ['weather'],
    sourceClass: 'forecast-model',
    truthClass: 'modeled',
    payloadKinds: ['numeric-observation'],
    spatialResolution: { description: '' },
    temporalResolution: { description: '' },
    unitSemantics: '',
    uncertaintySemantics: '',
    licenseRef: '',
    authorityRef: '',
    staleAfterMs: 1000,
    failureSemantics: [],
  }

  const errors = validateEnvironmentSourceAdapter(invalid)
  for (const key of [
    'sourceVersion',
    'spatialResolution',
    'temporalResolution',
    'unitSemantics',
    'uncertaintySemantics',
    'licenseRef',
    'authorityRef',
    'failureSemantics',
  ]) {
    assert.ok(errors.includes(key))
  }
})

test('freshness uses source-specific stale threshold and preserves data age', () => {
  const source = ENVIRONMENT_SOURCE_ADAPTERS.find((entry) => entry.sourceId === 'noaa-ofs')
  assert.ok(source)

  const fresh = assessEnvironmentSourceFreshness(source, '2026-09-20T09:00:00Z', '2026-09-20T09:30:00Z')
  assert.equal(fresh.state, 'fresh')
  assert.equal(fresh.ageMs, 30 * 60 * 1000)

  const stale = assessEnvironmentSourceFreshness(source, '2026-09-20T00:00:00Z', '2026-09-20T09:30:00Z')
  assert.equal(stale.state, 'stale')
  assert.ok(stale.ageMs > source.staleAfterMs)
})

test('numeric observation validation rejects non-numeric source classes such as biodiversity occurrence records', () => {
  const obis = ENVIRONMENT_SOURCE_ADAPTERS.find((entry) => entry.sourceId === 'obis')
  assert.ok(obis)

  const result = validateNumericObservationAgainstSource(obis, {
    domain: 'marine-biodiversity',
    metric: 'species-count',
    unit: 'count',
    observedAt: '2026-09-20T09:00:00Z',
    sourceRef: 'obis-query-1',
    confidence: 0.8,
  })

  assert.equal(result.valid, false)
  assert.ok(result.errors.includes('payload-kind'))
})

test('GEBCO numeric observations require canonical meter units and matching domain', () => {
  const gebco = ENVIRONMENT_SOURCE_ADAPTERS.find((entry) => entry.sourceId === 'gebco-2026')
  assert.ok(gebco)

  const valid = validateNumericObservationAgainstSource(gebco, {
    domain: 'bathymetry',
    metric: 'elevation',
    unit: 'm',
    observedAt: '2026-09-20T09:00:00Z',
    sourceRef: 'gebco-2026:tile-1',
    confidence: 0.9,
  })
  assert.equal(valid.valid, true)

  const badUnit = validateNumericObservationAgainstSource(gebco, {
    domain: 'bathymetry',
    metric: 'elevation',
    unit: 'ft',
    observedAt: '2026-09-20T09:00:00Z',
    sourceRef: 'gebco-2026:tile-1',
    confidence: 0.9,
  })
  assert.equal(badUnit.valid, false)
  assert.ok(badUnit.errors.includes('unit'))
})
