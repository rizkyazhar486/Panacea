export type RecoveryChecklistStatus = 'pass' | 'attention' | 'waiting'

export interface RecoveryRecordedInputs {
  hrv?: number
  rhr?: number
  sleepH?: number
}

export interface RecoverySharedVitals {
  hrvMs?: number
  restingHr?: number
  sleepH?: number
  source?: string
  measuredAt?: string
  syncedAt?: string
}

export interface RecoveryRecordedChecklistItem {
  id: 'completeness' | 'source' | 'timestamp' | 'units' | 'scientific-boundary'
  label: string
  status: RecoveryChecklistStatus
  detail: string
}

const sameRecordedValue = (a: number | undefined, b: number | undefined): boolean => (
  typeof a === 'number' &&
  Number.isFinite(a) &&
  a > 0 &&
  typeof b === 'number' &&
  Number.isFinite(b) &&
  b > 0 &&
  Math.abs(a - b) < 0.05
)

const validRecordedCount = (inputs: RecoveryRecordedInputs): number => [
  inputs.hrv,
  inputs.rhr,
  inputs.sleepH,
].filter((value) => typeof value === 'number' && Number.isFinite(value) && value > 0).length

export function buildRecoveryRecordedChecklist(
  inputs: RecoveryRecordedInputs,
  shared: RecoverySharedVitals,
): RecoveryRecordedChecklistItem[] {
  const recordedCount = validRecordedCount(inputs)
  const source = typeof shared.source === 'string' && shared.source.trim() ? shared.source.trim() : null
  const timestamp = [shared.measuredAt, shared.syncedAt]
    .find((value) => typeof value === 'string' && value.trim()) ?? null

  const sharedMatches = [
    sameRecordedValue(inputs.hrv, shared.hrvMs),
    sameRecordedValue(inputs.rhr, shared.restingHr),
    sameRecordedValue(inputs.sleepH, shared.sleepH),
  ]
  const matchingRecordedCount = sharedMatches.filter(Boolean).length
  const allRecordedValuesTraceable = recordedCount > 0 && matchingRecordedCount === recordedCount

  return [
    {
      id: 'completeness',
      label: 'Morning recorded inputs',
      status: recordedCount === 0 ? 'waiting' : recordedCount === 3 ? 'pass' : 'attention',
      detail: recordedCount === 0
        ? 'No HRV, resting-HR or sleep value is recorded yet; the checklist stays empty rather than inventing a default.'
        : recordedCount === 3
          ? 'HRV, resting HR and sleep duration are all present as finite positive recorded values.'
          : `${recordedCount}/3 morning inputs are recorded. Missing measurements stay missing and should not be inferred.`,
    },
    {
      id: 'source',
      label: 'Source identity',
      status: recordedCount === 0 ? 'waiting' : allRecordedValuesTraceable && source ? 'pass' : 'attention',
      detail: recordedCount === 0
        ? 'Source identity becomes applicable once a morning value is recorded.'
        : allRecordedValuesTraceable && source
          ? `All currently recorded morning values match the shared-vitals snapshot from ${source}.`
          : 'At least one recorded morning value is local-only or lacks a matching shared-vitals source. Do not assign a device source to it.',
    },
    {
      id: 'timestamp',
      label: 'Measurement / sync timestamp',
      status: recordedCount === 0 ? 'waiting' : allRecordedValuesTraceable && timestamp ? 'pass' : 'attention',
      detail: recordedCount === 0
        ? 'Timestamp checking waits until a morning value is recorded.'
        : allRecordedValuesTraceable && timestamp
          ? `Shared-vitals provenance includes timestamp ${timestamp}.`
          : 'A matching measurement/sync timestamp is not available for every recorded morning value. Keep the time unknown rather than guessing it.',
    },
    {
      id: 'units',
      label: 'Units preserved',
      status: recordedCount === 0 ? 'waiting' : 'pass',
      detail: recordedCount === 0
        ? 'No recorded value is present, so no unit claim is synthesized.'
        : 'The workbench keeps HRV in ms, resting HR in bpm and sleep duration in hours.',
    },
    {
      id: 'scientific-boundary',
      label: 'Scientific boundary',
      status: 'pass',
      detail: 'This checklist audits recorded-data completeness and provenance only. It does not calculate a readiness, recovery or stress score; infer provider-derived metrics; diagnose illness; forecast recovery; or prescribe training or treatment.',
    },
  ]
}
