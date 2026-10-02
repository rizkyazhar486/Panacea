import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ADVENTURE_RESCUE_POLICY,
  CERTIFIED_RESCUE_COMPANION_PROFILES,
  SPORT_SCIENCE_PROFILES,
  buildExpeditionConnectivity,
  buildOperatingContext,
  buildRescueTrack,
  buildUnderwaterCommunicationPlan,
  getSportScienceProfile,
  projectDriftPosition,
  rescueConfidence,
} from '../../src/lib/sportAdventureRescueOS.ts'

const fix = {
  id: 'fix-1',
  subjectId: 'diver-7',
  capturedAt: '2026-09-20T08:00:00Z',
  lat: -6,
  lon: 106,
  accuracyM: 8,
  source: 'surface-buoy-gnss',
  fixKind: 'relay-derived',
  confidence: 0.95,
}

test('sport science registry covers requested multidisciplinary sports', () => {
  const ids = SPORT_SCIENCE_PROFILES.map((entry) => entry.id)
  for (const required of [
    'running', 'cycling', 'swimming', 'triathlon-ironman', 'tennis',
    'padel', 'hyrox', 'strength-gym', 'tactical-fitness', 'diving',
  ]) {
    assert.ok(ids.includes(required))
    assert.ok(getSportScienceProfile(required)?.metrics.length >= 4)
  }
})

test('underwater plans never claim direct GNSS or satellite links', () => {
  assert.equal(ADVENTURE_RESCUE_POLICY.directSatelliteUnderwaterEnabled, false)
  assert.equal(ADVENTURE_RESCUE_POLICY.directGnssUnderwaterEnabled, false)

  const cave = buildUnderwaterCommunicationPlan('cave', 3)
  assert.equal(cave.directSatelliteUnderwater, false)
  assert.equal(cave.surfaceGatewayRequired, true)
  assert.equal(cave.hops.filter((hop) => hop.role === 'cave-repeater').length, 3)
  assert.equal(cave.hops[0].medium, 'acoustic')
  assert.equal(cave.hops.at(-1)?.medium, 'leo-satellite')
})

test('cave/overhead routes preserve store-and-forward when live backhaul is unavailable', () => {
  const plan = buildUnderwaterCommunicationPlan('overhead', 4)
  assert.equal(plan.storeAndForward, true)
  assert.ok(plan.hops.some((hop) => hop.role === 'entrance-gateway'))
})

test('drift projection is visibly estimated and uncertainty expands over time', () => {
  const current = { speedMps: 1, bearingDeg: 90, speedUncertaintyMps: 0.15 }
  const first = projectDriftPosition(fix, current, '2026-09-20T08:05:00Z')
  const later = projectDriftPosition(fix, current, '2026-09-20T08:20:00Z')

  assert.ok(first)
  assert.ok(later)
  assert.equal(first.fixKind, 'drift-estimated')
  assert.ok(first.lon > fix.lon)
  assert.ok(later.searchRadiusM > first.searchRadiusM)
})

test('rescue track never silently upgrades a drift estimate to a measured fix', () => {
  const track = buildRescueTrack(
    'diver-7',
    [fix],
    '2026-09-20T08:10:00Z',
    { speedMps: 0.5, bearingDeg: 180, speedUncertaintyMps: 0.2 },
  )
  assert.equal(track.bestObservedFix?.fixKind, 'relay-derived')
  assert.equal(track.driftProjection?.fixKind, 'drift-estimated')
  assert.ok((track.staleSeconds ?? 0) > 0)
})

test('surface connectivity can fail over without changing underwater transport truth', () => {
  const plan = buildUnderwaterCommunicationPlan('open-water', 0)
  const links = [
    {
      id: 'satellite',
      pathKind: 'leo-satellite',
      capturedAt: '2026-09-20T08:00:00Z',
      rttMs: 80,
      jitterMs: 20,
      packetLossRatio: 0.02,
      availabilityRatio: 0.99,
      integrityConfidence: 0.99,
      routeStability: 0.95,
    },
    {
      id: 'cell',
      pathKind: 'cellular',
      capturedAt: '2026-09-20T08:00:00Z',
      rttMs: 700,
      jitterMs: 200,
      packetLossRatio: 0.5,
      availabilityRatio: 0.4,
      integrityConfidence: 0.9,
      routeStability: 0.4,
    },
  ]

  const state = buildExpeditionConnectivity(links, plan)
  assert.equal(state.preferredSurfaceLinkId, 'satellite')
  assert.equal(state.underwaterPlan?.directSatelliteUnderwater, false)
})

test('certified emergency systems remain primary for aircraft and maritime distress', () => {
  assert.equal(ADVENTURE_RESCUE_POLICY.certifiedDistressBeaconReplacementAllowed, false)
  assert.equal(ADVENTURE_RESCUE_POLICY.aircraftFlightControlEnabled, false)
  assert.equal(ADVENTURE_RESCUE_POLICY.vesselControlEnabled, false)
  assert.equal(ADVENTURE_RESCUE_POLICY.decompressionComputerEnabled, false)

  const aircraft = CERTIFIED_RESCUE_COMPANION_PROFILES.find((entry) => entry.domain === 'aircraft-distress')
  const vessel = CERTIFIED_RESCUE_COMPANION_PROFILES.find((entry) => entry.domain === 'vessel-distress')
  assert.ok(aircraft?.certifiedPrimarySystems.includes('elt-406'))
  assert.ok(vessel?.certifiedPrimarySystems.includes('epirb-406'))
  assert.equal(aircraft?.mayReplaceCertifiedSystem, false)
})

test('operating contexts preserve offline-first behavior for remote modes', () => {
  assert.equal(buildOperatingContext('dive', 'remote', 'diving').offlineRequired, true)
  assert.equal(buildOperatingContext('aviation', 'critical').offlineRequired, true)
  assert.equal(buildOperatingContext('performance', 'routine', 'running').offlineRequired, false)
})

test('rescue confidence decays with stale telemetry', () => {
  const fresh = rescueConfidence(0.9, 0.95, 10)
  const stale = rescueConfidence(0.9, 0.95, 1200)
  assert.ok(fresh > stale)
  assert.ok(fresh <= 1)
})
