// "Your systems" board: one row per body system with the person's own latest measured signal, or an explicit
// "nothing recorded". Pure: the caller injects `now`. It states how long ago something was recorded, never
// whether a value is good or bad, and it never fills a system that has no data with a guess.
import { BODY_SYSTEM_SOURCE_WAVE, type BodySystemId } from '../data/bodySystems'
import type { SinyalSistem } from '../../../lib/sinyalPribadiSistem'

/** Display convention only (not a clinical threshold): recorded within the last 30 days. */
export const RECENT_DAYS = 30
const DAY_MS = 86_400_000

export type Recency = 'recent' | 'older' | 'unknown' | 'none'

export interface SystemBoardRow {
  readonly id: BodySystemId
  readonly label: string
  readonly signalCount: number
  readonly headline: SinyalSistem | null
  readonly ageDays: number | null
  readonly recency: Recency
}

const SYSTEM_IDS: ReadonlySet<string> = new Set(BODY_SYSTEM_SOURCE_WAVE.map((s) => s.id))

/** Accepts only a known system id from a URL; anything else (case variants, prototype keys, blanks) is rejected. */
export function parseSystemParam(raw: string | null | undefined): BodySystemId | null {
  return typeof raw === 'string' && SYSTEM_IDS.has(raw) ? (raw as BodySystemId) : null
}

function ageOf(recordedAt: string, now: Date): number | null {
  const t = Date.parse(recordedAt)
  const n = now.getTime()
  if (!Number.isFinite(t) || !Number.isFinite(n) || t > n) return null
  return Math.floor((n - t) / DAY_MS)
}

export function buildSystemBoard(
  signals: ReadonlyMap<BodySystemId, readonly SinyalSistem[]>,
  now: Date,
): SystemBoardRow[] {
  const rows = BODY_SYSTEM_SOURCE_WAVE.map((system, order): SystemBoardRow & { order: number } => {
    const list = signals.get(system.id) ?? []
    // Newest first, by recording time (the input order is not trusted).
    const headline = [...list].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null
    const ageDays = headline ? ageOf(headline.recordedAt, now) : null
    const recency: Recency = !headline ? 'none' : ageDays === null ? 'unknown' : ageDays <= RECENT_DAYS ? 'recent' : 'older'
    return { id: system.id, label: system.label, signalCount: list.length, headline, ageDays, recency, order }
  })
  // Systems with data first (most recently recorded first), then the rest in canonical order.
  rows.sort((a, b) => {
    if ((a.headline === null) !== (b.headline === null)) return a.headline === null ? 1 : -1
    if (a.headline && b.headline) {
      const c = b.headline.recordedAt.localeCompare(a.headline.recordedAt)
      if (c !== 0) return c
    }
    return a.order - b.order
  })
  return rows.map(({ order: _o, ...row }) => row)
}

/** Plain-language age for a row; null (unreadable or future date) says so instead of guessing. */
export function formatAge(ageDays: number | null): string {
  if (ageDays === null || !Number.isInteger(ageDays) || ageDays < 0) return 'date unreadable'
  if (ageDays === 0) return 'today'
  if (ageDays === 1) return 'yesterday'
  return `${ageDays} days ago`
}

export type BiologicalBusId = 'neural_vagal' | 'hemodynamic_o2' | 'metabolic_atp' | 'immune_lymphatic'

export interface OrganBusCoverage {
  readonly id: BiologicalBusId
  readonly label: string
  readonly coupledSystems: readonly BodySystemId[]
  readonly observedSystems: number
  readonly totalSystems: number
  readonly recentSystems: number
}

export type WatchpointStatus = 'UNOBSERVED' | 'WITHIN_MODEL_BOUNDS' | 'WATCHPOINT_TRIGGERED'

export interface CellularWatchpoint {
  readonly id: 'capillary_po2' | 'mito_delta_psi' | 'cellular_ros' | 'nernst_resting_vm'
  readonly label: string
  readonly value: number | null
  readonly unit: string
  readonly thresholdLabel: string
  readonly status: WatchpointStatus
  readonly basis: 'derived' | 'unobserved'
}

export interface WholeBodyBioKernelSummary {
  readonly buses: readonly OrganBusCoverage[]
  readonly watchpoints: readonly CellularWatchpoint[]
  readonly triggeredCount: number
  readonly draftRecoveryHint: string | null
  readonly clinicallyReviewed: false
}

const BUS_TOPOLOGY: readonly { id: BiologicalBusId; label: string; systems: readonly BodySystemId[] }[] = Object.freeze([
  { id: 'neural_vagal', label: 'Neural & Autonomic Vagal Bus', systems: ['nervous', 'cardiovascular', 'sensory-ent'] },
  { id: 'hemodynamic_o2', label: 'Hemodynamic & O2 Transport Bus', systems: ['cardiovascular', 'respiratory', 'urinary'] },
  { id: 'metabolic_atp', label: 'Metabolic & Mitochondrial ATP Bus', systems: ['endocrine', 'digestive', 'musculoskeletal'] },
  { id: 'immune_lymphatic', label: 'Immune & Lymphatic Repair Bus', systems: ['lymphatic-immune', 'integumentary-surface', 'reproductive'] },
])

/**
 * Pure Ivanov 4-Bus coverage & 4D Cellular Bio-GDB watchpoint summary.
 * Strictly fail-closed: unrecorded physiological signals stay UNOBSERVED (null), never fabricated.
 */
export function evaluateWholeBodyCouplingAndBioWatchpoints(
  rows: readonly SystemBoardRow[],
  telemetry?: { readonly spo2Pct?: number | null; readonly restingHr?: number | null; readonly hrvMs?: number | null },
): WholeBodyBioKernelSummary {
  const byId = new Map<BodySystemId, SystemBoardRow>(rows.map((r) => [r.id, r]))
  const buses: OrganBusCoverage[] = BUS_TOPOLOGY.map((b) => {
    const matched = b.systems.map((id) => byId.get(id)).filter((r): r is SystemBoardRow => Boolean(r))
    return {
      id: b.id,
      label: b.label,
      coupledSystems: b.systems,
      observedSystems: matched.filter((r) => r.headline !== null).length,
      totalSystems: b.systems.length,
      recentSystems: matched.filter((r) => r.recency === 'recent').length,
    }
  })

  const spo2 = typeof telemetry?.spo2Pct === 'number' && Number.isFinite(telemetry.spo2Pct) && telemetry.spo2Pct >= 50 && telemetry.spo2Pct <= 100 ? telemetry.spo2Pct : null
  const hr = typeof telemetry?.restingHr === 'number' && Number.isFinite(telemetry.restingHr) && telemetry.restingHr >= 20 && telemetry.restingHr <= 250 ? telemetry.restingHr : null
  const hrv = typeof telemetry?.hrvMs === 'number' && Number.isFinite(telemetry.hrvMs) && telemetry.hrvMs >= 1 && telemetry.hrvMs <= 400 ? telemetry.hrvMs : null

  // Educational Krogh / mitochondrial proxy from recorded SpO2 and autonomic reserve; null if unrecorded.
  const capPo2 = spo2 !== null ? Number(Math.max(12, Math.min(95, 25 + (spo2 - 88) * 3.8)).toFixed(1)) : null
  const mitoPsi = spo2 !== null && hr !== null ? Number(Math.max(-180, Math.min(-80, -152 + Math.max(0, 96 - spo2) * 3.2 + Math.max(0, hr - 72) * 0.45)).toFixed(1)) : null
  const rosUm = hrv !== null && spo2 !== null ? Number(Math.max(0.2, Math.min(4.5, 0.75 + Math.max(0, 55 - hrv) * 0.02 + Math.max(0, 96 - spo2) * 0.18)).toFixed(2)) : null
  const nernstVm = hr !== null && hrv !== null ? Number((-85 + Math.max(0, hr - 75) * 0.18 - Math.min(4, hrv * 0.03)).toFixed(1)) : null

  const watchpoints: CellularWatchpoint[] = [
    {
      id: 'capillary_po2',
      label: 'Capillary PO2 Proxy',
      value: capPo2,
      unit: 'mmHg',
      thresholdLabel: '>= 35 mmHg',
      status: capPo2 === null ? 'UNOBSERVED' : capPo2 >= 35 ? 'WITHIN_MODEL_BOUNDS' : 'WATCHPOINT_TRIGGERED',
      basis: capPo2 === null ? 'unobserved' : 'derived',
    },
    {
      id: 'mito_delta_psi',
      label: 'Mitochondrial Delta-Psi Proxy',
      value: mitoPsi,
      unit: 'mV',
      thresholdLabel: '<= -120 mV',
      status: mitoPsi === null ? 'UNOBSERVED' : mitoPsi <= -120 ? 'WITHIN_MODEL_BOUNDS' : 'WATCHPOINT_TRIGGERED',
      basis: mitoPsi === null ? 'unobserved' : 'derived',
    },
    {
      id: 'cellular_ros',
      label: 'Oxidative Stress (ROS) Proxy',
      value: rosUm,
      unit: 'uM',
      thresholdLabel: '<= 1.50 uM',
      status: rosUm === null ? 'UNOBSERVED' : rosUm <= 1.5 ? 'WITHIN_MODEL_BOUNDS' : 'WATCHPOINT_TRIGGERED',
      basis: rosUm === null ? 'unobserved' : 'derived',
    },
    {
      id: 'nernst_resting_vm',
      label: 'Resting Membrane Vm Proxy',
      value: nernstVm,
      unit: 'mV',
      thresholdLabel: '-90 to -70 mV',
      status: nernstVm === null ? 'UNOBSERVED' : nernstVm <= -70 && nernstVm >= -92 ? 'WITHIN_MODEL_BOUNDS' : 'WATCHPOINT_TRIGGERED',
      basis: nernstVm === null ? 'unobserved' : 'derived',
    },
  ]

  const triggeredCount = watchpoints.filter((w) => w.status === 'WATCHPOINT_TRIGGERED').length
  const draftRecoveryHint = triggeredCount > 0
    ? 'Educational model watchpoint crossed — verify recorded sensor inputs with a licensed clinician; review HBOT / Red Light PBM recovery educational reference.'
    : null

  return { buses, watchpoints, triggeredCount, draftRecoveryHint, clinicallyReviewed: false }
}

/**
 * Pure Wells-Riley airborne cross-infection model: P_HAI = 1 - exp(-I * q * p * t / Q).
 * Fail-closed when room ventilation Q <= 0 or parameters are non-finite / negative.
 */
export function computeZeroQueueNosocomialRisk(input: {
  readonly infectorsI: number
  readonly quantaRateQPerHr: number
  readonly pulmonaryVentM3PerHr: number
  readonly waitingRoomHours: number
  readonly jitDirectHours: number
  readonly roomVentilationM3PerHr: number
}): { ok: true; waitingRoomRiskPct: number; jitRiskPct: number; relativeRiskReductionPct: number; truthClass: 'DERIVED_ENGINEERING_MODEL' } | { ok: false; error: string } {
  const vals = [input.infectorsI, input.quantaRateQPerHr, input.pulmonaryVentM3PerHr, input.waitingRoomHours, input.jitDirectHours, input.roomVentilationM3PerHr]
  if (!vals.every((v) => typeof v === 'number' && Number.isFinite(v))) {
    return { ok: false, error: 'All Wells-Riley parameters must be finite numbers.' }
  }
  if (input.infectorsI < 0 || input.quantaRateQPerHr < 0 || input.pulmonaryVentM3PerHr <= 0 || input.waitingRoomHours < 0 || input.jitDirectHours < 0 || input.roomVentilationM3PerHr <= 0) {
    return { ok: false, error: 'Ventilation and breathing rates must be positive; times and quanta must be non-negative.' }
  }
  const rate = (input.infectorsI * input.quantaRateQPerHr * input.pulmonaryVentM3PerHr) / input.roomVentilationM3PerHr
  const pWait = 1 - Math.exp(-rate * input.waitingRoomHours)
  const pJit = 1 - Math.exp(-rate * input.jitDirectHours)
  const reduction = pWait > 0 ? Math.max(0, (1 - pJit / pWait) * 100) : 0
  return {
    ok: true,
    waitingRoomRiskPct: Number((pWait * 100).toFixed(2)),
    jitRiskPct: Number((pJit * 100).toFixed(2)),
    relativeRiskReductionPct: Number(reduction.toFixed(2)),
    truthClass: 'DERIVED_ENGINEERING_MODEL',
  }
}

export interface FrontierTelemetryPayload {
  readonly hrBpm?: number | null
  readonly hrvMs?: number | null
  readonly spo2Pct?: number | null
  readonly systolicMmHg?: number | null
  readonly diastolicMmHg?: number | null
  readonly tempC?: number | null
  readonly respRateBpm?: number | null
  readonly epochSec: number
}

function fnv1a32(bytes: Uint8Array, length: number): number {
  let h = 0x811c9dc5
  for (let i = 0; i < length; i++) {
    h ^= bytes[i]!
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * Deterministic compact binary delta frame (<= 128 bytes, exact 28-byte fixed envelope)
 * for 9.6 kbps 2G/EDGE (Morotai/NTT), BLE, Starlink Direct-to-Cell, and offline sync queues.
 * Missing signals are explicitly encoded via presence bitmask (never fabricated as zero).
 */
export function pack128ByteFrontierFrame(payload: FrontierTelemetryPayload): { ok: true; bytes: Uint8Array; byteLength: number; txMsAt9600bps: number } | { ok: false; error: string } {
  if (!payload || typeof payload.epochSec !== 'number' || !Number.isFinite(payload.epochSec) || payload.epochSec < 0) {
    return { ok: false, error: 'epochSec must be a finite non-negative unix timestamp.' }
  }
  const buf = new Uint8Array(28)
  const dv = new DataView(buf.buffer)
  // Magic header "PM2G" + version 1
  buf[0] = 0x50; buf[1] = 0x4d; buf[2] = 0x32; buf[3] = 0x47
  buf[4] = 1
  let mask = 0
  const enc = (bit: number, offset: number, v: number | null | undefined, scale: number, min: number, max: number) => {
    if (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max) {
      mask |= 1 << bit
      dv.setUint16(offset, Math.round(v * scale), false)
    }
  }
  enc(0, 6, payload.hrBpm, 10, 20, 250)
  enc(1, 8, payload.hrvMs, 10, 1, 400)
  enc(2, 10, payload.spo2Pct, 10, 50, 100)
  enc(3, 12, payload.systolicMmHg, 10, 50, 300)
  enc(4, 14, payload.diastolicMmHg, 10, 20, 200)
  enc(5, 16, payload.tempC, 100, 30, 45)
  enc(6, 18, payload.respRateBpm, 10, 4, 60)
  buf[5] = mask
  dv.setUint32(20, Math.floor(payload.epochSec) >>> 0, false)
  dv.setUint32(24, fnv1a32(buf, 24), false)
  const txMsAt9600bps = Number(((buf.byteLength * 10 * 1000) / 9600).toFixed(1))
  return { ok: true, bytes: buf, byteLength: buf.byteLength, txMsAt9600bps }
}

export function unpack128ByteFrontierFrame(bytes: Uint8Array): { ok: true; payload: FrontierTelemetryPayload } | { ok: false; error: string } {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength !== 28) {
    return { ok: false, error: 'Invalid frame length (expected 28 bytes).' }
  }
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4d || bytes[2] !== 0x32 || bytes[3] !== 0x47 || bytes[4] !== 1) {
    return { ok: false, error: 'Invalid PM2G magic header or unsupported version.' }
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const expectedCrc = fnv1a32(bytes, 24)
  const storedCrc = dv.getUint32(24, false)
  if (expectedCrc !== storedCrc) {
    return { ok: false, error: 'Frame checksum mismatch (corrupted packet rejected fail-closed).' }
  }
  const mask = bytes[5]!
  const dec = (bit: number, offset: number, scale: number): number | null =>
    (mask & (1 << bit)) !== 0 ? Number((dv.getUint16(offset, false) / scale).toFixed(scale === 100 ? 2 : 1)) : null
  return {
    ok: true,
    payload: {
      hrBpm: dec(0, 6, 10),
      hrvMs: dec(1, 8, 10),
      spo2Pct: dec(2, 10, 10),
      systolicMmHg: dec(3, 12, 10),
      diastolicMmHg: dec(4, 14, 10),
      tempC: dec(5, 16, 100),
      respRateBpm: dec(6, 18, 10),
      epochSec: dv.getUint32(20, false),
    },
  }
}
