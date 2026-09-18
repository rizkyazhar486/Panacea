import type { AppState, SelfVital, VitalSign, Vo2MaxEntry } from './types.ts'

export type ProductionHealthStoreScope = 'clinical-only' | 'personal-plus-clinical'
export type ProductionHealthStoreState = Pick<AppState, 'vitals' | 'selfVitals' | 'vo2maxLog' | 'account'>

export interface ProductionHealthStoreSlice {
  subjectId: string
  clinicalVitals: readonly VitalSign[]
  selfVitals: readonly SelfVital[]
  vo2maxLog: readonly Vo2MaxEntry[]
  personalStoresIncluded: boolean
}

/**
 * Select only the records a longitudinal subject is allowed to ingest.
 *
 * Clinical vitals are already keyed by patientId. Personal self-tracking arrays
 * are account-global in the legacy store, so they must never be attached to an
 * arbitrary active clinical patient. The personal scope therefore requires the
 * signed-in account's patientId to equal the requested longitudinal subjectId.
 */
export function selectProductionHealthStoreSlice(
  store: ProductionHealthStoreState,
  subjectId: string,
  scope: ProductionHealthStoreScope,
): ProductionHealthStoreSlice {
  const normalizedSubjectId = subjectId.trim()
  if (!normalizedSubjectId) throw new Error('subjectId must not be blank')

  const clinicalVitals = store.vitals[normalizedSubjectId] ?? []
  if (scope === 'clinical-only') {
    return {
      subjectId: normalizedSubjectId,
      clinicalVitals,
      selfVitals: [],
      vo2maxLog: [],
      personalStoresIncluded: false,
    }
  }

  if (store.account?.patientId !== normalizedSubjectId) {
    throw new Error('personal store scope requires account.patientId to match subjectId')
  }

  return {
    subjectId: normalizedSubjectId,
    clinicalVitals,
    selfVitals: store.selfVitals,
    vo2maxLog: store.vo2maxLog,
    personalStoresIncluded: true,
  }
}
