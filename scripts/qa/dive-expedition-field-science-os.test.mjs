import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DIVE_EXPEDITION_FIELD_SCIENCE_POLICY,
  buildDiveExpeditionConnectivity,
  calculateSurfaceInterval,
  summarizeReefCondition,
  validateMarineSampleRecord,
} from '../../src/lib/diveExpeditionFieldScienceOS.ts'

test('surface interval is pure timestamp bookkeeping', () => {
  const result = calculateSurfaceInterval(
    '2026-09-20T00:00:00Z',
    '2026-09-20T01:30:00Z',
  )

  assert.ok(result)
  assert.equal(result.minutes, 90)
  assert.match(result.boundary, /dive computer|authoritative/i)
  assert.equal(
    DIVE_EXPEDITION_FIELD_SCIENCE_POLICY.decompressionAdviceFromSurfaceIntervalAllowed,
    false,
  )
})

test('invasive specimen record fails closed without permit and authority', () => {
  const errors = validateMarineSampleRecord({
    specimenId: 'sample-1',
    observationId: 'reef-1',
    sampleKind: 'tissue-fragment',
    impact: 'invasive',
    collectedAt: '2026-09-20T02:00:00Z',
    collectorRef: 'researcher-1',
    chainOfCustody: [
      {
        at: '2026-09-20T02:00:00Z',
        actorRef: 'researcher-1',
        action: 'collected',
      },
    ],
    sourceRef: 'field-log-1',
  })

  assert.ok(errors.includes('permitRef'))
  assert.ok(errors.includes('authorityRef'))
  assert.equal(
    DIVE_EXPEDITION_FIELD_SCIENCE_POLICY.collectionProcedureGenerationAllowed,
    false,
  )
})

test('authorized invasive sample record can be represented without collection instructions', () => {
  const errors = validateMarineSampleRecord({
    specimenId: 'sample-2',
    observationId: 'reef-2',
    sampleKind: 'tissue-fragment',
    impact: 'invasive',
    collectedAt: '2026-09-20T02:00:00Z',
    collectorRef: 'researcher-1',
    permitRef: 'permit-ref',
    authorityRef: 'authority-ref',
    protocolRef: 'approved-protocol-ref',
    chainOfCustody: [
      {
        at: '2026-09-20T02:00:00Z',
        actorRef: 'researcher-1',
        action: 'collected',
      },
    ],
    sourceRef: 'field-log-2',
  })

  assert.deepEqual(errors, [])
})

test('reef condition summary preserves observational confidence', () => {
  const result = summarizeReefCondition([
    {
      id: 'obs-1',
      siteId: 'site-a',
      capturedAt: '2026-09-20T03:00:00Z',
      depthM: 12,
      method: 'photo-quadrat',
      condition: 'partial-bleaching',
      bleachingFraction: 0.2,
      liveTissueFraction: 0.8,
      observerConfidence: 1,
      sourceRef: 'photo-set-a',
    },
    {
      id: 'obs-2',
      siteId: 'site-a',
      capturedAt: '2026-09-20T03:02:00Z',
      depthM: 12.4,
      method: 'visual-demographic',
      condition: 'bleaching',
      bleachingFraction: 0.8,
      liveTissueFraction: 0.5,
      observerConfidence: 0.5,
      sourceRef: 'survey-a',
    },
  ])

  assert.equal(result.observationCount, 2)
  assert.ok(result.confidenceWeightedBleachingFraction != null)
  assert.ok(Math.abs(result.confidenceWeightedBleachingFraction - 0.4) < 1e-12)
  assert.match(result.boundary, /observational/i)
})

test('expedition connectivity falls back to offline store-and-forward', () => {
  const result = buildDiveExpeditionConnectivity('open-water', [])

  assert.equal(result.mode, 'offline-store-and-forward')
  assert.equal(result.storeAndForward, true)
  assert.equal(result.directSatelliteUnderwater, false)
  assert.equal(result.selectedBackhaulLinkId, null)
})

test('healthy LEO backhaul is selected only after the underwater surface gateway', () => {
  const result = buildDiveExpeditionConnectivity('open-water', [
    {
      id: 'leo-1',
      pathKind: 'leo-satellite',
      capturedAt: '2026-09-20T04:00:00Z',
      rttMs: 45,
      jitterMs: 5,
      packetLossRatio: 0.01,
      availabilityRatio: 0.995,
      integrityConfidence: 0.99,
      routeStability: 0.98,
      signalQuality: 0.9,
    },
  ])

  assert.equal(result.mode, 'online')
  assert.equal(result.selectedBackhaulLinkId, 'leo-1')
  assert.equal(result.selectedBackhaulPathKind, 'leo-satellite')
  assert.equal(result.underwater.surfaceGatewayRequired, true)
  assert.equal(result.underwater.directSatelliteUnderwater, false)
})
