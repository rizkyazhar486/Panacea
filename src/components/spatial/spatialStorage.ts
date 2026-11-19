import {
  buildCommandModePrefOutboxEvent,
  buildSpatialNeonSnapshotEvent,
  COMMAND_MODES,
  type CommandOperatingMode,
  type HolotableProtocolLever,
  type HolotableTrajectoryDelta,
  type RawTelemetrySample,
  type SpatialOutboxPayload,
} from '../../domains/spatial-os/index.ts'
import type { Vitals } from '../../lib/healthVitals'

export const NEON_OUTBOX_KEY = 'pmd_neon_sync_outbox_v1'
export const SPATIAL_MODE_KEY = 'pmd_spatial_command_mode_v1'
export const HOLOTABLE_SNAPSHOTS_KEY = 'pmd_holotable_snapshots_v1'
export const CLINICAL_NOTES_KEY = 'pmd_spatial_notes_v1'

export function readCommandMode(): CommandOperatingMode {
  try {
    const raw = localStorage.getItem(SPATIAL_MODE_KEY)
    if (raw && (COMMAND_MODES as readonly string[]).includes(raw)) {
      return raw as CommandOperatingMode
    }
  } catch { /* storage unavailable */ }
  return 'LIFE'
}

export function persistCommandMode(mode: CommandOperatingMode, profileKey: string): number {
  try {
    localStorage.setItem(SPATIAL_MODE_KEY, mode)
  } catch { /* ignore */ }
  const event = buildCommandModePrefOutboxEvent({
    profileKey,
    mode,
    recordedAtIso: new Date().toISOString(),
  })
  return enqueueNeonOutbox(event)
}

export function readNeonOutboxCount(): number {
  try {
    const parsed = JSON.parse(localStorage.getItem(NEON_OUTBOX_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

export function enqueueNeonOutbox(event: SpatialOutboxPayload): number {
  try {
    const existing = JSON.parse(localStorage.getItem(NEON_OUTBOX_KEY) || '[]')
    const list = Array.isArray(existing) ? existing : []
    list.push(event)
    const trimmed = list.slice(-100)
    localStorage.setItem(NEON_OUTBOX_KEY, JSON.stringify(trimmed))
    return trimmed.length
  } catch {
    return 0
  }
}

export interface StoredHolotableSnapshot {
  readonly id: string
  readonly recordedAtIso: string
  readonly mode: CommandOperatingMode
  readonly horizonMonths: number
  readonly activeLevers: readonly HolotableProtocolLever[]
  readonly deltas: readonly HolotableTrajectoryDelta[]
  readonly truthClass: 'simulated'
  readonly clinicallyReviewed: false
}

export function readHolotableSnapshots(): StoredHolotableSnapshot[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HOLOTABLE_SNAPSHOTS_KEY) || '[]')
    return Array.isArray(parsed) ? (parsed as StoredHolotableSnapshot[]) : []
  } catch {
    return []
  }
}

export function recordHolotableSnapshot(params: {
  readonly profileKey: string
  readonly mode: CommandOperatingMode
  readonly horizonMonths: number
  readonly activeLevers: readonly HolotableProtocolLever[]
  readonly deltas: readonly HolotableTrajectoryDelta[]
}): { readonly snapshot: StoredHolotableSnapshot; readonly outboxCount: number } {
  const recordedAtIso = new Date().toISOString()
  const event = buildSpatialNeonSnapshotEvent({
    profileKey: params.profileKey,
    mode: params.mode,
    recordedAtIso,
    horizonMonths: params.horizonMonths,
    activeLevers: params.activeLevers,
    deltas: params.deltas,
  })

  const snapshot: StoredHolotableSnapshot = {
    id: event.id,
    recordedAtIso,
    mode: params.mode,
    horizonMonths: params.horizonMonths,
    activeLevers: [...params.activeLevers],
    deltas: [...params.deltas],
    truthClass: 'simulated',
    clinicallyReviewed: false,
  }

  try {
    const existing = readHolotableSnapshots()
    localStorage.setItem(HOLOTABLE_SNAPSHOTS_KEY, JSON.stringify([snapshot, ...existing].slice(0, 24)))
  } catch { /* ignore */ }

  const outboxCount = enqueueNeonOutbox(event)
  return { snapshot, outboxCount }
}

export function readSpatialNotes(): string {
  try {
    return localStorage.getItem(CLINICAL_NOTES_KEY) || ''
  } catch {
    return ''
  }
}

export function saveSpatialNotes(text: string): void {
  try {
    localStorage.setItem(CLINICAL_NOTES_KEY, text)
  } catch { /* ignore */ }
}

/**
 * Builds a 7-day honest telemetry window from locally stored vitals & sleep logs.
 * Unrecorded days stay strictly `null` so the engine never fabricates zeros.
 */
export function buildLocalTelemetrySamples(
  vitals: Vitals,
  readinessCore: number | null,
): RawTelemetrySample[] {
  const days = ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'Yest', 'Today']
  const samples: RawTelemetrySample[] = days.slice(0, 6).map((label) => ({
    label,
    steps: null,
    sleepHours: null,
    restingHrBpm: null,
    hrvMs: null,
    vo2max: null,
    readinessCore: null,
    measured: true,
  }))

  // Attempt to hydrate historical readings if persisted by vitals-history
  try {
    const raw = localStorage.getItem('pmd_vitals_history_v1')
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed) && parsed.length > 0) {
      const recent = parsed.slice(-6) as Array<Record<string, unknown>>
      recent.forEach((entry, i) => {
        const slot = samples[samples.length - recent.length + i]
        if (!slot) return
        samples[samples.length - recent.length + i] = {
          label: typeof entry.date === 'string' ? entry.date.slice(5, 10) : slot.label,
          steps: typeof entry.steps === 'number' ? entry.steps : null,
          sleepHours: typeof entry.sleepH === 'number' ? entry.sleepH : null,
          restingHrBpm: typeof entry.restingHr === 'number' ? entry.restingHr : null,
          hrvMs: typeof entry.hrvMs === 'number' ? entry.hrvMs : null,
          vo2max: typeof entry.vo2max === 'number' ? entry.vo2max : null,
          readinessCore: null,
          measured: true,
        }
      })
    }
  } catch { /* ignore malformed history */ }

  const hasTodayMeasured =
    vitals.steps !== undefined ||
    vitals.sleepH !== undefined ||
    vitals.restingHr !== undefined ||
    vitals.heartRate !== undefined ||
    vitals.hrvMs !== undefined ||
    vitals.vo2max !== undefined

  samples.push({
    label: 'Today',
    steps: vitals.steps ?? null,
    sleepHours: vitals.sleepH ?? null,
    restingHrBpm: vitals.restingHr ?? vitals.heartRate ?? null,
    hrvMs: vitals.hrvMs ?? null,
    vo2max: vitals.vo2max ?? null,
    readinessCore: hasTodayMeasured ? readinessCore : null,
    measured: hasTodayMeasured,
  })

  return samples
}
