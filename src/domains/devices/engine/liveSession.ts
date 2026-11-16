/**
 * One live connection to a heart-rate wearable, as plain data: packets in, readings and an HRV recording out.
 * Pure — the caller supplies every timestamp (a monotonic clock, ms) — so the same packets always give the same result.
 */
import type { HeartRateParse, SensorContact } from './gattHeartRate.ts'
import { rmssdOfRecording, RMSSD_MIN_RECORDING_MS, type HrvRecordingResult } from './beatIntervals.ts'

export interface LiveSample {
  readonly atMs: number
  readonly bpm: number
  readonly contact: SensorContact
  readonly rrMs: readonly number[]
}

export interface LiveSession {
  readonly samples: readonly LiveSample[]
  /** When packets were refused or arrived out of order: any HRV recording spanning them is interrupted. */
  readonly refusedAtMs: readonly number[]
}

export const EMPTY_SESSION: LiveSession = Object.freeze({ samples: [], refusedAtMs: [] })

/** Memory kept: one 5-minute HRV recording plus the chart minute before it, with room to spare. */
export const SESSION_KEEP_MS = 10 * 60 * 1000
/** A reading counts as live while newer than this. Devices notify about once a second; display choice, not clinical. */
export const LIVE_WITHIN_MS = 5000
/** Packets after which a device that never sent an RR interval is taken not to send them (≈10 s at 1 per second). */
export const RR_ABSENT_AFTER_PACKETS = 10

export function addPacket(session: LiveSession, packet: HeartRateParse, atMs: number): LiveSession {
  if (!Number.isFinite(atMs)) return session
  const last = session.samples[session.samples.length - 1]
  const lastRefused = session.refusedAtMs[session.refusedAtMs.length - 1]
  const latestSeen = Math.max(last?.atMs ?? -Infinity, lastRefused ?? -Infinity)
  const cutoff = Math.max(atMs, latestSeen) - SESSION_KEEP_MS
  const samples = session.samples.filter((s) => s.atMs >= cutoff)
  const refusedAtMs = session.refusedAtMs.filter((t) => t >= cutoff)
  // A packet from the past cannot be placed in the beat sequence: it interrupts, at the latest time seen.
  if (!packet.ok || atMs < latestSeen) {
    return { samples, refusedAtMs: [...refusedAtMs, Math.max(atMs, latestSeen)] }
  }
  const { bpm, contact, rrMs } = packet.reading
  return { samples: [...samples, { atMs, bpm, contact, rrMs }], refusedAtMs }
}

export interface LiveSummary {
  readonly latest: LiveSample | null
  /** Newer than LIVE_WITHIN_MS and not reported off the skin. */
  readonly live: boolean
  /** Readings in the chart window, oldest first. */
  readonly chart: readonly { readonly atMs: number; readonly bpm: number }[]
  readonly minBpm: number | null
  readonly maxBpm: number | null
  /** true once an RR interval arrived; false after RR_ABSENT_AFTER_PACKETS packets without one; null before. */
  readonly sendsBeatIntervals: boolean | null
}

export function summarize(session: LiveSession, nowMs: number, chartMs = 60_000): LiveSummary {
  const latest = session.samples[session.samples.length - 1] ?? null
  const live = latest !== null && nowMs - latest.atMs <= LIVE_WITHIN_MS && nowMs >= latest.atMs
    && latest.contact !== 'not-detected'
  const chart = session.samples.filter((s) => s.atMs >= nowMs - chartMs && s.atMs <= nowMs)
    .map((s) => ({ atMs: s.atMs, bpm: s.bpm }))
  const bpms = chart.map((p) => p.bpm)
  const anyRr = session.samples.some((s) => s.rrMs.length > 0)
  const sendsBeatIntervals = anyRr ? true : session.samples.length >= RR_ABSENT_AFTER_PACKETS ? false : null
  return {
    latest,
    live,
    chart,
    minBpm: bpms.length ? Math.min(...bpms) : null,
    maxBpm: bpms.length ? Math.max(...bpms) : null,
    sendsBeatIntervals,
  }
}

export interface HrvProgress {
  /** 0-1 of the conventional 5-minute recording covered by beats so far. */
  readonly fraction: number
  readonly intervals: readonly number[]
  readonly result: HrvRecordingResult
}

/**
 * The HRV recording started at `startedAtMs`, judged with what the session holds now. The caller ends the recording
 * at its first ok result (5 minutes), well inside SESSION_KEEP_MS, so no part of it has left memory.
 */
export function hrvProgress(session: LiveSession, startedAtMs: number): HrvProgress {
  const samples = session.samples.filter((s) => s.atMs >= startedAtMs)
  const intervals = samples.flatMap((s) => s.rrMs)
  const interrupted = session.refusedAtMs.some((t) => t >= startedAtMs)
    || samples.some((s) => s.contact === 'not-detected')
  const result = rmssdOfRecording(intervals, interrupted)
  return { fraction: Math.min(1, result.coveredMs / RMSSD_MIN_RECORDING_MS), intervals, result }
}

// A type alias (not an interface) so it fits the vitals store's open record of named numbers and strings.
export type WearableVitalsPatch = { heartRate?: number; hrvRmssdMs?: number; source: string }
/** A patch as saved: with the wall-clock time of the reading it carries. */
export type WearableSavePatch = WearableVitalsPatch & { readonly measuredAt: string }

/** What saving a session writes to the person's health data. HRV goes to its own RMSSD key, never to SDNN fields. */
export function vitalsPatchFrom(latest: LiveSample | null, hrv: HrvRecordingResult | null, sourceLabel: string):
  WearableVitalsPatch | null {
  const patch: WearableVitalsPatch = { source: `Bluetooth · ${sourceLabel}` }
  if (latest && latest.bpm > 0) patch.heartRate = latest.bpm
  if (hrv?.ok) patch.hrvRmssdMs = Math.round(hrv.rmssdMs * 10) / 10
  return patch.heartRate === undefined && patch.hrvRmssdMs === undefined ? null : patch
}
