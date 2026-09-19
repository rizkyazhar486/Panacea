export interface RecoveryBaseline {
  value: number
  count: number
}

export interface RecoveryDailyInputs {
  hrv?: number
  rhr?: number
  sleepH?: number
  loadRpeMin?: number
}

export type RecoveryVitalId = 'hrv' | 'rhr' | 'sleepH'

export interface RecoverySnapshotVital {
  id: RecoveryVitalId
  label: string
  unit: string
  recorded: number | null
  baseline: RecoveryBaseline | null
  deltaFromBaseline: number | null
}

export interface RecoveryRecordedSnapshot {
  recordedCount: number
  completeness: number
  headline: string
  vitals: RecoverySnapshotVital[]
  todayLoad: number
  hasWorkoutToday: boolean
}

const VITAL_META: Record<RecoveryVitalId, { label: string; unit: string }> = {
  hrv: { label: 'HRV', unit: 'ms' },
  rhr: { label: 'Resting HR', unit: 'bpm' },
  sleepH: { label: 'Sleep', unit: 'h' },
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function buildVital(
  id: RecoveryVitalId,
  recorded: number | undefined,
  baseline: RecoveryBaseline | null,
): RecoverySnapshotVital {
  const meta = VITAL_META[id]
  const hasRecorded = typeof recorded === 'number' && Number.isFinite(recorded) && recorded > 0
  const deltaFromBaseline = hasRecorded && baseline
    ? roundTo(recorded - baseline.value, 1)
    : null
  return {
    id,
    label: meta.label,
    unit: meta.unit,
    recorded: hasRecorded ? recorded : null,
    baseline,
    deltaFromBaseline,
  }
}

/**
 * Derives a single "today at a glance" snapshot strictly from values already
 * recorded elsewhere on the page (morning check-in inputs, the existing
 * 14-day arithmetic-mean baselines, and today's logged workouts). It never
 * computes a readiness/recovery/stress score — only completeness and a plain
 * delta against the user's own recent recorded history.
 */
export function buildRecoveryRecordedSnapshot(
  inputs: RecoveryDailyInputs,
  baselines: { hrv: RecoveryBaseline | null; rhr: RecoveryBaseline | null; sleepH: RecoveryBaseline | null },
): RecoveryRecordedSnapshot {
  const vitals: RecoverySnapshotVital[] = [
    buildVital('hrv', inputs.hrv, baselines.hrv),
    buildVital('rhr', inputs.rhr, baselines.rhr),
    buildVital('sleepH', inputs.sleepH, baselines.sleepH),
  ]
  const recordedCount = vitals.filter((vital) => vital.recorded !== null).length
  const completeness = recordedCount / vitals.length
  const todayLoad = typeof inputs.loadRpeMin === 'number' && Number.isFinite(inputs.loadRpeMin) && inputs.loadRpeMin > 0
    ? inputs.loadRpeMin
    : 0

  const headline = recordedCount === 0
    ? 'No morning vitals recorded yet today.'
    : recordedCount === vitals.length
      ? 'All 3 morning vitals are recorded for today.'
      : `${recordedCount}/${vitals.length} morning vitals recorded today.`

  return {
    recordedCount,
    completeness,
    headline,
    vitals,
    todayLoad,
    hasWorkoutToday: todayLoad > 0,
  }
}
