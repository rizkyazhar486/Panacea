import type { Vitals } from './healthVitals.ts'
import type { HealthStoreBridgeContext } from './healthStoreLongitudinalBridge.ts'
import {
  syncProductionHealthStores,
  type ProductionHealthSyncResult,
} from './productionHealthLongitudinalSync.ts'
import {
  selectProductionHealthStoreSlice,
  type ProductionHealthStoreScope,
  type ProductionHealthStoreState,
} from './productionHealthStoreSelector.ts'
import type { LongitudinalPatientState } from './panaceaLongitudinalState.ts'
import type { BridgeSkippedRecord } from './healthStoreLongitudinalBridge.ts'
import type { LabBridgeContext, LabBridgeSkippedRecord } from './labLongitudinalBridge.ts'
import { syncProductionLabStores } from './productionLabLongitudinalSync.ts'
import type { ButirLab } from './lab.ts'
import type { TitikUsiaBiologis } from './bioAgeTrajectory.ts'

export interface ProductionAppStateSyncRequest {
  state: LongitudinalPatientState
  appState: ProductionHealthStoreState
  subjectId: string
  scope: ProductionHealthStoreScope
  /**
   * The shared healthVitals snapshot is account-global. It is therefore only
   * eligible when the selector authorizes the personal account scope.
   */
  currentVitals?: Vitals
  context: HealthStoreBridgeContext
  /**
   * Lab log and biological-age trajectory are not part of legacy AppState
   * (they live in their own localStorage-backed modules — see src/lib/lab.ts
   * and src/lib/bioAgeTrajectory.ts), so they are passed explicitly rather
   * than selected from `appState`. Like `currentVitals`, they are personal,
   * self-entered/derived data and are therefore only eligible in the
   * personal-plus-clinical scope, gated the same way as selfVitals/vo2max.
   */
  labByType?: Record<string, readonly ButirLab[]>
  bioAgeTrajectory?: readonly TitikUsiaBiologis[]
  labContext?: LabBridgeContext
}

export interface ProductionAppStateSyncResult extends Omit<ProductionHealthSyncResult, 'skipped'> {
  /** Union of the health-store bridge's and the lab bridge's skip reasons. */
  skipped: readonly (BridgeSkippedRecord | LabBridgeSkippedRecord)[]
  personalStoresIncluded: boolean
  sourceCounts: {
    clinicalVitals: number
    selfVitals: number
    vo2max: number
    currentSharedVitals: 0 | 1
    labTypes: number
    labResults: number
    bioAgePoints: number
  }
}

/**
 * Compose the legacy AppState selector with the longitudinal ingestion layer.
 *
 * This is the canonical pure boundary for production store snapshots. It keeps
 * account-global personal/self/device data out of arbitrary clinical subjects
 * and leaves consent/confidence policy explicit at the call site.
 */
export function syncProductionAppState(
  request: ProductionAppStateSyncRequest,
): ProductionAppStateSyncResult {
  const slice = selectProductionHealthStoreSlice(
    request.appState,
    request.subjectId,
    request.scope,
  )

  const currentVitals = slice.personalStoresIncluded ? request.currentVitals : undefined
  const sync = syncProductionHealthStores({
    state: request.state,
    subjectId: slice.subjectId,
    clinicalVitals: slice.clinicalVitals,
    selfVitals: slice.selfVitals,
    vo2maxLog: slice.vo2maxLog,
    currentVitals,
    context: request.context,
  })

  // Lab log and biological-age trajectory are self-entered/derived personal
  // data outside legacy AppState, so they follow the same personal-scope gate
  // as selfVitals/vo2max/currentVitals rather than being attached to an
  // arbitrary clinical subject. Chained onto the health-store result state so
  // both bridges ingest into one longitudinal state/revision.
  const labByType = slice.personalStoresIncluded ? request.labByType : undefined
  const bioAgeTrajectory = slice.personalStoresIncluded ? request.bioAgeTrajectory : undefined
  const labResultCount = labByType ? Object.values(labByType).reduce((sum, list) => sum + list.length, 0) : 0
  const bioAgePointCount = bioAgeTrajectory?.length ?? 0

  let finalState = sync.state
  let candidateEventCount = sync.candidateEventCount
  let insertedEventCount = sync.insertedEventCount
  let duplicateEventCount = sync.duplicateEventCount
  let skipped: (BridgeSkippedRecord | LabBridgeSkippedRecord)[] = [...sync.skipped]

  if ((labByType || bioAgeTrajectory) && request.labContext) {
    const labSync = syncProductionLabStores({
      state: finalState,
      subjectId: slice.subjectId,
      labByType,
      bioAgeTrajectory,
      context: request.labContext,
    })
    finalState = labSync.state
    candidateEventCount += labSync.candidateEventCount
    insertedEventCount += labSync.insertedEventCount
    duplicateEventCount += labSync.duplicateEventCount
    skipped = [...skipped, ...labSync.skipped]
  }

  return {
    state: finalState,
    candidateEventCount,
    insertedEventCount,
    duplicateEventCount,
    skipped,
    personalStoresIncluded: slice.personalStoresIncluded,
    sourceCounts: {
      clinicalVitals: slice.clinicalVitals.length,
      selfVitals: slice.selfVitals.length,
      vo2max: slice.vo2maxLog.length,
      currentSharedVitals: currentVitals ? 1 : 0,
      labTypes: labByType ? Object.keys(labByType).length : 0,
      labResults: labResultCount,
      bioAgePoints: bioAgePointCount,
    },
  }
}
