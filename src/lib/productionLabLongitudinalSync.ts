import {
  bioAgeTrajectoryToLongitudinalEvents,
  labLogToLongitudinalEvents,
  type LabBridgeContext,
  type LabBridgeSkippedRecord,
} from './labLongitudinalBridge.ts'
import {
  ingestLongitudinalBatch,
  type LongitudinalEvent,
  type LongitudinalPatientState,
} from './panaceaLongitudinalState.ts'
import type { ButirLab } from './lab.ts'
import type { TitikUsiaBiologis } from './bioAgeTrajectory.ts'

export interface ProductionLabSyncRequest {
  state: LongitudinalPatientState
  subjectId: string
  /** Shape of `ambilLab()`: lab-type id → that type's history. */
  labByType?: Record<string, readonly ButirLab[]>
  /** Shape of `ambilTrajektori()` / `hitungTrajektori().titik`. */
  bioAgeTrajectory?: readonly TitikUsiaBiologis[]
  context: LabBridgeContext
}

export interface ProductionLabSyncResult {
  state: LongitudinalPatientState
  candidateEventCount: number
  insertedEventCount: number
  duplicateEventCount: number
  skipped: LabBridgeSkippedRecord[]
}

function nonBlank(value: string) {
  return value.trim().length > 0
}

/**
 * Deterministic adapter from Panacea's existing lab log + biological-age
 * trajectory stores into the longitudinal kernel. Mirrors
 * productionHealthLongitudinalSync.ts's shape exactly: pure, no
 * localStorage/network access, real caller-owned records only, idempotent by
 * event id.
 */
export function syncProductionLabStores(
  request: ProductionLabSyncRequest,
): ProductionLabSyncResult {
  if (!nonBlank(request.subjectId)) throw new Error('request.subjectId must not be blank')
  if (request.subjectId.trim() !== request.state.subjectId) {
    throw new Error('request.subjectId does not match state.subjectId')
  }

  const events: LongitudinalEvent<number>[] = []
  const skipped: LabBridgeSkippedRecord[] = []

  if (request.labByType) {
    const result = labLogToLongitudinalEvents(request.subjectId, request.labByType, request.context)
    events.push(...result.events)
    skipped.push(...result.skipped)
  }
  if (request.bioAgeTrajectory) {
    const result = bioAgeTrajectoryToLongitudinalEvents(request.subjectId, request.bioAgeTrajectory, request.context)
    events.push(...result.events)
    skipped.push(...result.skipped)
  }

  // Stable ordering keeps replay/debug output deterministic even when source
  // arrays arrive in different orders. Event IDs remain the idempotency key.
  events.sort((left, right) =>
    Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || left.id.localeCompare(right.id),
  )

  const revisionBefore = request.state.revision
  const nextState = ingestLongitudinalBatch(request.state, events)
  const insertedEventCount = nextState.revision - revisionBefore
  const candidateEventCount = events.length

  return {
    state: nextState,
    candidateEventCount,
    insertedEventCount,
    duplicateEventCount: candidateEventCount - insertedEventCount,
    skipped,
  }
}
