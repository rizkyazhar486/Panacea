// Physiological Drift Detection: flag when a patient's own vitals are
// moving away from their own recent baseline — before any value crosses a
// population-level "abnormal" threshold. This is deliberately NOT the
// "biological age" / "healthspan days" style of claim: those need a
// validated outcome model that doesn't exist here, and inventing one would
// violate the same "never fabricate" rule this app holds for prices. A
// z-score against the patient's own history is real statistics on real
// recorded data — nothing here is estimated or made up.
import type { VitalSign } from './types'

export type DriftDirection = 'up' | 'down'
export type DriftSeverity = 'watch' | 'drift'

export interface DriftFinding {
  key: 'systolic' | 'diastolic' | 'heartRate' | 'respRate' | 'tempC' | 'spo2'
  label: string
  unit: string
  baseline: number // mean of prior readings, rounded for display
  latest: number
  direction: DriftDirection
  severity: DriftSeverity
  zScore: number
  sampleSize: number // how many prior readings the baseline is built from
}

const METRICS: { key: DriftFinding['key']; label: string; unit: string; get: (v: VitalSign) => number | undefined }[] = [
  { key: 'systolic', label: 'Systolic BP', unit: 'mmHg', get: (v) => v.systolic },
  { key: 'diastolic', label: 'Diastolic BP', unit: 'mmHg', get: (v) => v.diastolic },
  { key: 'heartRate', label: 'Resting heart rate', unit: 'bpm', get: (v) => v.heartRate },
  { key: 'respRate', label: 'Respiratory rate', unit: '/min', get: (v) => v.respRate },
  { key: 'tempC', label: 'Temperature', unit: '°C', get: (v) => v.tempC },
  { key: 'spo2', label: 'SpO₂', unit: '%', get: (v) => v.spo2 },
]

// Minimum prior readings before a baseline is trustworthy enough to compare
// against. Below this, honestly report nothing rather than a shaky signal.
const MIN_BASELINE_SAMPLES = 5
const WATCH_Z = 1.5
const DRIFT_Z = 2.5

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function stdev(xs: number[], m: number): number {
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

// vitals must be in chronological order (oldest first) — the same order
// they're already stored and rendered in throughout the app.
export function detectDrift(vitals: VitalSign[]): DriftFinding[] {
  if (vitals.length < MIN_BASELINE_SAMPLES + 1) return []
  const latestReading = vitals[vitals.length - 1]
  const priorReadings = vitals.slice(0, -1)
  const out: DriftFinding[] = []

  for (const metric of METRICS) {
    const priorValues = priorReadings.map(metric.get).filter((v): v is number => v != null)
    const latestValue = metric.get(latestReading)
    if (latestValue == null || priorValues.length < MIN_BASELINE_SAMPLES) continue

    const baseline = mean(priorValues)
    const sd = stdev(priorValues, baseline)
    if (sd === 0) continue // no real variation to compare against — can't compute a z-score honestly

    const z = (latestValue - baseline) / sd
    const absZ = Math.abs(z)
    if (absZ < WATCH_Z) continue

    out.push({
      key: metric.key,
      label: metric.label,
      unit: metric.unit,
      baseline: Math.round(baseline * 10) / 10,
      latest: latestValue,
      direction: z > 0 ? 'up' : 'down',
      severity: absZ >= DRIFT_Z ? 'drift' : 'watch',
      zScore: Math.round(z * 10) / 10,
      sampleSize: priorValues.length,
    })
  }
  return out
}

export function driftSummary(finding: DriftFinding): string {
  const verb = finding.direction === 'up' ? 'up' : 'down'
  const delta = Math.abs(finding.latest - finding.baseline)
  const deltaStr = Number.isInteger(delta) ? delta.toString() : delta.toFixed(1)
  return `${finding.label} is ${verb} ${deltaStr} ${finding.unit} from your own ${finding.sampleSize}-reading baseline (${finding.baseline} ${finding.unit}).`
}
