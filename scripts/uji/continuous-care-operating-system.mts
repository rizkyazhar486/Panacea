import assert from 'node:assert/strict'
import {
  buildClinicianContinuousCareDigest,
  buildDailyAnamnesisQuestionnaireResponse,
  buildDailyInterview,
  dailyAnamnesisToLongitudinalEvents,
  reconcileOfflineDailyReports,
  submitDailyAnamnesis,
  validateContinuousCarePlan,
  type ContinuousCarePlan,
} from '../../src/lib/continuousCareOperatingSystem.ts'
import {
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  type ConsentEnvelope,
  type LongitudinalEvent,
} from '../../src/lib/panaceaLongitudinalState.ts'

const consent: ConsentEnvelope = {
  granted: true,
  purposes: ['clinical-support', 'ai-context'],
  grantedAt: '2026-09-20T00:00:00.000Z',
}

const plan: ContinuousCarePlan = {
  id: 'care-plan-001',
  version: '1.0.0',
  subjectId: 'patient-001',
  clinicianId: 'doctor-001',
  questionnaireId: 'daily-condition-followup-v1',
  diagnosisRefs: [{
    system: 'icd-10',
    code: 'Z-demo',
    display: 'Demonstration condition',
    verificationStatus: 'confirmed',
  }],
  activeFrom: '2026-09-20T00:00:00.000Z',
  schedule: {
    cadence: 'daily',
    graceMinutes: 180,
  },
  questions: [
    {
      id: 'overall-worse',
      metric: 'patient-reported-overall-worse',
      prompt: 'Are your symptoms worse than yesterday?',
      kind: 'boolean',
      domain: 'symptom',
      required: true,
    },
    {
      id: 'new-warning-symptom',
      metric: 'patient-reported-warning-symptom',
      prompt: 'Do you have the clinician-defined warning symptom?',
      kind: 'boolean',
      domain: 'symptom',
      required: true,
    },
    {
      id: 'medication-taken',
      metric: 'patient-reported-medication-taken',
      prompt: 'Did you take the medication as directed?',
      kind: 'boolean',
      domain: 'medication',
      required: true,
    },
    {
      id: 'warning-detail',
      metric: 'patient-reported-warning-detail',
      prompt: 'Briefly describe the warning symptom.',
      kind: 'text',
      domain: 'symptom',
      required: true,
      showWhen: {
        questionId: 'new-warning-symptom',
        operator: 'equals',
        value: true,
      },
    },
  ],
  patientReportedReviewRules: [{
    id: 'warning-symptom-review',
    label: 'Clinician-defined warning symptom reported',
    questionId: 'new-warning-symptom',
    operator: 'equals',
    value: true,
    priority: 'immediate-human-review',
    rationale: 'This fixture proves that only an explicitly clinician-configured rule can raise the workflow priority.',
  }],
  measurementReviewRules: [{
    id: 'demo-device-rule',
    label: 'Clinician-defined device review rule',
    metric: 'demo-vital',
    operator: 'gte',
    threshold: 10,
    unit: 'u',
    maxAgeMinutes: 30,
    priority: 'review-today',
    rationale: 'Demonstration threshold supplied by the care plan, not hard-coded in the OS.',
    evidenceRef: 'local-policy:demo-v1',
    verifiedBy: 'doctor-001',
    verifiedAt: '2026-09-20T00:00:00.000Z',
  }],
  monitoredMetrics: ['demo-vital', 'patient-reported-overall-worse'],
}

assert.equal(validateContinuousCarePlan(plan), true)

const interview = buildDailyInterview(plan, '2026-09-20T08:00:00.000Z')
assert.equal(interview.questions.length, 3, 'conditional detail stays hidden until its condition is known')

const report = submitDailyAnamnesis(plan, {
  id: 'report-001',
  planId: plan.id,
  planVersion: plan.version,
  subjectId: plan.subjectId,
  scheduledFor: '2026-09-20T08:00:00.000Z',
  authoredAt: '2026-09-20T08:05:00.000Z',
  answers: [
    { questionId: 'overall-worse', value: true },
    { questionId: 'new-warning-symptom', value: true },
    { questionId: 'medication-taken', value: true },
    { questionId: 'warning-detail', value: 'Example patient-reported detail' },
  ],
})
assert.equal(report.completion, 'complete')
assert.equal(report.workflowPriority, 'immediate-human-review')
assert.deepEqual(report.triggeredRuleIds, ['warning-symptom-review'])

const patientEvents = dailyAnamnesisToLongitudinalEvents(
  plan,
  report,
  consent,
  '2026-09-20T08:05:02.000Z',
)
assert.equal(patientEvents.length, 4)
assert.ok(patientEvents.every((event) => event.review.state === 'pending'))
assert.ok(patientEvents.every((event) => event.provenance.sourceKind === 'manual'))
assert.ok(patientEvents.every((event) => event.provenance.method?.includes('daily-questionnaire:')))

const deviceEvent: LongitudinalEvent<number> = {
  id: 'device-demo-001',
  subjectId: plan.subjectId,
  domain: 'device',
  metric: 'demo-vital',
  value: 12,
  unit: 'u',
  recordedAt: '2026-09-20T08:04:00.000Z',
  confidence: 0.95,
  provenance: {
    sourceKind: 'device',
    sourceId: 'demo-device',
    capturedAt: '2026-09-20T08:04:00.000Z',
    receivedAt: '2026-09-20T08:04:01.000Z',
    method: 'fixture',
  },
  consent,
  review: { state: 'not-required' },
}

let state = createLongitudinalPatientState(plan.subjectId, '2026-09-20T08:00:00.000Z')
state = ingestLongitudinalBatch(state, [...patientEvents, deviceEvent])

const digest = buildClinicianContinuousCareDigest(
  plan,
  report,
  state,
  '2026-09-20T08:10:00.000Z',
)
assert.equal(digest.workflowPriority, 'immediate-human-review')
assert.equal(digest.requiresHumanReview, true)
assert.equal(digest.governance.autonomousDiagnosisAllowed, false)
assert.equal(digest.governance.autonomousTreatmentAllowed, false)
assert.equal(digest.monitoredSignals.find((signal) => signal.metric === 'demo-vital')?.available, true)
assert.equal(digest.measurementRules[0].state, 'triggered')
assert.ok(digest.tasks.includes('perform-physical-examination'))
assert.ok(digest.tasks.includes('form-clinical-assessment'))
assert.ok(digest.tasks.includes('review-and-sign-orders-or-medications'))

const questionnaireResponse = buildDailyAnamnesisQuestionnaireResponse(
  plan,
  report,
  {
    patientReference: 'Patient/patient-001',
    encounterReference: 'Encounter/encounter-001',
    questionnaireReference: 'Questionnaire/daily-condition-followup-v1',
  },
)
assert.equal(questionnaireResponse.resourceType, 'QuestionnaireResponse')
assert.equal(questionnaireResponse.status, 'completed')
assert.equal(questionnaireResponse.subject.reference, 'Patient/patient-001')
assert.equal(questionnaireResponse.item.length, 4)

const reconcile = reconcileOfflineDailyReports(plan, [
  {
    clientSequence: 2,
    queuedAt: '2026-09-20T09:00:02.000Z',
    report,
  },
  {
    clientSequence: 1,
    queuedAt: '2026-09-20T09:00:01.000Z',
    report: { ...report, id: 'report-000' },
  },
  {
    clientSequence: 3,
    queuedAt: '2026-09-20T09:00:03.000Z',
    report,
  },
], ['already-on-server'])

assert.deepEqual(reconcile.accepted.map((item) => item.id), ['report-000', 'report-001'])
assert.equal(reconcile.rejected.length, 1)
assert.equal(reconcile.rejected[0].reason, 'duplicate')

const incomplete = submitDailyAnamnesis(plan, {
  id: 'report-incomplete',
  planId: plan.id,
  planVersion: plan.version,
  subjectId: plan.subjectId,
  scheduledFor: '2026-09-20T08:00:00.000Z',
  authoredAt: '2026-09-20T08:05:00.000Z',
  answers: [
    { questionId: 'overall-worse', value: false },
    { questionId: 'new-warning-symptom', value: false },
  ],
})
assert.equal(incomplete.completion, 'incomplete')
assert.deepEqual(incomplete.missingRequiredQuestionIds, ['medication-taken'])
assert.equal(incomplete.workflowPriority, 'routine')

console.log('Continuous Care OS verified: disease-linked daily anamnesis, offline reconciliation, longitudinal ingestion, clinician-configured review rules, device/wearable digest, FHIR QuestionnaireResponse projection, and mandatory human clinical commitment.')
