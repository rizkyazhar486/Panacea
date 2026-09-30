import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ENDURANCE_EVENT_PROFILES,
  FUTURE_WEARABLE_ENVIRONMENT_POLICY,
  assessDiveHover,
  calculateBuoyancyPhysics,
  canTrackSubject,
  rankAdvisoryRoutes,
  terrainSlopeAngleDeg,
  vectorComponents,
} from '../../src/lib/wearableEnvironmentOS.ts'

test('environment OS preserves high-stakes and privacy boundaries', () => {
  assert.equal(FUTURE_WEARABLE_ENVIRONMENT_POLICY.directUnderwaterSatelliteClaimAllowed, false)
  assert.equal(FUTURE_WEARABLE_ENVIRONMENT_POLICY.certifiedAviationPlannerReplacementAllowed, false)
  assert.equal(FUTURE_WEARABLE_ENVIRONMENT_POLICY.certifiedMarineNavigationReplacementAllowed, false)
  assert.equal(FUTURE_WEARABLE_ENVIRONMENT_POLICY.covertHumanTrackingAllowed, false)
  assert.equal(FUTURE_WEARABLE_ENVIRONMENT_POLICY.mentalStateInferenceFromWearablesAllowed, false)
})

test('vector decomposition uses toward-bearing convention', () => {
  const east = vectorComponents(2, 90)
  assert.ok(Math.abs(east.northMps) < 1e-10)
  assert.ok(Math.abs(east.eastMps - 2) < 1e-10)
})

test('terrain slope uses elevation change over horizontal distance', () => {
  const slope = terrainSlopeAngleDeg(
    { elevationM: 100, horizontalDistanceM: 0 },
    { elevationM: 200, horizontalDistanceM: 100 },
  )
  assert.ok(slope != null)
  assert.ok(Math.abs(slope - 45) < 1e-9)
})

test('dive hovering assessment rewards stable depth and low vertical speed', () => {
  const stable = assessDiveHover([
    { capturedAt: '2026-09-20T00:00:00Z', depthM: 15.0, verticalSpeedMps: 0.01, pitchDeg: 2, rollDeg: 1 },
    { capturedAt: '2026-09-20T00:00:01Z', depthM: 15.05, verticalSpeedMps: -0.01, pitchDeg: 2, rollDeg: 1 },
    { capturedAt: '2026-09-20T00:00:02Z', depthM: 14.98, verticalSpeedMps: 0.00, pitchDeg: 1, rollDeg: 2 },
  ])
  const unstable = assessDiveHover([
    { capturedAt: '2026-09-20T00:00:00Z', depthM: 14, verticalSpeedMps: 0.5, pitchDeg: 25, rollDeg: 20 },
    { capturedAt: '2026-09-20T00:00:01Z', depthM: 16, verticalSpeedMps: -0.6, pitchDeg: 30, rollDeg: 18 },
    { capturedAt: '2026-09-20T00:00:02Z', depthM: 13, verticalSpeedMps: 0.8, pitchDeg: 22, rollDeg: 25 },
  ])
  assert.ok(stable && unstable)
  assert.ok(stable.hoverStabilityScore > unstable.hoverStabilityScore)
  assert.match(stable.interpretationBoundary, /not.*ballast|Do not use/i)
})

test('Archimedes calculation returns neutral force near equal displaced-water mass', () => {
  const result = calculateBuoyancyPhysics({
    fluidDensityKgM3: 1000,
    displacedVolumeM3: 0.08,
    totalMassKg: 80,
  })
  assert.ok(result)
  assert.ok(Math.abs(result.netVerticalForceN) < 1e-9)
})

test('route advisory ranks supplied candidates but is not a certified planner', () => {
  const ranked = rankAdvisoryRoutes([
    { id: 'fast-risky', estimatedMinutes: 50, weatherHazard: 0.9, terrainOrAirspaceHazard: 0.6, communicationRisk: 0.3, uncertainty: 0.2 },
    { id: 'slower-safer', estimatedMinutes: 60, weatherHazard: 0.1, terrainOrAirspaceHazard: 0.1, communicationRisk: 0.1, uncertainty: 0.1, certifiedPlannerRef: 'approved-source' },
  ])
  assert.equal(ranked[0].candidate.id, 'slower-safer')
})

test('authorized family/device finding is fail-closed and rejects covert tracking', () => {
  const now = '2026-09-20T00:00:00Z'
  assert.equal(canTrackSubject({
    subjectClass: 'guardian-dependent',
    purpose: 'guardian-safety',
    authorized: true,
    covertTracking: false,
  }, now), true)

  assert.equal(canTrackSubject({
    subjectClass: 'consenting-adult',
    purpose: 'device-finding',
    authorized: true,
    covertTracking: true,
  }, now), false)

  assert.equal(canTrackSubject({
    subjectClass: 'guardian-dependent',
    purpose: 'event-operations',
    authorized: true,
    covertTracking: false,
  }, now), false)
})

test('endurance registry spans human, expedition and motorsport extremes', () => {
  const ids = ENDURANCE_EVENT_PROFILES.map((entry) => entry.id)
  for (const id of ['ironman', 'tour-de-france-stage', 'hyrox', 'ultramarathon', 'skydiving', 'f1', 'daytona-endurance']) {
    assert.ok(ids.includes(id))
  }
})
