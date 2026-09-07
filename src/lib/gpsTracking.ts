export type GpsTrackSport = 'run' | 'walk' | 'cycle'

export interface GpsFix {
  lat: number
  lng: number
  accuracyM: number
  timestampMs: number
  speedMps?: number | null
}

export interface GpsTrackPoint extends GpsFix {
  cumulativeM: number
  segment: number
}

export interface GpsSplit {
  km: number
  splitSec: number
  movingSec: number
}

export interface MotionGate {
  moving: boolean
  belowSinceMs?: number
  aboveSinceMs?: number
}

interface RecentSegment {
  distanceM: number
  movingMs: number
}

export interface GpsTrackState {
  startedAtMs: number
  elapsedMs: number
  totalM: number
  movingMs: number
  points: GpsTrackPoint[]
  splits: GpsSplit[]
  motion: MotionGate
  lastFix?: GpsFix
  segment: number
  rejectedAccuracy: number
  rejectedJump: number
  rejectedInvalid: number
  recentSegments: RecentSegment[]
}

const EARTH_RADIUS_M = 6_371_008.8
const MAX_ACCURACY_M = 35
const LONG_GAP_MS = 120_000
const MAX_SPEED_MPS: Record<GpsTrackSport, number> = {
  walk: 4.5,
  run: 12,
  cycle: 30,
}

export function haversineM(a: Pick<GpsFix, 'lat' | 'lng'>, b: Pick<GpsFix, 'lat' | 'lng'>): number {
  const rad = Math.PI / 180
  const p1 = a.lat * rad
  const p2 = b.lat * rad
  const dp = (b.lat - a.lat) * rad
  const dl = (b.lng - a.lng) * rad
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function isValidGpsFix(fix: GpsFix): boolean {
  return Number.isFinite(fix.lat) && Number.isFinite(fix.lng) &&
    Number.isFinite(fix.accuracyM) && Number.isFinite(fix.timestampMs) &&
    fix.lat >= -90 && fix.lat <= 90 && fix.lng >= -180 && fix.lng <= 180 &&
    fix.accuracyM >= 0
}

export function newGpsTrack(startedAtMs: number): GpsTrackState {
  return {
    startedAtMs,
    elapsedMs: 0,
    totalM: 0,
    movingMs: 0,
    points: [],
    splits: [],
    motion: { moving: false },
    segment: 0,
    rejectedAccuracy: 0,
    rejectedJump: 0,
    rejectedInvalid: 0,
    recentSegments: [],
  }
}

export function updateMotionGate(gate: MotionGate, speedMps: number, nowMs: number): MotionGate {
  const PAUSE_AT = 0.55
  const RESUME_AT = 0.9
  const PAUSE_DWELL_MS = 8_000
  const RESUME_DWELL_MS = 3_000

  if (gate.moving) {
    if (speedMps <= PAUSE_AT) {
      const belowSinceMs = gate.belowSinceMs ?? nowMs
      if (nowMs - belowSinceMs >= PAUSE_DWELL_MS) return { moving: false }
      return { moving: true, belowSinceMs }
    }
    return { moving: true }
  }

  if (speedMps >= RESUME_AT) {
    const aboveSinceMs = gate.aboveSinceMs ?? nowMs
    if (nowMs - aboveSinceMs >= RESUME_DWELL_MS) return { moving: true }
    return { moving: false, aboveSinceMs }
  }
  return { moving: false }
}

function elapsed(state: GpsTrackState, timestampMs: number): number {
  return Math.max(state.elapsedMs, Math.max(0, timestampMs - state.startedAtMs))
}

export function advanceGpsTrack(state: GpsTrackState, fix: GpsFix, sport: GpsTrackSport): GpsTrackState {
  const elapsedMs = elapsed(state, fix.timestampMs)
  if (!isValidGpsFix(fix)) return { ...state, elapsedMs, rejectedInvalid: state.rejectedInvalid + 1 }
  if (fix.accuracyM > MAX_ACCURACY_M) return { ...state, elapsedMs, rejectedAccuracy: state.rejectedAccuracy + 1 }

  if (!state.lastFix) {
    return {
      ...state,
      elapsedMs,
      lastFix: fix,
      points: [{ ...fix, cumulativeM: 0, segment: state.segment }],
    }
  }

  const dtMs = fix.timestampMs - state.lastFix.timestampMs
  if (dtMs <= 0) return { ...state, elapsedMs, rejectedInvalid: state.rejectedInvalid + 1 }

  // A backgrounded PWA can return minutes later. Start a new visual segment
  // rather than drawing a fictitious straight line through the signal gap.
  if (dtMs > LONG_GAP_MS) {
    const segment = state.segment + 1
    return {
      ...state,
      elapsedMs,
      lastFix: fix,
      segment,
      motion: { moving: false },
      points: [...state.points, { ...fix, cumulativeM: state.totalM, segment }],
      recentSegments: [],
    }
  }

  const rawDistanceM = haversineM(state.lastFix, fix)
  const dtSec = dtMs / 1000
  const rawSpeedMps = rawDistanceM / dtSec
  if (rawSpeedMps > MAX_SPEED_MPS[sport]) {
    return { ...state, elapsedMs, rejectedJump: state.rejectedJump + 1 }
  }

  // GPS noise must exceed a small accuracy-aware floor before it is allowed to
  // add route distance. This is intentionally conservative: under-counting a
  // few metres is preferable to inventing distance while the user is still.
  const noiseFloorM = Math.max(2, Math.min(12, (state.lastFix.accuracyM + fix.accuracyM) * 0.15))
  const distanceM = rawDistanceM >= noiseFloorM && rawSpeedMps >= 0.35 ? rawDistanceM : 0
  const motion = updateMotionGate(state.motion, distanceM > 0 ? rawSpeedMps : 0, fix.timestampMs)
  const movingDeltaMs = state.motion.moving ? Math.min(dtMs, 30_000) : 0
  const totalM = state.totalM + distanceM
  const movingMs = state.movingMs + movingDeltaMs

  const splits = [...state.splits]
  const previousKm = Math.floor(state.totalM / 1000)
  const nextKm = Math.floor(totalM / 1000)
  for (let km = previousKm + 1; km <= nextKm; km++) {
    const thresholdM = km * 1000
    const fraction = distanceM > 0 ? Math.max(0, Math.min(1, (thresholdM - state.totalM) / distanceM)) : 1
    const crossingMovingMs = state.movingMs + movingDeltaMs * fraction
    const priorMovingMs = splits.length ? splits[splits.length - 1].movingSec * 1000 : 0
    const splitSec = Math.max(0, (crossingMovingMs - priorMovingMs) / 1000)
    splits.push({ km, splitSec, movingSec: crossingMovingMs / 1000 })
  }

  const recentSegments = [...state.recentSegments, { distanceM, movingMs: movingDeltaMs }].slice(-20)
  return {
    ...state,
    elapsedMs,
    lastFix: fix,
    totalM,
    movingMs,
    motion,
    splits,
    recentSegments,
    points: [...state.points, { ...fix, cumulativeM: totalM, segment: state.segment }].slice(-1200),
  }
}

export function recentPaceSecPerKm(state: GpsTrackState): number | undefined {
  let distanceM = 0
  let movingMs = 0
  for (let i = state.recentSegments.length - 1; i >= 0; i--) {
    const s = state.recentSegments[i]
    if (s.distanceM <= 0 || s.movingMs <= 0) continue
    distanceM += s.distanceM
    movingMs += s.movingMs
    if (distanceM >= 300) break
  }
  if (distanceM < 50 || movingMs <= 0) return undefined
  return (movingMs / 1000) / (distanceM / 1000)
}

export function downsampleRoute<T extends { lat: number; lng: number }>(points: T[], maxPoints = 240): T[] {
  if (points.length <= maxPoints) return points
  const out: T[] = []
  const step = (points.length - 1) / (maxPoints - 1)
  for (let i = 0; i < maxPoints; i++) out.push(points[Math.round(i * step)])
  return out
}

function privacyLegM<T extends { lat: number; lng: number; segment?: number }>(a: T, b: T): number {
  // A segment change means there was a long period with no trustworthy GPS.
  // Never treat that unknown interval as a real straight-line distance when
  // deciding whether the privacy buffer has been satisfied.
  if ((a.segment ?? 0) !== (b.segment ?? 0)) return 0
  return haversineM(a, b)
}

export function privacyTrimRoute<T extends { lat: number; lng: number; segment?: number }>(points: T[], bufferM = 200): T[] {
  if (points.length < 3 || bufferM <= 0) return points
  let fromStart = 0
  let startIndex = 0
  for (let i = 1; i < points.length; i++) {
    fromStart += privacyLegM(points[i - 1], points[i])
    if (fromStart >= bufferM) { startIndex = i; break }
  }
  let fromEnd = 0
  let endIndex = points.length - 1
  for (let i = points.length - 2; i >= 0; i--) {
    fromEnd += privacyLegM(points[i + 1], points[i])
    if (fromEnd >= bufferM) { endIndex = i; break }
  }
  // Short or discontinuous activities remain route-private rather than
  // claiming a privacy buffer that could only be satisfied by an unknown gap.
  if (startIndex <= 0 || endIndex >= points.length - 1 || endIndex - startIndex < 2) return []
  return points.slice(startIndex, endIndex + 1)
}
