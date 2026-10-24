/**
 * Outcome-first projection for an existing outpatient encounter.
 * Read-only: never executes orders, signs charts, submits claims or attests outcomes.
 */
import type { EMRRecord } from '../../../lib/types'

export type OutcomeStepId = 'context' | 'clinical' | 'coordination' | 'followUp'
export type OutcomeStepState = 'missing' | 'prepared' | 'needs-review' | 'verified' | 'tracked' | 'blocked'

export interface OutcomeStep {
  id: OutcomeStepId
  title: string
  state: OutcomeStepState
  detail: string
  href: string
}
export interface EncounterOutcomeJobInput {
  patientId: string
  evaluatedAt: string
  vitalTimestamps: readonly string[]
  historyItemCount: number
  record?: EMRRecord
  criticalFlag?: boolean
}
export interface EncounterOutcomeJob {
  patientId: string
  job: 'outpatient-encounter-and-follow-up'
  steps: readonly OutcomeStep[]
  nextAction: { title: string; href: string; reason: string }
  clinicalRecordVerified: boolean
  operationalOutcomeVerified: false
  evidenceLevel: 'local-workflow-projection'
}

function availableAt(value: unknown, evaluatedAtMs: number): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false
  const at = Date.parse(value)
  if (!Number.isFinite(at) || at > evaluatedAtMs) return false
  const [year, month, day, hours, minutes, seconds] = value.slice(0, 19).split(/[-T:]/).map(Number)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 30, 31]
  const tz = value.match(/([+-])(\d{2}):(\d{2})$/)
  if (!Number.isInteger(month) || month < 1 || month > 12 || day < 1 || day > days[month - 1] || hours > 23 || minutes > 59 || seconds > 59) return false
  if (tz && (+tz[2] > 14 || +tz[3] > 59 || (+tz[2] === 14 && +tz[3] !== 0))) return false
  return true
}

export function deriveEncounterOutcomeJob(input: EncounterOutcomeJobInput): EncounterOutcomeJob {
  if (!input.patientId?.trim()) throw new Error('patientId is required')
  if (!availableAt(input.evaluatedAt, Date.parse(input.evaluatedAt))) throw new Error('evaluatedAt must be a real, timezone-aware timestamp')
  const now = Date.parse(input.evaluatedAt)
  const record = input.record?.patientId === input.patientId && availableAt(input.record.updatedAt, now)
    ? input.record : undefined
  const hasVitals = input.vitalTimestamps.some(value => availableAt(value, now))
  const hasContext = hasVitals || input.historyItemCount > 0 || Boolean(record)
  const proposals = record?.plan.filter(item => item.status === 'usulan').length ?? 0
  const hasSignedEvidence = Boolean(
    record?.physicalExam.verifiedById?.trim() &&
    record?.signedById?.trim() &&
    record.signedAt && availableAt(record.signedAt, now) &&
    Date.parse(record.signedAt) >= Date.parse(record.updatedAt) &&
    record.plan.every(item => item.status === 'ditolak' || (
      item.status === 'diverifikasi' && Boolean(item.verifiedById?.trim()) &&
      Boolean(item.verifiedAt && availableAt(item.verifiedAt, now))
    )),
  )
  const episodes = record?.careEpisodes ?? []
  const handoffBlocked = episodes.some(e => e.stages.some(stage => stage.status === 'blocked'))
  const handoffTracked = episodes.some(e => e.stages.some(stage =>
    (stage.stage === 'schedule' || stage.stage === 'treatment' || stage.stage === 'followUp') &&
    (stage.status === 'active' || stage.status === 'done') &&
    Boolean(stage.updatedAt && availableAt(stage.updatedAt, now)),
  ))
  const outcomesRecorded = episodes.length > 0 && episodes.every(e =>
    ['followUp', 'outcome'].every(stageName => e.stages.some(stage =>
      stage.stage === stageName && stage.status === 'done' &&
      Boolean(stage.updatedAt && availableAt(stage.updatedAt, now)),
    )),
  )
  const steps: OutcomeStep[] = [
    { id: 'context', title: 'Context', state: hasContext ? 'prepared' : 'missing',
      detail: hasContext ? 'Data available; provenance and gaps still require review' : 'Collect clinical context or current observations', href: '/emr' },
    { id: 'clinical', title: 'Clinical sign-off', state: hasSignedEvidence ? 'verified' : record ? 'needs-review' : 'missing',
      detail: hasSignedEvidence ? 'Current chart signed with clinician-reviewed examination and plan' : proposals > 0
        ? 'Proposed plan items awaiting review: ' + proposals : 'Requires a current clinician-reviewed and signed chart', href: '/emr' },
    { id: 'coordination', title: 'Care handoff', state: handoffBlocked ? 'blocked' : handoffTracked ? 'tracked' : 'missing',
      detail: handoffBlocked ? 'Care episode reports a blocked step' : handoffTracked
        ? 'Handoff status recorded, not independently verified' : 'No current care execution/handoff evidence', href: '/care-episode' },
    { id: 'followUp', title: 'Follow-up outcome', state: outcomesRecorded ? 'tracked' : 'missing',
      detail: outcomesRecorded ? 'Follow-up and outcome recorded; verification still required' : 'No complete follow-up outcome evidence', href: '/care-episode' },
  ]
  const pick = (id: OutcomeStepId) => steps.find(s => s.id === id)!
  const candidate = input.criticalFlag === true
    ? { title: 'Review critical flag now', href: '/emr', reason: 'Potentially critical findings always outrank workflow completion' }
    : !hasContext ? { title: 'Assemble encounter context', href: '/emr', reason: pick('context').detail }
    : !hasSignedEvidence ? { title: 'Review and sign clinical record', href: '/emr', reason: pick('clinical').detail }
    : handoffBlocked ? { title: 'Resolve blocked care handoff', href: '/care-episode', reason: pick('coordination').detail }
    : !handoffTracked ? { title: 'Track care delivery or document no handoff needed', href: '/care-episode', reason: pick('coordination').detail }
    : !outcomesRecorded ? { title: 'Close the follow-up loop', href: '/care-episode', reason: pick('followUp').detail }
    : { title: 'Review recorded outcome evidence', href: '/care-episode', reason: 'An operational completion flag is not independently verified clinical outcome' }
  return {
    patientId: input.patientId,
    job: 'outpatient-encounter-and-follow-up',
    steps,
    nextAction: candidate,
    clinicalRecordVerified: hasSignedEvidence,
    operationalOutcomeVerified: false,
    evidenceLevel: 'local-workflow-projection',
  }
}
