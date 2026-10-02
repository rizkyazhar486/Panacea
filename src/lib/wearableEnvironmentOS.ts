/**
 * Panacea Future Wearable Environment OS
 *
 * A device-neutral environment + endurance + rescue context kernel.
 * It preserves source/provenance and keeps advisory calculations separate from
 * certified navigation, rescue and safety systems.
 */

export type EnvironmentDomain =
  | 'terrain'
  | 'geology'
  | 'atmosphere'
  | 'weather'
  | 'ocean'
  | 'bathymetry'
  | 'marine-biodiversity'
  | 'indoor'
  | 'aviation'
  | 'maritime'
  | 'motorsport'

export type EnvironmentSourceClass =
  | 'wearable'
  | 'vehicle'
  | 'buoy'
  | 'weather-station'
  | 'radar'
  | 'satellite-observation'
  | 'forecast-model'
  | 'bathymetry-grid'
  | 'biodiversity-dataset'
  | 'venue-infrastructure'
  | 'manual'

export interface EnvironmentObservation {
  id: string
  domain: EnvironmentDomain
  metric: string
  value: number
  unit: string
  observedAt: string
  sourceClass: EnvironmentSourceClass
  sourceRef: string
  confidence: number
  uncertainty?: number
  lat?: number
  lon?: number
  altitudeM?: number
  depthM?: number
}

export interface VectorFieldObservation {
  id: string
  kind: 'wind' | 'surface-current' | 'subsurface-current'
  speedMps: number
  towardBearingDeg: number
  uncertaintyMps: number
  observedAt: string
  sourceRef: string
  confidence: number
}

export interface VectorComponents {
  northMps: number
  eastMps: number
}

/** Convert a vector expressed as direction-toward into north/east components. */
export function vectorComponents(speedMps: number, towardBearingDeg: number): VectorComponents {
  if (!Number.isFinite(speedMps) || speedMps < 0 || !Number.isFinite(towardBearingDeg)) {
    return { northMps: 0, eastMps: 0 }
  }
  const rad = towardBearingDeg * Math.PI / 180
  return {
    northMps: speedMps * Math.cos(rad),
    eastMps: speedMps * Math.sin(rad),
  }
}

export interface TerrainSample {
  elevationM: number
  horizontalDistanceM: number
}

/** slopeAngleDeg = atan(deltaElevation / horizontalDistance) */
export function terrainSlopeAngleDeg(start: TerrainSample, end: TerrainSample): number | null {
  const dx = end.horizontalDistanceM - start.horizontalDistanceM
  const dz = end.elevationM - start.elevationM
  if (!Number.isFinite(dx) || !Number.isFinite(dz) || dx === 0) return null
  return Math.atan(dz / Math.abs(dx)) * 180 / Math.PI
}

export interface DiveHoverSample {
  capturedAt: string
  depthM: number
  verticalSpeedMps: number
  pitchDeg?: number
  rollDeg?: number
}

export interface DiveHoverAssessment {
  sampleCount: number
  meanDepthM: number
  depthStdDevM: number
  verticalSpeedRmsMps: number
  trimRmsDeg: number | null
  hoverStabilityScore: number
  interpretationBoundary: string
}

const mean = (values: readonly number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

const rms = (values: readonly number[]) =>
  values.length ? Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length) : 0

const stddev = (values: readonly number[]) => {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / values.length)
}

/**
 * HoverStability = 1 / (1 + depthSD/0.30 + verticalSpeedRMS/0.10 + trimRMS/20)
 *
 * This is an educational motion-control proxy, not a decompression or weighting
 * instruction. It should be compared within-person, at similar task/depth/context.
 */
export function assessDiveHover(samples: readonly DiveHoverSample[]): DiveHoverAssessment | null {
  const valid = samples.filter((s) =>
    Number.isFinite(Date.parse(s.capturedAt)) &&
    Number.isFinite(s.depthM) &&
    s.depthM >= 0 &&
    Number.isFinite(s.verticalSpeedMps),
  )
  if (valid.length < 3) return null

  const depths = valid.map((s) => s.depthM)
  const verticalSpeeds = valid.map((s) => s.verticalSpeedMps)
  const trimAngles = valid
    .filter((s) => Number.isFinite(s.pitchDeg) && Number.isFinite(s.rollDeg))
    .map((s) => Math.hypot(s.pitchDeg ?? 0, s.rollDeg ?? 0))

  const depthStdDevM = stddev(depths)
  const verticalSpeedRmsMps = rms(verticalSpeeds)
  const trimRmsDeg = trimAngles.length ? rms(trimAngles) : null
  const trimPenalty = trimRmsDeg == null ? 0 : trimRmsDeg / 20
  const hoverStabilityScore = 1 / (1 + depthStdDevM / 0.30 + verticalSpeedRmsMps / 0.10 + trimPenalty)

  return Object.freeze({
    sampleCount: valid.length,
    meanDepthM: mean(depths),
    depthStdDevM,
    verticalSpeedRmsMps,
    trimRmsDeg,
    hoverStabilityScore: Math.max(0, Math.min(1, hoverStabilityScore)),
    interpretationBoundary:
      'Motion-control proxy only. Do not use this score to choose ballast, gas strategy, ascent profile or decompression.',
  })
}

export interface BuoyancyPhysicsInput {
  fluidDensityKgM3: number
  displacedVolumeM3: number
  totalMassKg: number
  gravityMps2?: number
}

export interface BuoyancyPhysicsResult {
  buoyantForceN: number
  weightForceN: number
  netVerticalForceN: number
}

/**
 * Archimedes:
 * buoyantForce = fluidDensity * g * displacedVolume
 * netVerticalForce = buoyantForce - mass * g
 *
 * Only valid when the caller supplies physically meaningful measured/estimated
 * volume, mass and fluid density. Panacea does not infer BCD gas volume.
 */
export function calculateBuoyancyPhysics(input: BuoyancyPhysicsInput): BuoyancyPhysicsResult | null {
  const g = input.gravityMps2 ?? 9.80665
  if (
    !Number.isFinite(input.fluidDensityKgM3) || input.fluidDensityKgM3 <= 0 ||
    !Number.isFinite(input.displacedVolumeM3) || input.displacedVolumeM3 <= 0 ||
    !Number.isFinite(input.totalMassKg) || input.totalMassKg <= 0 ||
    !Number.isFinite(g) || g <= 0
  ) return null

  const buoyantForceN = input.fluidDensityKgM3 * g * input.displacedVolumeM3
  const weightForceN = input.totalMassKg * g
  return Object.freeze({
    buoyantForceN,
    weightForceN,
    netVerticalForceN: buoyantForceN - weightForceN,
  })
}

export interface AdvisoryRouteCandidate {
  id: string
  estimatedMinutes: number
  weatherHazard: number
  terrainOrAirspaceHazard: number
  communicationRisk: number
  uncertainty: number
  certifiedPlannerRef?: string
}

/**
 * AdvisoryRouteCost =
 * 0.30*timeNormalized + 0.30*weatherHazard + 0.20*terrainOrAirspaceHazard
 * + 0.10*communicationRisk + 0.10*uncertainty
 *
 * This ranks already-supplied candidate routes. It does not create or certify a
 * flight plan, marine passage plan, parachute plan or emergency route.
 */
export function rankAdvisoryRoutes(candidates: readonly AdvisoryRouteCandidate[]) {
  const valid = candidates.filter((c) =>
    c.id.trim() &&
    Number.isFinite(c.estimatedMinutes) &&
    c.estimatedMinutes > 0 &&
    [c.weatherHazard, c.terrainOrAirspaceHazard, c.communicationRisk, c.uncertainty]
      .every((v) => Number.isFinite(v) && v >= 0 && v <= 1),
  )
  const maxTime = Math.max(...valid.map((c) => c.estimatedMinutes), 1)
  return valid
    .map((candidate) => ({
      candidate,
      advisoryCost:
        0.30 * (candidate.estimatedMinutes / maxTime) +
        0.30 * candidate.weatherHazard +
        0.20 * candidate.terrainOrAirspaceHazard +
        0.10 * candidate.communicationRisk +
        0.10 * candidate.uncertainty,
    }))
    .sort((a, b) => a.advisoryCost - b.advisoryCost)
}

export type TrackingSubjectClass =
  | 'self-device'
  | 'guardian-dependent'
  | 'consenting-adult'
  | 'team-member'
  | 'team-asset'
  | 'vehicle'

export type TrackingPurpose = 'device-finding' | 'guardian-safety' | 'event-operations' | 'rescue'

export interface TrackingAuthorization {
  subjectClass: TrackingSubjectClass
  purpose: TrackingPurpose
  authorized: boolean
  expiresAt?: string
  covertTracking: boolean
}

/**
 * Human/device tracking is fail-closed. A missing consent/guardian/event/rescue
 * authorization never becomes permission by default.
 */
export function canTrackSubject(auth: TrackingAuthorization, now: string): boolean {
  if (!auth.authorized || auth.covertTracking) return false
  if (auth.expiresAt && Date.parse(auth.expiresAt) <= Date.parse(now)) return false
  if (auth.subjectClass === 'guardian-dependent') return auth.purpose === 'guardian-safety' || auth.purpose === 'rescue'
  if (auth.subjectClass === 'consenting-adult' || auth.subjectClass === 'team-member') {
    return auth.purpose === 'event-operations' || auth.purpose === 'rescue' || auth.purpose === 'device-finding'
  }
  return true
}

export type LocalPositionSource =
  | 'gnss'
  | 'uwb'
  | 'ble'
  | 'wifi-rtt'
  | 'venue-gateway'
  | 'crowd-relay'
  | 'acoustic'
  | 'vehicle-relay'
  | 'satellite-backhaul'

export interface LocalPositionObservation {
  source: LocalPositionSource
  capturedAt: string
  confidence: number
  accuracyM: number
  floor?: number
  positionAuthority: 'measured' | 'relay-derived'
}

export const FUTURE_WEARABLE_ENVIRONMENT_POLICY = Object.freeze({
  universalDeviceAdapters: true as const,
  sourceProvenanceRequired: true as const,
  uncertaintyRequiredForDerivedNavigation: true as const,
  directUnderwaterSatelliteClaimAllowed: false as const,
  certifiedAviationPlannerReplacementAllowed: false as const,
  certifiedMarineNavigationReplacementAllowed: false as const,
  covertHumanTrackingAllowed: false as const,
  guardianTrackingMustBeAuthorized: true as const,
  mentalStateInferenceFromWearablesAllowed: false as const,
  environmentalRouteRankingIsAdvisoryOnly: true as const,
})

export type EnduranceEventKind =
  | 'ironman'
  | 'tour-de-france-stage'
  | 'hyrox'
  | 'ultramarathon'
  | 'ultra-trail'
  | 'open-water-swim'
  | 'adventure-race'
  | 'skydiving'
  | 'f1'
  | 'daytona-endurance'
  | 'rally'
  | 'rowing'

export interface EnduranceEventProfile {
  id: EnduranceEventKind
  domains: readonly string[]
  requiredContext: readonly string[]
}

export const ENDURANCE_EVENT_PROFILES = Object.freeze([
  { id: 'ironman', domains: ['swim', 'bike', 'run'], requiredContext: ['pace', 'power', 'HR', 'temperature', 'wind', 'fueling', 'hydration', 'transition'] },
  { id: 'tour-de-france-stage', domains: ['road-cycling'], requiredContext: ['power', 'W/kg', 'gradient', 'wind', 'temperature', 'altitude', 'drafting', 'nutrition'] },
  { id: 'hyrox', domains: ['running', 'functional-stations'], requiredContext: ['run-splits', 'station-splits', 'HR', 'RPE', 'transition', 'recovery'] },
  { id: 'ultramarathon', domains: ['running'], requiredContext: ['terrain', 'elevation', 'weather', 'pace', 'RPE', 'sleep', 'nutrition', 'navigation'] },
  { id: 'ultra-trail', domains: ['trail-running'], requiredContext: ['slope', 'surface', 'elevation', 'weather', 'pace', 'RPE', 'navigation'] },
  { id: 'open-water-swim', domains: ['swimming'], requiredContext: ['current', 'wind', 'wave', 'water-temperature', 'stroke', 'position', 'support-craft'] },
  { id: 'adventure-race', domains: ['multisport', 'navigation'], requiredContext: ['terrain', 'weather', 'route', 'position', 'sleep', 'RPE', 'team-state'] },
  { id: 'skydiving', domains: ['aviation', 'parachuting'], requiredContext: ['wind', 'weather', 'airspace', 'altitude', 'GNSS', 'equipment-state', 'drop-zone'] },
  { id: 'f1', domains: ['motorsport'], requiredContext: ['lap-time', 'speed', 'g-load', 'tire-state', 'weather', 'track-temperature', 'driver-physiology'] },
  { id: 'daytona-endurance', domains: ['motorsport-endurance'], requiredContext: ['stint', 'lap-time', 'fuel', 'tire-state', 'weather', 'driver-physiology', 'sleep'] },
  { id: 'rally', domains: ['motorsport', 'terrain'], requiredContext: ['stage-time', 'surface', 'weather', 'elevation', 'vehicle-state', 'driver-physiology'] },
  { id: 'rowing', domains: ['rowing'], requiredContext: ['split', 'stroke-rate', 'power', 'wind', 'water-current', 'HR'] },
] satisfies readonly EnduranceEventProfile[])

export const ENVIRONMENT_DATA_SOURCE_REGISTRY = Object.freeze([
  {
    id: 'gebco-2026',
    domains: ['terrain', 'bathymetry', 'geology'],
    role: 'Global ocean/land terrain and bathymetric context; retain TID/source-resolution limitations.',
  },
  {
    id: 'noaa-ocean-weather',
    domains: ['ocean', 'weather', 'atmosphere'],
    role: 'Operational/model context for currents, wind, waves, temperature, salinity and marine weather where coverage exists.',
  },
  {
    id: 'obis',
    domains: ['marine-biodiversity'],
    role: 'Marine species occurrence/biodiversity context for dive planning and ecological education; occurrence is not guaranteed sighting.',
  },
  {
    id: 'aviation-weather-center',
    domains: ['aviation', 'weather', 'atmosphere'],
    role: 'Aviation weather observations/forecasts and hazards for advisory context; certified operational decisions remain with aviation authorities and approved tools.',
  },
])
