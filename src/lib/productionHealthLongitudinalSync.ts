import type { Vitals } from './healthVitals.ts'
import {
  clinicalVitalToLongitudinalEvents,
  currentDeviceVitalsToLongitudinalEvents,
  selfVitalToLongitudinalEvents,
  vo2MaxToLongitudinalEvent,
  type BridgeSkippedRecord,
  type HealthStoreBridgeContext,
} from './healthStoreLongitudinalBridge.ts'
import {
  ingestLongitudinalBatch,
  type LongitudinalEvent,
  type LongitudinalPatientState,
} from './panaceaLongitudinalState.ts'
import type { SelfVital, VitalSign, Vo2MaxEntry } from './types.ts'

export interface ProductionHealthSyncRequest {
  state: LongitudinalPatientState
  subjectId: string
  clinicalVitals?: readonly VitalSign[]
  selfVitals?: readonly SelfVital[]
  vo2maxLog?: readonly Vo2MaxEntry[]
  currentVitals?: Vitals
  context: HealthStoreBridgeContext
}

export interface ProductionHealthSyncResult {
  state: LongitudinalPatientState
  candidateEventCount: number
  insertedEventCount: number
  duplicateEventCount: number
  skipped: BridgeSkippedRecord[]
}

function nonBlank(value: string) {
  return value.trim().length > 0
}

/**
 * Deterministic adapter from Panacea's existing production health stores into
 * the longitudinal kernel. This function is intentionally pure: it does not
 * read localStorage, call the network, or mutate the React store. Callers pass
 * the real records they already own, which keeps subject boundaries explicit
 * and makes replay/idempotency auditable.
 */
export function syncProductionHealthStores(
  request: ProductionHealthSyncRequest,
): ProductionHealthSyncResult {
  if (!nonBlank(request.subjectId)) throw new Error('request.subjectId must not be blank')
  if (request.subjectId.trim() !== request.state.subjectId) {
    throw new Error('request.subjectId does not match state.subjectId')
  }

  const events: LongitudinalEvent<number>[] = []
  const skipped: BridgeSkippedRecord[] = []
  const append = (result: { events: LongitudinalEvent<number>[]; skipped: BridgeSkippedRecord[] }) => {
    events.push(...result.events)
    skipped.push(...result.skipped)
  }

  for (const vital of request.clinicalVitals ?? []) {
    append(clinicalVitalToLongitudinalEvents(request.subjectId, vital, request.context))
  }
  for (const vital of request.selfVitals ?? []) {
    append(selfVitalToLongitudinalEvents(request.subjectId, vital, request.context))
  }
  for (const entry of request.vo2maxLog ?? []) {
    events.push(vo2MaxToLongitudinalEvent(request.subjectId, entry, request.context))
  }
  if (request.currentVitals) {
    append(currentDeviceVitalsToLongitudinalEvents(request.subjectId, request.currentVitals, request.context))
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
