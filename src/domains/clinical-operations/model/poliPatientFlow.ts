export type PoliFlowPriority = 'critical' | 'attention' | 'review' | 'data-gap' | 'routine'
export type PoliDataFreshness = 'recent' | 'today' | 'historical' | 'missing'

export interface PoliSupportiveSignal {
  takenAt: string
  category: string
  flag?: 'low' | 'normal' | 'high' | 'critical'
}

export interface PoliPatientFlowInput {
  patientId: string
  name: string
  mrn: string
  dob: string
  sex: string
  riskFlagCount: number
  historyItemCount: number
  vitalTimestamps: readonly string[]
  supportiveSignals: readonly PoliSupportiveSignal[]
  record?: {
    updatedAt: string
    primaryDiagnosis?: string
    physicalExamClinicianVerified: boolean
    recordClinicianSigned: boolean
    proposedPlanCount: number
  }
}

export interface PoliPatientFlow {
  patientId: string
  name: string
  mrn: string
  dob: string
  sex: string
  ageYears: number | null
  priority: PoliFlowPriority
  freshness: PoliDataFreshness
  latestAt: string | null
  dataSources: string[]
  nextAction: string
  primaryDiagnosis?: string
  proposedPlanCount: number
  invalidTimestampCount: number
  hasCriticalResult: boolean
}

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

function parsedTime(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Observations are available only once their recorded time is reached. */
export function isClinicalObservationAvailableAt(value: unknown, atMs: number): boolean {
  const time = parsedTime(value)
  return Number.isFinite(atMs) && time !== null && time <= atMs
}

function ageAt(dob: string, nowIso: string): number | null {
  const born = new Date(dob)
  const now = new Date(nowIso)
  if (!Number.isFinite(born.getTime()) || !Number.isFinite(now.getTime()) || born.getTime() > now.getTime()) return null
  let years = now.getUTCFullYear() - born.getUTCFullYear()
  const beforeBirthday =
    now.getUTCMonth() < born.getUTCMonth() ||
    (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate())
  if (beforeBirthday) years -= 1
  return years >= 0 ? years : null
}

export function derivePoliPatientFlow(input: PoliPatientFlowInput, nowIso: string): PoliPatientFlow {
  const nowMs = parsedTime(nowIso)
  if (nowMs === null) throw new Error('nowIso must be a valid timestamp')

  const timestamps = [
    ...input.vitalTimestamps,
    ...input.supportiveSignals.map((signal) => signal.takenAt),
    ...(input.record ? [input.record.updatedAt] : []),
  ]
  const parsed = timestamps.map((value) => ({ value, ms: parsedTime(value) }))
  // A future observation is not available evidence at this workflow's evaluation time.
  const invalidTimestampCount = parsed.filter((item) => item.ms === null || item.ms > nowMs).length
  const valid = parsed.filter((item): item is { value: string; ms: number } => item.ms !== null && item.ms <= nowMs)
  valid.sort((a, b) => b.ms - a.ms)

  const latest = valid[0] ?? null
  const ageMs = latest ? nowMs - latest.ms : Number.POSITIVE_INFINITY
  const freshness: PoliDataFreshness =
    !latest ? 'missing' :
    ageMs <= 15 * MINUTE_MS ? 'recent' :
    ageMs <= DAY_MS ? 'today' :
    'historical'

  const availableAt = (value: string) => isClinicalObservationAvailableAt(value, nowMs)
  const supportiveSignals = input.supportiveSignals.filter(signal => availableAt(signal.takenAt))
  const hasCriticalFlag = input.supportiveSignals.some(signal => signal.flag === 'critical')
  const hasCriticalResult = supportiveSignals.some(signal => signal.flag === 'critical')
  const hasVitals = input.vitalTimestamps.some(availableAt)
  const record = input.record && availableAt(input.record.updatedAt) ? input.record : undefined
  const proposedPlanCount = record?.proposedPlanCount ?? 0

  let priority: PoliFlowPriority
  let nextAction: string
  if (hasCriticalFlag) {
    priority = 'critical'
    nextAction = hasCriticalResult ? 'Review critical result now' : 'Review critical flag and reconcile timestamp/provenance'
  } else if (invalidTimestampCount > 0) {
    priority = 'data-gap'
    nextAction = 'Reconcile timestamp and provenance gap'
  } else if (input.riskFlagCount > 0) {
    priority = 'attention'
    nextAction = 'Review recorded risk flags before the encounter'
  } else if (!hasVitals) {
    priority = 'data-gap'
    nextAction = 'Capture or ingest current observations'
  } else if (!record) {
    priority = 'data-gap'
    nextAction = 'Open AI-EMR: history and physical exam'
  } else if (record.physicalExamClinicianVerified !== true) {
    priority = 'review'
    nextAction = 'Clinician review of physical exam'
  } else if (record.recordClinicianSigned !== true) {
    priority = 'review'
    nextAction = 'Review and sign the encounter'
  } else if (proposedPlanCount > 0) {
    priority = 'review'
    nextAction = `Verify ${proposedPlanCount} proposed plan item${proposedPlanCount === 1 ? '' : 's'}`
  } else {
    priority = 'routine'
    nextAction = 'Continue longitudinal monitoring and follow-up'
  }

  const categories = [...new Set(supportiveSignals.map((signal) => signal.category).filter(Boolean))]
  const dataSources = [
    ...(input.historyItemCount > 0 ? ['Longitudinal history'] : []),
    ...(hasVitals ? ['Vitals'] : []),
    ...categories,
    ...(record ? ['AI-EMR'] : []),
  ]

  return {
    patientId: input.patientId,
    name: input.name,
    mrn: input.mrn,
    dob: input.dob,
    sex: input.sex,
    ageYears: ageAt(input.dob, nowIso),
    priority,
    freshness,
    latestAt: latest?.value ?? null,
    dataSources,
    nextAction,
    primaryDiagnosis: record?.primaryDiagnosis,
    proposedPlanCount,
    invalidTimestampCount,
    hasCriticalResult,
  }
}
