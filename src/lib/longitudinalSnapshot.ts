import type { Account, EMRRecord } from './types'
import type { Vitals } from './healthVitals'
import type { ButirLab } from './lab'
import type { ProductionHealthStoreState } from './productionHealthStoreSelector'
import type { ContinuousCarePlan, DailyAnamnesisSubmissionInput } from './continuousCareOperatingSystem'
import { labLogToLongitudinalEvents } from './labLongitudinalBridge'
import { careToLongitudinalEvents, type TinjauanMasuk } from './careLongitudinalBridge'
import { emrRecordToLongitudinalEvents, emrVitalsToLongitudinalEvents, LABEL_METRIK_VITAL_EMR, type ServerAcceptedEmrRecord, type VitalTercatat } from './emrLongitudinalBridge'
import { syncProductionAppState } from './productionAppStateLongitudinalSync'
import { createLongitudinalPatientState, ingestLongitudinalEvent, type ConsentEnvelope, type LongitudinalPatientState } from './panaceaLongitudinalState'

export interface LongitudinalServerSources {
  owner: Account | null
  plans: { plan: ContinuousCarePlan; reports: DailyAnamnesisSubmissionInput[] }[]
  reviews: TinjauanMasuk[]
  records: Record<string, EMRRecord>
  vitals: Record<string, VitalTercatat[]>
  encounters: Record<string, EMRRecord[]>
}
export const emptyLongitudinalServer = (): LongitudinalServerSources => ({ owner: null, plans: [], reviews: [], records: {}, vitals: {}, encounters: {} })
export interface LongitudinalSources {
  app: ProductionHealthStoreState
  local: { owner: Account | null; labs: Record<string, ButirLab[]>; vitals: Vitals }
  server: LongitudinalServerSources
}
export interface LongitudinalSnapshot {
  /** Source revision, distinct from the canonical event-ingestion revision. */
  revision: number
  state: LongitudinalPatientState | null
  skipped: number
  labels: Record<string, string>
  labSource: 'server' | 'browser'
  /** Shared lab+care+clinical+device envelope arrived from the authenticated server. */
  serverSource: 'server' | 'browser'
  deviceSource: 'server' | 'browser'
  selfSource: 'server' | 'browser'
  vo2Source: 'server' | 'browser'
}
const KEPERCAYAAN_CATATAN = 1
export function sameLongitudinalPatient(a: Account | null, b: Account | null): boolean {
  return !!a && !!b && a.id === b.id && a.patientId === b.patientId && a.email === b.email
}
export function sameLongitudinalOwner(a: Account | null, b: Account | null): boolean {
  return sameLongitudinalPatient(a, b) && a!.loggedAt === b!.loggedAt && a!.role === b!.role
}

// When the signed-in server has answered, its stored lab log is the shared
// state. The browser copy is only the offline fallback.
export function sumberLabLongitudinal<T>(server: T | null, browser: T): { labs: T; source: 'server' | 'browser' } {
  if (server) return { labs: server, source: 'server' }
  return { labs: browser, source: 'browser' }
}

// Health-profile vitals on the server replace the browser device snapshot.
export function sumberVitalsLongitudinal<T extends Record<string, unknown>>(
  server: Record<string, number> | null,
  browser: T,
): { vitals: T | (T & Record<string, number>); source: 'server' | 'browser' } {
  if (server) return { vitals: { ...browser, ...server }, source: 'server' }
  return { vitals: browser, source: 'browser' }
}

// Prefer health-profile-derived rows when the server returned any; otherwise keep
// AppState-only entries that were never synced to the profile.
export function sumberDeretLongitudinal<T>(server: T[] | null, browser: readonly T[]): { rows: readonly T[]; source: 'server' | 'browser' } {
  if (server && server.length > 0) return { rows: server, source: 'server' }
  return { rows: browser, source: 'browser' }
}

// The existing canonical bridges remain the only path into patient truth.
export function projectLongitudinalSnapshot(sources: LongitudinalSources, kini = new Date().toISOString()): Omit<LongitudinalSnapshot, 'revision' | 'labSource' | 'serverSource' | 'deviceSource' | 'selfSource' | 'vo2Source'> {
  const { app } = sources
  const account = app.account
  const subjectId = account?.patientId
  if (!account || !subjectId) return { state: null, skipped: 0, labels: {} }
  const server = sameLongitudinalOwner(sources.server.owner, account) ? sources.server : emptyLongitudinalServer()
  const local = sameLongitudinalPatient(sources.local.owner, account) ? sources.local : { labs: {}, vitals: {} }
  const consent: ConsentEnvelope = { granted: true, purposes: ['personal-visualization'], grantedAt: new Date(0).toISOString() }
  let state = createLongitudinalPatientState(subjectId, kini)
  let skipped = 0
  try {
    const r = syncProductionAppState({
      state, appState: app, subjectId, scope: 'personal-plus-clinical', currentVitals: local.vitals,
      context: { consent, receivedAt: kini, confidence: { clinicalVital: KEPERCAYAAN_CATATAN, selfVital: KEPERCAYAAN_CATATAN, vo2max: KEPERCAYAAN_CATATAN, deviceSnapshot: KEPERCAYAAN_CATATAN } },
    })
    state = r.state; skipped += r.skipped.length
  } catch { skipped++ }
  const lab = labLogToLongitudinalEvents(local.labs, subjectId, { consent, receivedAt: kini, confidence: KEPERCAYAAN_CATATAN })
  skipped += lab.skipped.length
  for (const ev of lab.events) {
    try { state = ingestLongitudinalEvent(state, ev).state } catch { skipped++ }
  }
  const care = careToLongitudinalEvents(server.plans, server.reviews, subjectId, consent, kini)
  skipped += care.skipped
  for (const ev of care.events) {
    try { state = ingestLongitudinalEvent(state, ev).state } catch { skipped++ }
  }
  if (account.role === 'pasien') {
    // Only the self-scoped endpoint supplies these records. Server signature
    // and recorder provenance are still validated by the existing bridges.
    for (const record of [...Object.values(server.encounters).flat(), ...Object.values(server.records)] as ServerAcceptedEmrRecord[]) {
      const emr = emrRecordToLongitudinalEvents(record, subjectId, consent, kini)
      skipped += emr.skipped
      for (const ev of emr.events) {
        try { state = ingestLongitudinalEvent(state, ev).state } catch { skipped++ }
      }
    }
    for (const vitals of Object.values(server.vitals)) {
      const vit = emrVitalsToLongitudinalEvents(vitals, subjectId, consent, kini)
      skipped += vit.skipped
      for (const ev of vit.events) {
        try { state = ingestLongitudinalEvent(state, ev).state } catch { skipped++ }
      }
    }
  }
  return { state, skipped, labels: { ...care.labels, 'emr.signed-note': 'Signed clinical record', 'emr.primary-diagnosis': 'Primary diagnosis', 'emr.verified-plan': 'Verified care plan', ...LABEL_METRIK_VITAL_EMR } }
}

// One derived snapshot per provider, never a persisted or independently edited
// patient store. Immutable source references are the invalidation contract.
export function createLongitudinalSnapshotCache(project = projectLongitudinalSnapshot) {
  let previous: LongitudinalSources | undefined
  let snapshot: LongitudinalSnapshot | undefined
  let revision = 0
  // Legacy personal arrays are not patient-keyed. A session switch must not
  // relabel already-observed rows, including when a new row is prepended.
  const owners = new WeakMap<object, string>()
  function ownedRows<T extends object>(rows: readonly T[], owner: string): T[] {
    if (!Array.isArray(rows)) return []
    return rows.filter(row => {
      if (!row || typeof row !== 'object') return false
      if (!owners.has(row)) owners.set(row, owner)
      return owners.get(row) === owner
    })
  }
  return {
    read(sources: LongitudinalSources): LongitudinalSnapshot {
      if (snapshot && previous?.app === sources.app && previous.local === sources.local && previous.server === sources.server) return snapshot
      const account = sources.app.account
      const owner = account ? JSON.stringify([account.id, account.email, account.patientId]) : null
      const app = owner ? { ...sources.app, selfVitals: ownedRows(sources.app.selfVitals, owner), vo2maxLog: ownedRows(sources.app.vo2maxLog, owner) } : sources.app
      const next = project({ ...sources, app })
      previous = sources
      snapshot = { ...next, revision: ++revision, labSource: 'browser', serverSource: 'browser', deviceSource: 'browser', selfSource: 'browser', vo2Source: 'browser' }
      return snapshot
    },
  }
}
