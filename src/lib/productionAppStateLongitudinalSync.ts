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
}

export interface ProductionAppStateSyncResult extends ProductionHealthSyncResult {
  personalStoresIncluded: boolean
  sourceCounts: {
    clinicalVitals: number
    selfVitals: number
    vo2max: number
    currentSharedVitals: 0 | 1
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

  return {
    ...sync,
    personalStoresIncluded: slice.personalStoresIncluded,
    sourceCounts: {
      clinicalVitals: slice.clinicalVitals.length,
      selfVitals: slice.selfVitals.length,
      vo2max: slice.vo2maxLog.length,
      currentSharedVitals: currentVitals ? 1 : 0,
    },
  }
}
