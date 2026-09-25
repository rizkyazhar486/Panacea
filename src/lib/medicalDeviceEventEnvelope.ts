/**
 * Canonical non-scalar Medical Device Fabric event envelope + deterministic
 * technical-QC analyzers.
 *
 * Scalar bedside/visit measurements already flow through visitOperatingSystem.ts
 * and visitDeviceAdapters.ts. This module is the shared contract for the data
 * shapes that catalog entries in medicalDeviceIntegrationCatalog.ts declare but
 * that scalar observations cannot carry: waveforms, alarms, settings,
 * therapy-delivery events, and image/report references.
 *
 * High-frequency waveform samples and imaging bytes are never embedded here.
 * A waveform event carries a storage reference into bounded time-series/
 * waveform storage; an image/report event carries a DICOM/report storage
 * reference. This module normalizes and validates the envelope metadata only.
 */

import {
  getMedicalDeviceIntegrationProfile,
  type MedicalDeviceAnalyzerKind,
} from './medicalDeviceIntegrationCatalog.ts'

export type MedicalDeviceEventShape =
  | 'waveform'
  | 'alarm'
  | 'setting'
  | 'therapy-delivery'
  | 'image-reference'
  | 'report-reference'
  | 'device-status'
  | 'event'

/** Maps an envelope shape to the catalog's broader dataShape vocabulary. */
const CATALOG_DATA_SHAPE_BY_EVENT_SHAPE: Record<MedicalDeviceEventShape, readonly string[]> = {
  waveform: ['waveform'],
  alarm: ['alarm'],
  setting: ['setting'],
  'therapy-delivery': ['therapy-delivery'],
  'image-reference': ['image', 'volume', 'video'],
  'report-reference': ['report'],
  'device-status': ['device-status'],
  event: ['event'],
}

export type MedicalDeviceEventTruthClass = 'measured' | 'derived' | 'relayed' | 'operator-entered'

export type MedicalDeviceAlarmSeverity = 'advisory' | 'caution' | 'warning' | 'critical'
export type MedicalDeviceStatusValue = 'online' | 'offline' | 'fault' | 'battery-low' | 'maintenance'

export type MedicalDeviceEventPayload =
  | {
      kind: 'waveform'
      channel: string
      unit: string
      sampleRateHz: number
      sampleCount: number
      durationMs: number
      storageRef: string
    }
  | { kind: 'alarm'; code: string; severity: MedicalDeviceAlarmSeverity; message: string; active: boolean }
  | { kind: 'setting'; name: string; value: string | number | boolean; unit?: string }
  | {
      kind: 'therapy-delivery'
      therapyType: string
      rate?: number
      rateUnit?: string
      doseDelivered?: number
      doseUnit?: string
    }
  | { kind: 'image-reference'; storageRef: string; mimeType: string; dicomStudyUid?: string }
  | { kind: 'report-reference'; storageRef: string; mimeType: string }
  | { kind: 'device-status'; status: MedicalDeviceStatusValue; detail?: string }
  | { kind: 'event'; name: string; detail?: string }

export interface MedicalDeviceEventEnvelope {
  id: string
  streamId: string
  sequence: number
  deviceProfileId: string
  deviceId: string
  visitId?: string
  subjectId?: string
  shape: MedicalDeviceEventShape
  truthClass: MedicalDeviceEventTruthClass
  capturedAt: string
  receivedAt: string
  standardCode?: { system: string; code: string; display?: string }
  signalQuality?: number | null
  /** Device-declared offset of its own clock against a reference time, when the device exposes one. */
  deviceClockOffsetMs?: number | null
  payload: MedicalDeviceEventPayload
}

export interface MedicalDeviceQcFinding {
  analyzer: MedicalDeviceAnalyzerKind
  ok: boolean
  detail: string
}

export type MedicalDeviceFreshness = 'fresh' | 'delayed' | 'stale'

export interface MedicalDeviceQcResult {
  envelopeId: string
  ok: boolean
  findings: readonly MedicalDeviceQcFinding[]
  ageMs: number
  freshness: MedicalDeviceFreshness
}

const FRESH_MS = 30_000
const DELAYED_MS = 120_000
const DEFAULT_MAX_CLOCK_SKEW_MS = 2_000

function finding(analyzer: MedicalDeviceAnalyzerKind, ok: boolean, detail: string): MedicalDeviceQcFinding {
  return Object.freeze({ analyzer, ok, detail })
}

function nonBlank(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** ageMs = max(0, now - receivedAt); transport freshness only, never a clinical severity signal. */
export function medicalDeviceEventFreshness(receivedAt: string, nowMs = Date.now()): {
  ageMs: number
  freshness: MedicalDeviceFreshness
} {
  const receivedMs = Date.parse(receivedAt)
  const ageMs = Number.isFinite(receivedMs) ? Math.max(0, nowMs - receivedMs) : Number.POSITIVE_INFINITY
  const freshness: MedicalDeviceFreshness = ageMs <= FRESH_MS ? 'fresh' : ageMs <= DELAYED_MS ? 'delayed' : 'stale'
  return { ageMs, freshness }
}

function checkIdentity(envelope: MedicalDeviceEventEnvelope): MedicalDeviceQcFinding {
  if (!nonBlank(envelope.id) || !nonBlank(envelope.streamId) || !nonBlank(envelope.deviceId)) {
    return finding('transport-integrity', false, 'id, streamId and deviceId must be non-blank')
  }
  const profile = getMedicalDeviceIntegrationProfile(envelope.deviceProfileId)
  if (!profile) {
    return finding('transport-integrity', false, `unknown deviceProfileId: ${envelope.deviceProfileId}`)
  }
  const allowedShapes = CATALOG_DATA_SHAPE_BY_EVENT_SHAPE[envelope.shape]
  if (!allowedShapes.some((shape) => profile.dataShapes.includes(shape as never))) {
    return finding(
      'transport-integrity',
      false,
      `${envelope.shape} is not a declared data shape for device profile ${envelope.deviceProfileId}`,
    )
  }
  return finding('transport-integrity', true, 'identity and catalog profile resolved')
}

function checkTimestampOrder(envelope: MedicalDeviceEventEnvelope): MedicalDeviceQcFinding {
  const capturedMs = Date.parse(envelope.capturedAt)
  const receivedMs = Date.parse(envelope.receivedAt)
  if (!Number.isFinite(capturedMs) || !Number.isFinite(receivedMs)) {
    return finding('transport-integrity', false, 'capturedAt/receivedAt must be valid ISO timestamps')
  }
  if (capturedMs > receivedMs) {
    return finding('transport-integrity', false, 'capturedAt must not be later than receivedAt')
  }
  return finding('transport-integrity', true, 'timestamp order valid')
}

function checkClockSkew(
  envelope: MedicalDeviceEventEnvelope,
  maxAllowedSkewMs: number,
): MedicalDeviceQcFinding {
  if (envelope.deviceClockOffsetMs == null) {
    return finding('clock-skew', true, 'device does not declare a clock offset; skew unknown')
  }
  if (!Number.isFinite(envelope.deviceClockOffsetMs)) {
    return finding('clock-skew', false, 'deviceClockOffsetMs must be a finite number when declared')
  }
  const withinBound = Math.abs(envelope.deviceClockOffsetMs) <= maxAllowedSkewMs
  return finding(
    'clock-skew',
    withinBound,
    withinBound
      ? `device clock offset ${envelope.deviceClockOffsetMs}ms within ${maxAllowedSkewMs}ms bound`
      : `device clock offset ${envelope.deviceClockOffsetMs}ms exceeds ${maxAllowedSkewMs}ms bound`,
  )
}

function checkSignalQuality(envelope: MedicalDeviceEventEnvelope): MedicalDeviceQcFinding {
  if (envelope.signalQuality == null) {
    return finding('signal-quality', true, 'signal quality not reported by device')
  }
  const inRange = Number.isFinite(envelope.signalQuality) && envelope.signalQuality >= 0 && envelope.signalQuality <= 1
  return finding(
    'signal-quality',
    inRange,
    inRange ? `signal quality ${envelope.signalQuality} in [0,1]` : 'signalQuality must be null or within [0,1]',
  )
}

function checkUnitsAndCompleteness(envelope: MedicalDeviceEventEnvelope): MedicalDeviceQcFinding {
  const { payload } = envelope
  if (payload.kind === 'waveform') {
    if (!nonBlank(payload.unit) || !nonBlank(payload.channel) || !nonBlank(payload.storageRef)) {
      return finding('signal-quality', false, 'waveform payload requires unit, channel and storageRef')
    }
    if (
      !Number.isFinite(payload.sampleRateHz) || payload.sampleRateHz <= 0 ||
      !Number.isFinite(payload.durationMs) || payload.durationMs <= 0 ||
      !Number.isInteger(payload.sampleCount) || payload.sampleCount <= 0
    ) {
      return finding('signal-quality', false, 'waveform sampleRateHz/durationMs/sampleCount must be positive')
    }
    const expected = Math.round((payload.sampleRateHz * payload.durationMs) / 1000)
    const tolerance = Math.max(1, Math.round(expected * 0.02))
    const complete = Math.abs(payload.sampleCount - expected) <= tolerance
    return finding(
      'signal-quality',
      complete,
      complete
        ? `sampleCount ${payload.sampleCount} matches expected ${expected} (+/-${tolerance})`
        : `sampleCount ${payload.sampleCount} deviates from expected ${expected} (+/-${tolerance}); possible dropped samples`,
    )
  }
  if (payload.kind === 'setting' && payload.unit !== undefined && !nonBlank(payload.unit)) {
    return finding('signal-quality', false, 'setting unit must not be blank when declared')
  }
  if (payload.kind === 'therapy-delivery') {
    if (payload.rate !== undefined && !nonBlank(payload.rateUnit)) {
      return finding('signal-quality', false, 'therapy-delivery rate requires rateUnit')
    }
    if (payload.doseDelivered !== undefined && !nonBlank(payload.doseUnit)) {
      return finding('signal-quality', false, 'therapy-delivery doseDelivered requires doseUnit')
    }
  }
  if ((payload.kind === 'image-reference' || payload.kind === 'report-reference')) {
    if (!nonBlank(payload.storageRef) || !nonBlank(payload.mimeType)) {
      return finding('signal-quality', false, `${payload.kind} requires storageRef and mimeType`)
    }
  }
  return finding('signal-quality', true, `${payload.kind} payload structurally valid`)
}

function checkLiveness(envelope: MedicalDeviceEventEnvelope, nowMs: number): MedicalDeviceQcFinding {
  const { ageMs, freshness } = medicalDeviceEventFreshness(envelope.receivedAt, nowMs)
  return finding(
    'device-health',
    freshness !== 'stale',
    `receivedAt age ${Number.isFinite(ageMs) ? Math.round(ageMs) : 'invalid'}ms -> ${freshness}`,
  )
}

/** Tracks per-stream sequence numbers to detect replay and out-of-order/duplicate delivery. */
export interface MedicalDeviceReplayLedger {
  check(envelope: MedicalDeviceEventEnvelope): MedicalDeviceQcFinding
}

export function createMedicalDeviceReplayLedger(): MedicalDeviceReplayLedger {
  const lastSequenceByStream = new Map<string, number>()
  return {
    check(envelope: MedicalDeviceEventEnvelope): MedicalDeviceQcFinding {
      if (!Number.isInteger(envelope.sequence) || envelope.sequence < 0) {
        return finding('transport-integrity', false, 'sequence must be a non-negative integer')
      }
      const last = lastSequenceByStream.get(envelope.streamId)
      if (last !== undefined && envelope.sequence <= last) {
        return finding(
          'transport-integrity',
          false,
          `sequence ${envelope.sequence} is not greater than last accepted sequence ${last} for stream ${envelope.streamId} (replay or reorder)`,
        )
      }
      lastSequenceByStream.set(envelope.streamId, envelope.sequence)
      return finding('transport-integrity', true, `sequence ${envelope.sequence} accepted for stream ${envelope.streamId}`)
    },
  }
}

export interface MedicalDeviceQcOptions {
  nowMs?: number
  maxAllowedClockSkewMs?: number
  replayLedger?: MedicalDeviceReplayLedger
}

/**
 * Runs the deterministic technical-QC pass: identity, timestamps, clock skew,
 * replay (when a ledger is supplied), units/sample-completeness, signal
 * quality and liveness. This is transport/technical QC only; it renders no
 * clinical judgment and produces no diagnosis, severity or treatment output.
 */
export function runMedicalDeviceEventQc(
  envelope: MedicalDeviceEventEnvelope,
  options: MedicalDeviceQcOptions = {},
): MedicalDeviceQcResult {
  const nowMs = options.nowMs ?? Date.now()
  const maxAllowedClockSkewMs = options.maxAllowedClockSkewMs ?? DEFAULT_MAX_CLOCK_SKEW_MS

  const findings: MedicalDeviceQcFinding[] = [
    checkIdentity(envelope),
    checkTimestampOrder(envelope),
    checkClockSkew(envelope, maxAllowedClockSkewMs),
    checkSignalQuality(envelope),
    checkUnitsAndCompleteness(envelope),
    checkLiveness(envelope, nowMs),
  ]
  if (options.replayLedger) {
    findings.push(options.replayLedger.check(envelope))
  }

  const { ageMs, freshness } = medicalDeviceEventFreshness(envelope.receivedAt, nowMs)

  return Object.freeze({
    envelopeId: envelope.id,
    ok: findings.every((entry) => entry.ok),
    findings: Object.freeze(findings),
    ageMs,
    freshness,
  })
}

export const MEDICAL_DEVICE_EVENT_ENVELOPE_BOUNDARY =
  'This envelope carries non-scalar device event metadata and storage references only. Waveform samples remain in bounded time-series/waveform storage and imaging/report bytes remain in DICOM/DICOMweb or the report store. QC findings here are transport/technical checks, never a diagnosis, severity score or treatment recommendation.'
