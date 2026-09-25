// Bridge: self-entered lab log (src/lib/lab.ts) + computed biological-age
// trajectory (src/lib/bioAgeTrajectory.ts) → the canonical longitudinal kernel
// (panaceaLongitudinalState.ts). Follows the same contract as
// healthStoreLongitudinalBridge.ts: pure, side-effect-free, no fabricated
// timestamps/confidence, unmappable input goes to `skipped` with a reason.
//
// REVIEW STATE, AND WHY IT IS NEVER 'not-required' HERE. `lab` is one of the
// CLINICIAN_REVIEW_DOMAINS in panaceaLongitudinalState.ts, so every bridged
// lab value genuinely has NOT been clinician-reviewed at the moment it enters
// the kernel — the only mechanism that turns a lab event into 'accepted' or
// 'rejected' is clinicalReviewWorkflow.ts's ledger
// (appendClinicalReviewDecision → materializeReviewedState), applied as a
// separate overlay after ingestion. There is no per-entry sign-off recorded
// anywhere upstream: LabPasienUntukDokter.tsx / api.reviewLab() write a
// TinjauanLabKlien annotation keyed by test TYPE + share id (a note plus an
// optional recheck date), not a per-value accept/reject decision, so it
// cannot honestly be read as event-level clinician acceptance. Defaulting to
// 'not-required' would misrepresent an unreviewed value as exempt from
// review; guessing 'accepted' would misrepresent it as signed off. The only
// honest state at bridge time is 'pending' — real, not fabricated — and
// downstream review continues exactly through the existing ledger contract.
//
// PhenoAge/biological-age points are domain 'longevity', which is NOT a
// CLINICIAN_REVIEW_DOMAINS member, so 'not-required' is the honest default
// there, matching every other longevity-domain bridge in
// healthStoreLongitudinalBridge.ts.

import { JENIS_LAB, type ButirLab } from './lab.ts'
import type { TitikUsiaBiologis } from './bioAgeTrajectory.ts'
import {
  validateLongitudinalEvent,
  type ConsentEnvelope,
  type LongitudinalEvent,
  type LongitudinalProvenance,
} from './panaceaLongitudinalState.ts'

export interface LabBridgeConfidence {
  labManualEntry: number
  bioAgeDerived: number
}

export interface LabBridgeContext {
  consent: ConsentEnvelope
  /** Time this bridge actually received/processed the stored record. */
  receivedAt: string
  /**
   * Explicit ingestion confidence supplied by the caller. The bridge does not
   * fabricate confidence from the numeric measurement itself.
   */
  confidence: LabBridgeConfidence
}

export type LabBridgeSkipReason =
  | 'unknown-lab-type'
  | 'invalid-record-id'
  | 'invalid-date'
  | 'invalid-value'

export interface LabBridgeSkippedRecord {
  sourceRecordId: string
  reason: LabBridgeSkipReason
  field?: string
}

export interface LabBridgeResult {
  events: LongitudinalEvent<number>[]
  skipped: LabBridgeSkippedRecord[]
}

const JENIS_BY_ID = new Map(JENIS_LAB.map((jenis) => [jenis.id, jenis] as const))
const TANGGAL = /^\d{4}-\d{2}-\d{2}$/
const ID_BUTIR = /^[A-Za-z0-9_-]{1,64}$/

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be blank`)
}

function assertConfidence(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${field} must be in [0,1]`)
}

function validateContext(context: LabBridgeContext) {
  parseIso(context.receivedAt, 'context.receivedAt')
  assertConfidence(context.confidence.labManualEntry, 'context.confidence.labManualEntry')
  assertConfidence(context.confidence.bioAgeDerived, 'context.confidence.bioAgeDerived')
}

function idToken(value: string) {
  return value.trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function makeNumericEvent(args: {
  id: string
  subjectId: string
  metric: string
  domain: LongitudinalEvent['domain']
  value: number
  unit: string
  recordedAt: string
  confidence: number
  provenance: LongitudinalProvenance
  consent: ConsentEnvelope
  reviewState: 'pending' | 'not-required'
  tags: readonly string[]
}): LongitudinalEvent<number> {
  const event: LongitudinalEvent<number> = {
    id: args.id,
    subjectId: args.subjectId,
    metric: args.metric,
    domain: args.domain,
    value: args.value,
    unit: args.unit,
    recordedAt: args.recordedAt,
    confidence: args.confidence,
    provenance: { ...args.provenance },
    consent: { ...args.consent, purposes: [...args.consent.purposes] },
    review: { state: args.reviewState },
    tags: [...new Set(args.tags.filter(Boolean))],
  }
  validateLongitudinalEvent(event)
  return event
}

/** Metric naming: `lab-<JenisLab.id>`, the same id already used as the taxonomy key in JENIS_LAB — no new taxonomy invented. */
export function labMetricFor(jenisId: string): string {
  return `lab-${jenisId}`
}

/**
 * One lab type's history → longitudinal events. `jenisId` must be a real key
 * in JENIS_LAB; unit comes from that entry's own `satuan`, never guessed.
 */
export function labEntriesToLongitudinalEvents(
  subjectId: string,
  jenisId: string,
  butir: readonly ButirLab[],
  context: LabBridgeContext,
): LabBridgeResult {
  validateContext(context)
  assertNonBlank(subjectId, 'subjectId')
  assertNonBlank(jenisId, 'jenisId')

  const jenis = JENIS_BY_ID.get(jenisId)
  if (!jenis) {
    return { events: [], skipped: butir.map((b) => ({ sourceRecordId: b?.id ?? jenisId, reason: 'unknown-lab-type' as const })) }
  }

  const metric = labMetricFor(jenis.id)
  const events: LongitudinalEvent<number>[] = []
  const skipped: LabBridgeSkippedRecord[] = []

  for (const b of butir) {
    const sourceRecordId = typeof b?.id === 'string' && b.id ? b.id : `${jenisId}:unknown`
    if (typeof b?.id !== 'string' || !ID_BUTIR.test(b.id)) {
      skipped.push({ sourceRecordId, reason: 'invalid-record-id', field: 'id' })
      continue
    }
    if (typeof b.tanggal !== 'string' || !TANGGAL.test(b.tanggal) || Number.isNaN(Date.parse(`${b.tanggal}T00:00:00Z`))) {
      skipped.push({ sourceRecordId, reason: 'invalid-date', field: 'tanggal' })
      continue
    }
    if (typeof b.nilai !== 'number' || !Number.isFinite(b.nilai) || b.nilai <= 0) {
      skipped.push({ sourceRecordId, reason: 'invalid-value', field: 'nilai' })
      continue
    }

    const recordedAt = `${b.tanggal}T00:00:00.000Z`
    const tags = ['store:lab-log', `lab-type:${jenis.id}`, `record:${b.id}`]
    if (typeof b.rujukanBawah === 'number') tags.push(`ref-low:${b.rujukanBawah}`)
    if (typeof b.rujukanAtas === 'number') tags.push(`ref-high:${b.rujukanAtas}`)

    events.push(makeNumericEvent({
      id: `store:lab:${idToken(subjectId)}:${idToken(b.id)}:${metric}`,
      subjectId,
      metric,
      domain: 'lab',
      value: b.nilai,
      unit: jenis.satuan,
      recordedAt,
      confidence: context.confidence.labManualEntry,
      provenance: {
        sourceKind: 'manual',
        sourceId: 'panaceamed:lab-log',
        capturedAt: recordedAt,
        receivedAt: context.receivedAt,
        method: 'self-entered-lab-report',
      },
      consent: context.consent,
      // Honest, not fabricated: see the file-level comment on review state.
      reviewState: 'pending',
      tags,
    }))
  }

  return { events, skipped }
}

/** The full local lab log (`ambilLab()`'s shape: jenisId → ButirLab[]) → longitudinal events, one lab type at a time. */
export function labLogToLongitudinalEvents(
  subjectId: string,
  log: Record<string, readonly ButirLab[]>,
  context: LabBridgeContext,
): LabBridgeResult {
  const events: LongitudinalEvent<number>[] = []
  const skipped: LabBridgeSkippedRecord[] = []
  for (const [jenisId, butir] of Object.entries(log)) {
    const result = labEntriesToLongitudinalEvents(subjectId, jenisId, butir, context)
    events.push(...result.events)
    skipped.push(...result.skipped)
  }
  return { events, skipped }
}

/**
 * One already-computed biological-age trajectory point (bioAgeTrajectory.ts)
 * → longitudinal events. This bridge does not compute PhenoAge itself; it
 * only projects a value the caller already derived via `phenoAge()` /
 * `titikDariRiwayatLab()`.
 */
export function bioAgeTrajectoryPointToLongitudinalEvents(
  subjectId: string,
  titik: TitikUsiaBiologis,
  context: LabBridgeContext,
): LabBridgeResult {
  validateContext(context)
  assertNonBlank(subjectId, 'subjectId')

  const sourceRecordId = titik?.tanggal ?? 'unknown-bioage-point'
  if (!TANGGAL.test(titik?.tanggal ?? '') || Number.isNaN(Date.parse(`${titik.tanggal}T00:00:00Z`))) {
    return { events: [], skipped: [{ sourceRecordId, reason: 'invalid-date', field: 'tanggal' }] }
  }
  if (!Number.isFinite(titik.phenoAge) || !Number.isFinite(titik.ageGap)) {
    return { events: [], skipped: [{ sourceRecordId, reason: 'invalid-value', field: 'phenoAge' }] }
  }

  const recordedAt = `${titik.tanggal}T00:00:00.000Z`
  const provenance: LongitudinalProvenance = {
    sourceKind: 'derived',
    sourceId: 'panaceamed:bioage-trajectory',
    capturedAt: recordedAt,
    receivedAt: context.receivedAt,
    method: titik.metode,
  }
  const tags = ['store:bioage-trajectory', `record:${titik.tanggal}`]

  const events = [
    makeNumericEvent({
      id: `store:bioage:${idToken(subjectId)}:${idToken(titik.tanggal)}:phenoage`,
      subjectId,
      metric: 'phenoage',
      domain: 'longevity',
      value: titik.phenoAge,
      unit: 'years',
      recordedAt,
      confidence: context.confidence.bioAgeDerived,
      provenance,
      consent: context.consent,
      reviewState: 'not-required',
      tags,
    }),
    makeNumericEvent({
      id: `store:bioage:${idToken(subjectId)}:${idToken(titik.tanggal)}:phenoage-age-gap`,
      subjectId,
      metric: 'phenoage-age-gap',
      domain: 'longevity',
      value: titik.ageGap,
      unit: 'years',
      recordedAt,
      confidence: context.confidence.bioAgeDerived,
      provenance,
      consent: context.consent,
      reviewState: 'not-required',
      tags,
    }),
  ]

  return { events, skipped: [] }
}

/** A whole trajectory (bioAgeTrajectory.ts's `hitungTrajektori().titik` or `ambilTrajektori()`) → longitudinal events. */
export function bioAgeTrajectoryToLongitudinalEvents(
  subjectId: string,
  titikList: readonly TitikUsiaBiologis[],
  context: LabBridgeContext,
): LabBridgeResult {
  const events: LongitudinalEvent<number>[] = []
  const skipped: LabBridgeSkippedRecord[] = []
  for (const titik of titikList) {
    const result = bioAgeTrajectoryPointToLongitudinalEvents(subjectId, titik, context)
    events.push(...result.events)
    skipped.push(...result.skipped)
  }
  return { events, skipped }
}
