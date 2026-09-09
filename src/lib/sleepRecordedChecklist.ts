import type { SleepNight } from './api'

export type SleepChecklistStatus = 'ready' | 'attention'

export type SleepChecklistItem = {
  id: 'history' | 'timestamps' | 'source' | 'measurements' | 'boundary'
  title: string
  status: SleepChecklistStatus
  detail: string
}

export type SleepChecklistSummary = {
  total: number
  ready: number
  attention: number
}

const MAX_RETAINED_NIGHTS = 30

function hasValidDate(value?: string): boolean {
  return Boolean(value && Number.isFinite(Date.parse(value)))
}

function hasValidOptionalTimestamp(value?: string): boolean {
  return value == null || value === '' || hasValidDate(value)
}

function isNonNegativeFinite(value?: number): boolean {
  return value == null || (Number.isFinite(value) && value >= 0)
}

function hasRecordedSource(night: SleepNight): boolean {
  return typeof night.source === 'string' && night.source.trim().length > 0
}

export function buildSleepRecordedChecklist(nights: SleepNight[]): SleepChecklistItem[] {
  const retained = nights.slice(0, MAX_RETAINED_NIGHTS)
  const missingSources = retained.filter((night) => !hasRecordedSource(night)).length
  const datesAndTimesValid = retained.length > 0 && retained.every((night) => (
    hasValidDate(night.date)
    && hasValidOptionalTimestamp(night.start)
    && hasValidOptionalTimestamp(night.end)
  ))
  const measurementsValid = retained.length > 0 && retained.every((night) => (
    typeof night.totalH === 'number'
    && Number.isFinite(night.totalH)
    && night.totalH >= 0
    && isNonNegativeFinite(night.deepH)
    && isNonNegativeFinite(night.remH)
    && isNonNegativeFinite(night.coreH)
    && isNonNegativeFinite(night.awakeH)
    && isNonNegativeFinite(night.inBedH)
  ))

  return [
    {
      id: 'history',
      title: 'Recorded history stays bounded',
      status: retained.length > 0 ? 'ready' : 'attention',
      detail: retained.length > 0
        ? `${retained.length} recorded night${retained.length === 1 ? '' : 's'} retained; this view never evaluates more than the latest ${MAX_RETAINED_NIGHTS}.`
        : 'No recorded sleep nights are available, so Panacea leaves the checklist empty rather than synthesizing history.',
    },
    {
      id: 'timestamps',
      title: 'Dates and optional timestamps remain traceable',
      status: datesAndTimesValid ? 'ready' : 'attention',
      detail: datesAndTimesValid
        ? 'Every retained night has a valid record date; start/end timestamps are validated only when the source supplied them.'
        : 'At least one retained record has a missing/invalid date or an invalid supplied start/end timestamp. Panacea does not invent a replacement time.',
    },
    {
      id: 'source',
      title: 'Source identity is explicit',
      status: retained.length > 0 && missingSources === 0 ? 'ready' : 'attention',
      detail: retained.length > 0 && missingSources === 0
        ? 'Every retained night carries recorded source metadata; the checklist preserves that identity without guessing another device or provider.'
        : `${missingSources} of ${retained.length} retained night${retained.length === 1 ? '' : 's'} lack source metadata; Panacea does not infer Apple Health, Oura, WHOOP, or another provider.`,
    },
    {
      id: 'measurements',
      title: 'Hours and missing stages stay explicit',
      status: measurementsValid ? 'ready' : 'attention',
      detail: measurementsValid
        ? 'Recorded total/stage fields remain non-negative hour values. Optional stage fields may stay missing; they are not filled with synthetic sleep-stage data.'
        : 'At least one retained night is missing a valid total duration or contains an invalid supplied stage value. Missing stages remain missing instead of being imputed.',
    },
    {
      id: 'boundary',
      title: 'Recorded-data checks are not clinical clearance',
      status: 'ready',
      detail: 'This checklist audits stored-record integrity only. It does not validate wearable sleep staging, diagnose a sleep disorder, or clinically approve interpretation or treatment advice elsewhere in the app.',
    },
  ]
}

export function summarizeSleepRecordedChecklist(items: SleepChecklistItem[]): SleepChecklistSummary {
  const ready = items.filter((item) => item.status === 'ready').length
  return {
    total: items.length,
    ready,
    attention: items.length - ready,
  }
}
