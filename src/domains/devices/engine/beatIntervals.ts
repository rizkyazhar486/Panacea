/**
 * Heart rate variability from beat-to-beat (RR) intervals: RMSSD only, computed as published and never filled in.
 *
 * Source — Shaffer F, Ginsberg JP. An Overview of Heart Rate Variability Metrics and Norms. Front Public Health.
 * 2017;5:258. PMID 29034226, PMC5624990, doi:10.3389/fpubh.2017.00258 (read in full text):
 *   - RMSSD "is obtained by first calculating each successive time difference between heartbeats in ms. Then, each
 *     of the values is squared and the result is averaged before the square root of the total is obtained."
 *   - "While the conventional minimum recording is 5 min, researchers have proposed ultra-short-term periods".
 *   - "contamination by only two artifacts within a 5-min segment can significantly distort" RMSSD; artifacts are
 *     found by inspecting the recording and removed by selecting a clean epoch or editing intervals.
 *
 * So a value is produced only from a recording that covers the conventional 5 minutes and was not interrupted
 * (lost skin contact, refused packets). No automatic artifact editing is applied — no rule for it is verified
 * here — so every result is marked unedited and the intervals are kept for the person to inspect.
 * Norms differ by recording length (same source), so a value is compared only with the person's own readings.
 */

/** The conventional minimum recording for RMSSD (Shaffer & Ginsberg 2017, see above). */
export const RMSSD_MIN_RECORDING_MS = 5 * 60 * 1000

/** RMSSD in ms of an uninterrupted interval series, or null when there is nothing to compute from. */
export function rmssd(rrMs: readonly number[]): number | null {
  if (rrMs.length < 2) return null
  let sumOfSquares = 0
  for (let i = 0; i < rrMs.length; i++) {
    const rr = rrMs[i]!
    if (!Number.isFinite(rr) || rr <= 0) return null
    if (i > 0) {
      const difference = rr - rrMs[i - 1]!
      sumOfSquares += difference * difference
    }
  }
  return Math.sqrt(sumOfSquares / (rrMs.length - 1))
}

export type HrvRecordingRefusal = 'no-intervals' | 'too-short' | 'interrupted'

export type HrvRecordingResult =
  | {
      readonly ok: true
      readonly rmssdMs: number
      readonly intervals: number
      /** Time covered by the beats themselves (sum of intervals), ms. */
      readonly coveredMs: number
      /** No artifact editing was applied; the intervals are shown for inspection. */
      readonly edited: false
    }
  | { readonly ok: false; readonly reason: HrvRecordingRefusal; readonly coveredMs: number }

/**
 * Judge one recording. `interrupted` is the caller's record that contact was lost or a packet was refused during it:
 * differences across such a gap are not differences between successive heartbeats.
 */
export function rmssdOfRecording(rrMs: readonly number[], interrupted: boolean): HrvRecordingResult {
  let coveredMs = 0
  for (const rr of rrMs) if (Number.isFinite(rr) && rr > 0) coveredMs += rr
  if (interrupted) return { ok: false, reason: 'interrupted', coveredMs }
  if (rrMs.length < 2) return { ok: false, reason: 'no-intervals', coveredMs }
  if (coveredMs < RMSSD_MIN_RECORDING_MS) return { ok: false, reason: 'too-short', coveredMs }
  const value = rmssd(rrMs)
  // An interval that is not a positive finite number breaks the sequence of successive beats.
  if (value === null) return { ok: false, reason: 'interrupted', coveredMs }
  return { ok: true, rmssdMs: value, intervals: rrMs.length, coveredMs, edited: false }
}
