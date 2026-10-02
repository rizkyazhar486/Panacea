/**
 * Panacea Sport Science + Adventure / Rescue Operating Layer
 *
 * Device-neutral contracts for multisport analysis, remote expeditions,
 * diving/cave communication relays, maritime/aviation connectivity and rescue
 * positioning. This module never claims that GNSS or satellite RF works
 * directly underwater. It also does not replace a dive computer, certified
 * aviation/maritime distress beacon, SAR authority or aircraft/ship controls.
 */

import {
  chooseFailoverPath,
  type NetworkLinkTelemetry,
} from './satelliteMeshNetworkResilience.ts'

export type KnownSport =
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'triathlon-ironman'
  | 'tennis'
  | 'padel'
  | 'hyrox'
  | 'strength-gym'
  | 'tactical-fitness'
  | 'diving'

export type SportScienceDimension =
  | 'physiology'
  | 'biomechanics'
  | 'technique'
  | 'tactics'
  | 'internal-load'
  | 'external-load'
  | 'recovery'
  | 'environment'
  | 'equipment'
  | 'safety'

export type AdventureMode =
  | 'performance'
  | 'tactical'
  | 'dive'
  | 'explore'
  | 'travel'
  | 'rescue'
  | 'aviation'

export type AdventureClass = 'routine' | 'advanced' | 'remote' | 'critical'

export interface SportMetricDefinition {
  id: string
  label: string
  unit: string
  dimension: SportScienceDimension
  source: 'wearable' | 'manual' | 'lab' | 'equipment' | 'video' | 'environment'
  notes: string
}

export interface SportProfile {
  id: KnownSport
  label: string
  primaryDimensions: readonly SportScienceDimension[]
  metrics: readonly SportMetricDefinition[]
}

const metric = (
  id: string,
  label: string,
  unit: string,
  dimension: SportScienceDimension,
  source: SportMetricDefinition['source'],
  notes: string,
): SportMetricDefinition => Object.freeze({ id, label, unit, dimension, source, notes })

export const SPORT_SCIENCE_PROFILES = Object.freeze([
  {
    id: 'running',
    label: 'Running',
    primaryDimensions: ['physiology', 'biomechanics', 'technique', 'external-load', 'recovery'],
    metrics: [
      metric('pace', 'Pace', 'min/km', 'external-load', 'wearable', 'Use measured moving pace with fix-quality provenance.'),
      metric('cadence', 'Cadence', 'steps/min', 'biomechanics', 'wearable', 'Interpret with speed, height and terrain rather than one universal target.'),
      metric('ground-contact-time', 'Ground contact time', 'ms', 'biomechanics', 'wearable', 'Compare within-person at similar speed and surface.'),
      metric('vertical-oscillation', 'Vertical oscillation', 'cm', 'biomechanics', 'wearable', 'Useful only with pace and morphology context.'),
      metric('running-power', 'Running power', 'W', 'external-load', 'wearable', 'Device/model dependent; keep source identity.'),
      metric('lt-pace', 'Lactate-threshold pace', 'min/km', 'physiology', 'lab', 'Prefer tested threshold over generic HR-zone transfer.'),
    ],
  },
  {
    id: 'cycling',
    label: 'Cycling',
    primaryDimensions: ['physiology', 'biomechanics', 'technique', 'tactics', 'equipment'],
    metrics: [
      metric('power', 'Power', 'W', 'external-load', 'equipment', 'Use calibrated power-meter provenance when available.'),
      metric('ftp', 'Functional threshold power', 'W', 'physiology', 'equipment', 'Protocol dependent; preserve test method.'),
      metric('wkg', 'Power-to-mass', 'W/kg', 'physiology', 'equipment', 'Relevant to climbing and acceleration.'),
      metric('cadence-cycle', 'Cadence', 'rpm', 'biomechanics', 'equipment', 'Interpret relative to gearing, torque and event demands.'),
      metric('torque-effectiveness', 'Torque effectiveness', '%', 'technique', 'equipment', 'Only expose if the meter genuinely supplies it.'),
      metric('aerobic-decoupling', 'Aerobic decoupling', '%', 'physiology', 'wearable', 'Compare HR drift against power on steady endurance work.'),
    ],
  },
  {
    id: 'swimming',
    label: 'Swimming',
    primaryDimensions: ['physiology', 'biomechanics', 'technique', 'external-load', 'equipment'],
    metrics: [
      metric('swim-pace', 'Swim pace', 's/100m', 'external-load', 'wearable', 'Pool length and turn handling must be known.'),
      metric('stroke-rate', 'Stroke rate', 'strokes/min', 'technique', 'wearable', 'Interpret with distance per stroke.'),
      metric('distance-per-stroke', 'Distance per stroke', 'm/stroke', 'biomechanics', 'wearable', 'Efficiency proxy, not a universal maximum target.'),
      metric('swolf', 'SWOLF', 'score', 'technique', 'wearable', 'Best used longitudinally on the same pool length and stroke.'),
      metric('css', 'Critical swim speed', 's/100m', 'physiology', 'manual', 'Derive only from valid time-trial inputs.'),
    ],
  },
  {
    id: 'triathlon-ironman',
    label: 'Triathlon / Ironman',
    primaryDimensions: ['physiology', 'tactics', 'external-load', 'recovery', 'environment'],
    metrics: [
      metric('discipline-load', 'Discipline load', 'AU', 'internal-load', 'wearable', 'Keep run, bike and swim load separate before combining.'),
      metric('transition-time', 'Transition time', 's', 'tactics', 'manual', 'Useful tactical loss/gain independent of physiology.'),
      metric('bike-run-decoupling', 'Bike-to-run decoupling', '%', 'physiology', 'wearable', 'Track compromised-running cost after cycling.'),
      metric('fuel-rate', 'Fuel intake rate', 'g carbohydrate/h', 'equipment', 'environment', 'Use only user-entered or connected nutrition data.'),
    ],
  },
  {
    id: 'tennis',
    label: 'Tennis',
    primaryDimensions: ['technique', 'tactics', 'biomechanics', 'external-load', 'recovery'],
    metrics: [
      metric('court-coverage', 'Court coverage', 'm', 'tactics', 'wearable', 'Requires trustworthy position sampling.'),
      metric('accel-decel-tennis', 'Accelerations/decelerations', 'count', 'external-load', 'wearable', 'High mechanical load; compare session density.'),
      metric('serve-speed', 'Serve speed', 'km/h', 'technique', 'equipment', 'Radar/video source must be explicit.'),
      metric('rally-duration', 'Rally duration', 's', 'tactics', 'video', 'Use for work:rest pattern rather than isolated ranking.'),
    ],
  },
  {
    id: 'padel',
    label: 'Padel',
    primaryDimensions: ['technique', 'tactics', 'biomechanics', 'external-load', 'recovery'],
    metrics: [
      metric('court-coverage-padel', 'Court coverage', 'm', 'tactics', 'wearable', 'Interpret in doubles context and partner geometry.'),
      metric('net-occupation', 'Net occupation', '% time', 'tactics', 'video', 'Tactical metric; depends on valid court tracking.'),
      metric('high-intensity-actions', 'High-intensity actions', 'count', 'external-load', 'wearable', 'Accelerations, lunges and rapid direction changes.'),
      metric('shot-distribution', 'Shot distribution', '%', 'technique', 'video', 'Only classify if video/AI confidence is sufficient.'),
    ],
  },
  {
    id: 'hyrox',
    label: 'HYROX',
    primaryDimensions: ['physiology', 'external-load', 'technique', 'tactics', 'recovery'],
    metrics: [
      metric('run-splits-hyrox', 'Run splits', 's/km', 'tactics', 'wearable', 'Compare early vs late deterioration.'),
      metric('station-splits', 'Station splits', 's', 'tactics', 'manual', 'Track each station separately before total time.'),
      metric('roxzone', 'Roxzone time', 's', 'tactics', 'manual', 'Transition cost independent of station output.'),
      metric('compromised-running', 'Compromised-running delta', '%', 'physiology', 'wearable', 'Difference between fresh and post-station running.'),
    ],
  },
  {
    id: 'strength-gym',
    label: 'Strength / Gym',
    primaryDimensions: ['biomechanics', 'technique', 'external-load', 'internal-load', 'recovery'],
    metrics: [
      metric('tonnage', 'Volume load', 'kg', 'external-load', 'manual', 'Sets × reps × external load; not equivalent across exercises.'),
      metric('rir', 'Reps in reserve', 'reps', 'internal-load', 'manual', 'Subjective proximity-to-failure signal.'),
      metric('bar-velocity', 'Bar velocity', 'm/s', 'technique', 'equipment', 'Requires validated velocity sensor/video method.'),
      metric('estimated-1rm', 'Estimated 1RM', 'kg', 'external-load', 'manual', 'Equation and rep range must be retained.'),
    ],
  },
  {
    id: 'tactical-fitness',
    label: 'Tactical fitness',
    primaryDimensions: ['physiology', 'external-load', 'environment', 'equipment', 'safety'],
    metrics: [
      metric('load-carriage', 'Load carriage', 'kg', 'external-load', 'manual', 'Analyze together with distance, grade and heat.'),
      metric('loaded-pace', 'Loaded pace', 'min/km', 'external-load', 'wearable', 'Do not compare directly with unloaded running pace.'),
      metric('heat-strain', 'Heat strain context', 'index', 'environment', 'environment', 'Environment model must retain source/time.'),
      metric('recovery-under-load', 'Recovery under load', 'bpm/min', 'physiology', 'wearable', 'Contextual recovery marker, not a diagnosis.'),
    ],
  },
  {
    id: 'diving',
    label: 'Diving',
    primaryDimensions: ['safety', 'environment', 'equipment', 'physiology', 'technique'],
    metrics: [
      metric('depth-profile', 'Depth profile', 'm', 'external-load', 'equipment', 'Use actual dive-computer samples when connected.'),
      metric('ascent-rate', 'Ascent rate', 'm/min', 'safety', 'equipment', 'Do not derive from max depth alone.'),
      metric('water-temperature', 'Water temperature', '°C', 'environment', 'equipment', 'Thermal stress context.'),
      metric('surface-interval', 'Surface interval', 'min', 'safety', 'manual', 'Keep exact timestamps and dive-computer authority.'),
      metric('current-vector', 'Current vector', 'm/s + bearing', 'environment', 'environment', 'Use measured/modelled source with uncertainty.'),
      metric('gas-remaining', 'Gas remaining', 'bar/psi', 'safety', 'equipment', 'Only if a real transmitter/adapter supplies it.'),
    ],
  },
] satisfies readonly SportProfile[])

export function getSportScienceProfile(id: KnownSport) {
  return SPORT_SCIENCE_PROFILES.find((entry) => entry.id === id) ?? null
}

export type UnderwaterLinkKind = 'acoustic' | 'optical' | 'tether'
export type SurfaceBackhaulKind = 'leo-satellite' | 'cellular' | 'wifi' | 'ethernet' | 'vhf-data'

export interface RelayHop {
  id: string
  medium: UnderwaterLinkKind | SurfaceBackhaulKind
  role:
    | 'diver-wearable'
    | 'buddy-node'
    | 'cave-repeater'
    | 'entrance-gateway'
    | 'surface-buoy'
    | 'vessel-gateway'
    | 'aircraft-gateway'
    | 'shore-gateway'
  status: 'available' | 'degraded' | 'offline' | 'unknown'
}

export interface UnderwaterCommunicationPlan {
  environment: 'open-water' | 'cave' | 'wreck' | 'overhead'
  hops: readonly RelayHop[]
  storeAndForward: boolean
  surfaceGatewayRequired: true
  directSatelliteUnderwater: false
}

export const ADVENTURE_RESCUE_POLICY = Object.freeze({
  directSatelliteUnderwaterEnabled: false as const,
  directGnssUnderwaterEnabled: false as const,
  acousticOrOpticalGatewayRequiredUnderwater: true as const,
  certifiedDistressBeaconReplacementAllowed: false as const,
  aircraftFlightControlEnabled: false as const,
  vesselControlEnabled: false as const,
  decompressionComputerEnabled: false as const,
  rescueEstimatesMustRemainDistinguishableFromMeasuredFixes: true as const,
  offlineStoreAndForwardEnabled: true as const,
})

export function buildUnderwaterCommunicationPlan(
  environment: UnderwaterCommunicationPlan['environment'],
  repeaterCount = 0,
): UnderwaterCommunicationPlan {
  const repeaters = Array.from({ length: Math.max(0, Math.floor(repeaterCount)) }, (_, index) => ({
    id: `cave-repeater-${index + 1}`,
    medium: 'acoustic' as const,
    role: 'cave-repeater' as const,
    status: 'unknown' as const,
  }))

  const hops: RelayHop[] = [
    { id: 'diver-node', medium: 'acoustic', role: 'diver-wearable', status: 'unknown' },
    ...repeaters,
    {
      id: environment === 'cave' || environment === 'overhead' ? 'entrance-gateway' : 'surface-buoy',
      medium: 'acoustic',
      role: environment === 'cave' || environment === 'overhead' ? 'entrance-gateway' : 'surface-buoy',
      status: 'unknown',
    },
    { id: 'surface-backhaul', medium: 'leo-satellite', role: 'surface-buoy', status: 'unknown' },
  ]

  return Object.freeze({
    environment,
    hops: Object.freeze(hops),
    storeAndForward: true,
    surfaceGatewayRequired: true,
    directSatelliteUnderwater: false,
  })
}

export type RescueFixKind = 'measured' | 'relay-derived' | 'drift-estimated'

export type LocatorSource =
  | 'wearable-gnss'
  | 'surface-buoy-gnss'
  | 'vessel-gnss'
  | 'aircraft-gnss'
  | 'acoustic-ranging'
  | 'relay-node'
  | 'ads-b'
  | 'ais'
  | 'elt-406'
  | 'epirb-406'
  | 'plb-406'
  | 'ais-sart'
  | 'manual'

export interface RescueLocatorObservation {
  id: string
  subjectId: string
  capturedAt: string
  lat: number
  lon: number
  accuracyM: number
  source: LocatorSource
  fixKind: Exclude<RescueFixKind, 'drift-estimated'>
  confidence: number
}

export interface DriftVector {
  speedMps: number
  bearingDeg: number
  speedUncertaintyMps: number
}

export interface DriftProjection {
  subjectId: string
  fixKind: 'drift-estimated'
  lat: number
  lon: number
  projectedAt: string
  elapsedSeconds: number
  searchRadiusM: number
  sourceObservationId: string
}

const EARTH_RADIUS_M = 6_371_000

function validCoordinate(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

export function validateLocatorObservation(observation: RescueLocatorObservation) {
  const errors: string[] = []
  if (!observation.id.trim()) errors.push('id')
  if (!observation.subjectId.trim()) errors.push('subjectId')
  if (!validCoordinate(observation.lat, observation.lon)) errors.push('coordinate')
  if (!Number.isFinite(observation.accuracyM) || observation.accuracyM < 0) errors.push('accuracyM')
  if (!Number.isFinite(observation.confidence) || observation.confidence < 0 || observation.confidence > 1) errors.push('confidence')
  if (!Number.isFinite(Date.parse(observation.capturedAt))) errors.push('capturedAt')
  return errors
}

/**
 * Dead-reckoning drift model:
 *
 * distance = speed * elapsedSeconds
 * north = distance * cos(bearing)
 * east  = distance * sin(bearing)
 * dLat  = north / R
 * dLon  = east / (R * cos(latitude))
 *
 * Search-radius uncertainty grows by root-sum-square:
 *
 * radius = sqrt(
 *   positionAccuracy^2 +
 *   (elapsed * currentSpeedUncertainty)^2 +
 *   (elapsed * subjectSpeedUncertainty)^2
 * )
 *
 * This is a search aid, not a measured GNSS/acoustic fix.
 */
export function projectDriftPosition(
  observation: RescueLocatorObservation,
  current: DriftVector,
  projectedAt: string,
  subjectDrift: DriftVector = { speedMps: 0, bearingDeg: 0, speedUncertaintyMps: 0.25 },
): DriftProjection | null {
  if (validateLocatorObservation(observation).length > 0) return null

  const startMs = Date.parse(observation.capturedAt)
  const endMs = Date.parse(projectedAt)
  if (!Number.isFinite(endMs) || endMs < startMs) return null

  const elapsedSeconds = (endMs - startMs) / 1000
  const vectorToComponents = (vector: DriftVector) => {
    const bearingRad = vector.bearingDeg * Math.PI / 180
    return {
      northMps: vector.speedMps * Math.cos(bearingRad),
      eastMps: vector.speedMps * Math.sin(bearingRad),
    }
  }

  const a = vectorToComponents(current)
  const b = vectorToComponents(subjectDrift)
  const northM = (a.northMps + b.northMps) * elapsedSeconds
  const eastM = (a.eastMps + b.eastMps) * elapsedSeconds
  const latRad = observation.lat * Math.PI / 180
  const projectedLat = observation.lat + (northM / EARTH_RADIUS_M) * 180 / Math.PI
  const lonDenominator = Math.max(0.01, Math.cos(latRad))
  const projectedLon = observation.lon + (eastM / (EARTH_RADIUS_M * lonDenominator)) * 180 / Math.PI

  const currentUncertaintyM = Math.max(0, current.speedUncertaintyMps) * elapsedSeconds
  const subjectUncertaintyM = Math.max(0, subjectDrift.speedUncertaintyMps) * elapsedSeconds
  const searchRadiusM = Math.sqrt(
    observation.accuracyM ** 2 +
    currentUncertaintyM ** 2 +
    subjectUncertaintyM ** 2,
  )

  return Object.freeze({
    subjectId: observation.subjectId,
    fixKind: 'drift-estimated',
    lat: projectedLat,
    lon: projectedLon,
    projectedAt,
    elapsedSeconds,
    searchRadiusM,
    sourceObservationId: observation.id,
  })
}

export interface RescueTrack {
  subjectId: string
  bestObservedFix: RescueLocatorObservation | null
  driftProjection: DriftProjection | null
  staleSeconds: number | null
}

export function buildRescueTrack(
  subjectId: string,
  observations: readonly RescueLocatorObservation[],
  now: string,
  current?: DriftVector,
): RescueTrack {
  const nowMs = Date.parse(now)
  const valid = observations
    .filter((entry) => entry.subjectId === subjectId && validateLocatorObservation(entry).length === 0)
    .sort((a, b) => {
      const timeDelta = Date.parse(b.capturedAt) - Date.parse(a.capturedAt)
      if (timeDelta !== 0) return timeDelta
      return b.confidence - a.confidence
    })

  const bestObservedFix = valid[0] ?? null
  if (!bestObservedFix || !Number.isFinite(nowMs)) {
    return Object.freeze({ subjectId, bestObservedFix: null, driftProjection: null, staleSeconds: null })
  }

  const staleSeconds = Math.max(0, (nowMs - Date.parse(bestObservedFix.capturedAt)) / 1000)
  const driftProjection = current && staleSeconds > 0
    ? projectDriftPosition(bestObservedFix, current, now)
    : null

  return Object.freeze({ subjectId, bestObservedFix, driftProjection, staleSeconds })
}

export interface ExpeditionConnectivity {
  underwaterPlan: UnderwaterCommunicationPlan | null
  preferredSurfaceLinkId: string | null
  degraded: boolean
}

export function buildExpeditionConnectivity(
  links: readonly NetworkLinkTelemetry[],
  underwaterPlan: UnderwaterCommunicationPlan | null = null,
): ExpeditionConnectivity {
  const preferred = chooseFailoverPath(links)
  return Object.freeze({
    underwaterPlan,
    preferredSurfaceLinkId: preferred?.linkId ?? null,
    degraded: preferred === null,
  })
}

export type IncidentDomain = 'person-overboard' | 'diver-missing' | 'vessel-distress' | 'aircraft-distress'

export interface CertifiedRescueCompanionProfile {
  domain: IncidentDomain
  certifiedPrimarySystems: readonly LocatorSource[]
  panaceaRole: string
  mayReplaceCertifiedSystem: false
}

export const CERTIFIED_RESCUE_COMPANION_PROFILES = Object.freeze([
  {
    domain: 'diver-missing',
    certifiedPrimarySystems: ['plb-406', 'epirb-406'],
    panaceaRole: 'Fuse last trusted wearable/acoustic fix, relay history and environmental drift into a clearly labeled search aid.',
    mayReplaceCertifiedSystem: false,
  },
  {
    domain: 'person-overboard',
    certifiedPrimarySystems: ['ais-sart', 'plb-406', 'epirb-406'],
    panaceaRole: 'Fuse wearable and vessel observations with SAR beacon context without suppressing the certified distress path.',
    mayReplaceCertifiedSystem: false,
  },
  {
    domain: 'vessel-distress',
    certifiedPrimarySystems: ['epirb-406', 'ais-sart'],
    panaceaRole: 'Maintain crew/device last-known positions, connectivity state and search-area estimates while GMDSS/SAR remains authoritative.',
    mayReplaceCertifiedSystem: false,
  },
  {
    domain: 'aircraft-distress',
    certifiedPrimarySystems: ['elt-406'],
    panaceaRole: 'Maintain passenger/crew wearable last-known context and connectivity history while ELT/SAR systems remain authoritative.',
    mayReplaceCertifiedSystem: false,
  },
] satisfies readonly CertifiedRescueCompanionProfile[])

export interface OperatingContext {
  mode: AdventureMode
  class: AdventureClass
  sport?: KnownSport
  offlineRequired: boolean
  positionAuthority: 'device-fix' | 'vehicle-fix' | 'acoustic-network' | 'mixed'
  notes: string
}

export function buildOperatingContext(
  mode: AdventureMode,
  adventureClass: AdventureClass,
  sport?: KnownSport,
): OperatingContext {
  const remote = adventureClass === 'remote' || adventureClass === 'critical'
  const underwater = mode === 'dive'
  const aviation = mode === 'aviation'

  return Object.freeze({
    mode,
    class: adventureClass,
    sport,
    offlineRequired: remote || underwater || aviation,
    positionAuthority: underwater ? 'acoustic-network' : aviation ? 'vehicle-fix' : 'mixed',
    notes: underwater
      ? 'Underwater position and messaging require local acoustic/optical/tether infrastructure before any surface satellite backhaul.'
      : aviation
        ? 'Panacea may consume authorized connectivity/location context but does not control the aircraft or replace ELT/ATC systems.'
        : 'Use measured device/vehicle fixes first; estimates remain visibly distinct.',
  })
}

export function rescueConfidence(
  observationConfidence: number,
  integrityConfidence: number,
  freshnessSeconds: number,
  freshnessHalfLifeSeconds = 300,
) {
  if (!Number.isFinite(freshnessSeconds) || freshnessSeconds < 0 || freshnessHalfLifeSeconds <= 0) return 0
  const freshnessWeight = Math.pow(0.5, freshnessSeconds / freshnessHalfLifeSeconds)
  return clamp01(clamp01(observationConfidence) * clamp01(integrityConfidence) * freshnessWeight)
}

export const ADVENTURE_RESCUE_SOURCE_NOTES = Object.freeze([
  'WHOI Acoustic Communications Group: underwater acoustic telemetry, positioning and multi-node / buoy relay architectures.',
  'IMO GMDSS / 406 MHz EPIRB standards: maritime distress alerting and locating remain certified primary systems.',
  'FAA / ICAO 406 MHz ELT guidance: aircraft distress locating remains independent of Panacea.',
  'Starlink maritime/aviation may be used only as an authorized surface/air backhaul where service and local regulation permit.',
])
