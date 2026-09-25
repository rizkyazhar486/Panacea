import {
  validateMedicalDeviceEvent,
  type MedicalDeviceEventEnvelope,
} from './medicalDeviceEventEnvelope.ts'

/**
 * Deterministic technical-QC analyzers for the Medical Device Fabric event
 * envelope (identity, timestamps, clock skew, replay, units, signal quality,
 * sample completeness, liveness). These checks are transport/engineering
 * quality signals only. They never diagnose, prescribe, certify a vendor
 * integration or substitute clinical judgment.
 */
export const MEDICAL_DEVICE_QC_BOUNDARY =
  'Technical QC findings describe transport, identity, timing and signal-completeness quality only. They are not a clinical determination, vendor conformance certification or diagnostic result.'

export type MedicalDeviceQcCheck =
  | 'envelope'
  | 'identity'
  | 'clock-skew'
  | 'replay'
  | 'unit'
  | 'signal-quality'
  | 'sample-completeness'
  | 'liveness'

export type MedicalDeviceQcSeverity = 'info' | 'warning' | 'critical'

export interface MedicalDeviceQcFinding {
  check: MedicalDeviceQcCheck
  severity: MedicalDeviceQcSeverity
  message: string
}

export type MedicalDeviceQcDisposition = 'pass' | 'flagged' | 'fail'
export type MedicalDeviceLivenessState = 'fresh' | 'delayed' | 'stale'

export interface MedicalDeviceEventQcReport {
  eventId: string
  disposition: MedicalDeviceQcDisposition
  clockSkewMs: number | null
  livenessAgeMs: number | null
  livenessState: MedicalDeviceLivenessState | null
  findings: readonly MedicalDeviceQcFinding[]
}

export interface MedicalDeviceQcOptions {
  clockSkewWarnMs: number
  clockSkewCriticalMs: number
  livenessFreshMs: number
  livenessDelayedMs: number
  waveformMinChunkSeconds: number
  waveformMaxChunkSeconds: number
  sampleCompletenessRatio: number
}

/**
 * Defaults reuse the Visit OS transport-freshness convention already
 * canonical in this repository (fresh <=30s, delayed 30-120s, stale >120s;
 * see `visitOperatingSystem.ts`). Reusing the same boundary keeps device-fabric
 * QC semantics consistent with Visit OS rather than inventing a second,
 * unrelated threshold. All values are transport-QC heuristics and remain
 * overridable per caller; they are not clinical alert thresholds.
 */
export const DEFAULT_MEDICAL_DEVICE_QC_OPTIONS: Readonly<MedicalDeviceQcOptions> = Object.freeze({
  clockSkewWarnMs: 30_000,
  clockSkewCriticalMs: 120_000,
  livenessFreshMs: 30_000,
  livenessDelayedMs: 120_000,
  waveformMinChunkSeconds: 0.01,
  waveformMaxChunkSeconds: 300,
  sampleCompletenessRatio: 0.9,
})

function resolveOptions(options?: Partial<MedicalDeviceQcOptions>): MedicalDeviceQcOptions {
  return { ...DEFAULT_MEDICAL_DEVICE_QC_OPTIONS, ...options }
}

function livenessStateFor(ageMs: number, options: MedicalDeviceQcOptions): MedicalDeviceLivenessState {
  if (ageMs <= options.livenessFreshMs) return 'fresh'
  if (ageMs <= options.livenessDelayedMs) return 'delayed'
  return 'stale'
}

const SUSPECT_UNIT_CHARS = /[^\p{L}\p{N}%°/.\-\[\]µΩ ]/u

function unitFinding(unit: string | undefined): MedicalDeviceQcFinding | null {
  if (unit === undefined) return null
  const trimmed = unit.trim()
  if (!trimmed) {
    return { check: 'unit', severity: 'warning', message: 'unit is blank after trimming' }
  }
  if (SUSPECT_UNIT_CHARS.test(trimmed)) {
    return { check: 'unit', severity: 'warning', message: `unit "${trimmed}" contains unexpected characters` }
  }
  return null
}

/**
 * Single-event technical QC: envelope validity, identity presence, clock
 * skew (Δt = receivedAt - capturedAt), unit sanity and waveform chunk
 * plausibility. Liveness additionally requires the caller's current time,
 * since "now" cannot be deterministic inside a pure event check.
 */
export function analyzeMedicalDeviceEventQc(
  event: MedicalDeviceEventEnvelope,
  nowMs: number,
  options?: Partial<MedicalDeviceQcOptions>,
): MedicalDeviceEventQcReport {
  const opts = resolveOptions(options)
  const findings: MedicalDeviceQcFinding[] = []
  const eventId = typeof event?.id === 'string' ? event.id : ''

  const validation = validateMedicalDeviceEvent(event)
  if (!validation.accepted) {
    return {
      eventId,
      disposition: 'fail',
      clockSkewMs: null,
      livenessAgeMs: null,
      livenessState: null,
      findings: validation.errors.map((message) => ({ check: 'envelope', severity: 'critical', message })),
    }
  }

  const capturedAtMs = Date.parse(event.provenance.capturedAt)
  const receivedAtMs = Date.parse(event.provenance.receivedAt)
  const clockSkewMs = receivedAtMs - capturedAtMs
  if (clockSkewMs >= opts.clockSkewCriticalMs) {
    findings.push({
      check: 'clock-skew',
      severity: 'critical',
      message: `capture-to-receipt skew ${clockSkewMs}ms exceeds ${opts.clockSkewCriticalMs}ms`,
    })
  } else if (clockSkewMs >= opts.clockSkewWarnMs) {
    findings.push({
      check: 'clock-skew',
      severity: 'warning',
      message: `capture-to-receipt skew ${clockSkewMs}ms exceeds ${opts.clockSkewWarnMs}ms`,
    })
  }

  if (!event.source.manufacturer && !event.source.model && !event.source.firmware) {
    findings.push({
      check: 'identity',
      severity: 'info',
      message: 'source manufacturer/model/firmware not supplied; adapter identity is partial',
    })
  }

  if (event.payload.shape === 'setting') {
    const finding = unitFinding(event.payload.unit)
    if (finding) findings.push(finding)
  } else if (event.payload.shape === 'therapy-delivery') {
    const finding = unitFinding(event.payload.unit)
    if (finding) findings.push(finding)
  }

  if (event.payload.shape === 'waveform') {
    const durationSeconds = event.payload.sampleCount / event.payload.sampleRateHz
    if (durationSeconds < opts.waveformMinChunkSeconds) {
      findings.push({
        check: 'signal-quality',
        severity: 'warning',
        message: `waveform chunk duration ${durationSeconds.toFixed(4)}s is below ${opts.waveformMinChunkSeconds}s`,
      })
    } else if (durationSeconds > opts.waveformMaxChunkSeconds) {
      findings.push({
        check: 'signal-quality',
        severity: 'warning',
        message: `waveform chunk duration ${durationSeconds.toFixed(1)}s exceeds ${opts.waveformMaxChunkSeconds}s`,
      })
    }
  }

  const livenessAgeMs = Math.max(0, nowMs - receivedAtMs)
  const livenessState = livenessStateFor(livenessAgeMs, opts)
  if (livenessState === 'stale') {
    findings.push({
      check: 'liveness',
      severity: 'warning',
      message: `event age ${livenessAgeMs}ms is stale (> ${opts.livenessDelayedMs}ms)`,
    })
  }

  const hasCritical = findings.some((finding) => finding.severity === 'critical')
  const disposition: MedicalDeviceQcDisposition = hasCritical
    ? 'fail'
    : findings.length > 0
      ? 'flagged'
      : 'pass'

  return { eventId, disposition, clockSkewMs, livenessAgeMs, livenessState, findings }
}

function streamKey(event: MedicalDeviceEventEnvelope): string {
  return [event.subjectId, event.encounterId ?? '', event.source.deviceId, event.source.adapterId].join('|')
}

function waveformStreamKey(event: MedicalDeviceEventEnvelope): string {
  const payload = event.payload
  const channels = payload.shape === 'waveform' ? payload.channels.join(',') : ''
  return `${streamKey(event)}|${channels}`
}

interface IdentitySnapshot {
  profileId: string
  manufacturer?: string
  model?: string
}

/**
 * Stream-level technical QC layered on top of `analyzeMedicalDeviceEventQc`:
 * replay/out-of-order sequence detection and identity drift per
 * (subjectId, encounterId, deviceId, adapterId), plus waveform sample
 * completeness across consecutive chunks of the same channel set. Events are
 * evaluated in `provenance.receivedAt` order to mirror real ingestion order;
 * reports are returned in the same order as the input array.
 */
export function analyzeMedicalDeviceEventStreamQc(
  events: readonly MedicalDeviceEventEnvelope[],
  nowMs: number,
  options?: Partial<MedicalDeviceQcOptions>,
): MedicalDeviceEventQcReport[] {
  const opts = resolveOptions(options)
  const baseReports = new Map<MedicalDeviceEventEnvelope, MedicalDeviceEventQcReport>()
  for (const event of events) {
    baseReports.set(event, analyzeMedicalDeviceEventQc(event, nowMs, opts))
  }

  const extraFindings = new Map<MedicalDeviceEventEnvelope, MedicalDeviceQcFinding[]>()
  const pushExtra = (event: MedicalDeviceEventEnvelope, finding: MedicalDeviceQcFinding) => {
    const list = extraFindings.get(event) ?? []
    list.push(finding)
    extraFindings.set(event, list)
  }

  const orderable = events.filter((event) => baseReports.get(event)?.disposition !== 'fail')
  const ordered = [...orderable].sort((a, b) => {
    const aTime = Date.parse(a.provenance.receivedAt)
    const bTime = Date.parse(b.provenance.receivedAt)
    if (aTime !== bTime) return aTime - bTime
    return a.provenance.sequence - b.provenance.sequence
  })

  const lastSequence = new Map<string, number>()
  const seenSequences = new Map<string, Set<number>>()
  const identityByKey = new Map<string, IdentitySnapshot>()
  const lastWaveform = new Map<string, MedicalDeviceEventEnvelope>()

  for (const event of ordered) {
    const key = streamKey(event)

    const seen = seenSequences.get(key) ?? new Set<number>()
    seenSequences.set(key, seen)
    const max = lastSequence.get(key)
    if (seen.has(event.provenance.sequence)) {
      pushExtra(event, {
        check: 'replay',
        severity: 'critical',
        message: `sequence ${event.provenance.sequence} was already seen on this stream`,
      })
    } else if (max !== undefined && event.provenance.sequence < max) {
      pushExtra(event, {
        check: 'replay',
        severity: 'critical',
        message: `sequence ${event.provenance.sequence} arrived out of order after ${max}`,
      })
    } else if (max !== undefined && event.provenance.sequence > max + 1) {
      pushExtra(event, {
        check: 'replay',
        severity: 'info',
        message: `sequence gap detected: ${max} then ${event.provenance.sequence}`,
      })
    }
    seen.add(event.provenance.sequence)
    lastSequence.set(key, Math.max(max ?? event.provenance.sequence, event.provenance.sequence))

    const identity = identityByKey.get(key)
    const current: IdentitySnapshot = {
      profileId: event.source.profileId,
      manufacturer: event.source.manufacturer,
      model: event.source.model,
    }
    if (!identity) {
      identityByKey.set(key, current)
    } else if (identity.profileId !== current.profileId) {
      pushExtra(event, {
        check: 'identity',
        severity: 'critical',
        message: `catalog profile changed on the same device stream: ${identity.profileId} -> ${current.profileId}`,
      })
    } else if (
      (identity.manufacturer && current.manufacturer && identity.manufacturer !== current.manufacturer) ||
      (identity.model && current.model && identity.model !== current.model)
    ) {
      pushExtra(event, {
        check: 'identity',
        severity: 'warning',
        message: 'manufacturer/model changed on the same device stream',
      })
    }

    if (event.payload.shape === 'waveform') {
      const wKey = waveformStreamKey(event)
      const previous = lastWaveform.get(wKey)
      if (previous && previous.payload.shape === 'waveform') {
        const gapSeconds = (Date.parse(event.provenance.capturedAt) - Date.parse(previous.provenance.capturedAt)) / 1000
        if (gapSeconds > 0 && previous.payload.sampleRateHz > 0) {
          const expected = gapSeconds * previous.payload.sampleRateHz
          const ratio = previous.payload.sampleCount / expected
          if (ratio < opts.sampleCompletenessRatio) {
            pushExtra(previous, {
              check: 'sample-completeness',
              severity: 'warning',
              message: `waveform chunk reported ${previous.payload.sampleCount} samples, expected ~${Math.round(expected)} before the next chunk (${(ratio * 100).toFixed(0)}%)`,
            })
          }
        }
      }
      lastWaveform.set(wKey, event)
    }
  }

  return events.map((event) => {
    const base = baseReports.get(event)
    if (!base) throw new Error('internal: missing base QC report')
    const extra = extraFindings.get(event) ?? []
    if (extra.length === 0) return base

    const findings = [...base.findings, ...extra]
    const hasCritical = findings.some((finding) => finding.severity === 'critical')
    const disposition: MedicalDeviceQcDisposition = hasCritical
      ? 'fail'
      : findings.length > 0
        ? 'flagged'
        : 'pass'
    return { ...base, findings, disposition }
  })
}
