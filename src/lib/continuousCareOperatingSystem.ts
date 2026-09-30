import {
  isConsentActive,
  metricSnapshot,
  numericMetricTrend,
  validateLongitudinalEvent,
  type ConsentEnvelope,
  type LongitudinalEvent,
  type LongitudinalPatientState,
} from './panaceaLongitudinalState.ts'

export type CareWorkflowPriority = 'routine' | 'review-today' | 'immediate-human-review'
export type CareQuestionKind = 'boolean' | 'number' | 'text' | 'choice'
export type CareAnswerValue = boolean | number | string
export type CareComparator = 'equals' | 'not-equals' | 'gte' | 'lte' | 'contains'

export interface ContinuousCareConditionRef {
  system: 'icd-10' | 'snomed-ct' | 'local'
  code: string
  display: string
  verificationStatus: 'confirmed' | 'provisional' | 'differential'
}

export interface CareRulePredicate {
  questionId: string
  operator: CareComparator
  value: CareAnswerValue
}

export interface ContinuousCareQuestion {
  id: string
  metric: string
  prompt: string
  kind: CareQuestionKind
  domain: 'symptom' | 'medication'
  required: boolean
  unit?: string
  choices?: readonly string[]
  showWhen?: CareRulePredicate
}

export interface PatientReportedReviewRule extends CareRulePredicate {
  id: string
  label: string
  priority: Exclude<CareWorkflowPriority, 'routine'>
  rationale: string
}

export type MeasurementSourcePolicy = 'shared-lab-transcribed' | 'verified-clinical-vital'

export interface MeasurementReviewRule {
  id: string
  label: string
  metric: string
  operator: Extract<CareComparator, 'gte' | 'lte' | 'equals' | 'not-equals'>
  threshold: number
  unit: string
  maxAgeMinutes: number
  priority: Exclude<CareWorkflowPriority, 'routine'>
  rationale: string
  evidenceRef: string
  verifiedBy: string
  verifiedAt: string
  /** Server-stamped trust boundary. Legacy lab rules may omit it; vital rules may not. */
  sourcePolicy?: MeasurementSourcePolicy
}

export interface ContinuousCarePlan {
  id: string
  version: string
  subjectId: string
  clinicianId: string
  questionnaireId: string
  diagnosisRefs: readonly ContinuousCareConditionRef[]
  activeFrom: string
  activeUntil?: string
  schedule: {
    cadence: 'daily'
    graceMinutes: number
  }
  questions: readonly ContinuousCareQuestion[]
  patientReportedReviewRules: readonly PatientReportedReviewRule[]
  measurementReviewRules: readonly MeasurementReviewRule[]
  monitoredMetrics: readonly string[]
}

export interface DailyInterview {
  planId: string
  planVersion: string
  subjectId: string
  questionnaireId: string
  scheduledFor: string
  questions: readonly ContinuousCareQuestion[]
}

export interface DailyAnamnesisAnswer {
  questionId: string
  value: CareAnswerValue
}

export interface DailyAnamnesisReport {
  id: string
  planId: string
  planVersion: string
  questionnaireId: string
  subjectId: string
  scheduledFor: string
  authoredAt: string
  answers: readonly DailyAnamnesisAnswer[]
  missingRequiredQuestionIds: readonly string[]
  triggeredRuleIds: readonly string[]
  completion: 'complete' | 'incomplete'
  workflowPriority: CareWorkflowPriority
}

export interface DailyAnamnesisSubmissionInput {
  id: string
  planId: string
  planVersion: string
  subjectId: string
  scheduledFor: string
  authoredAt: string
  answers: readonly DailyAnamnesisAnswer[]
}

export interface MonitoredSignalDigest {
  metric: string
  available: boolean
  value?: unknown
  unit?: string
  recordedAt?: string
  receivedAt?: string
  provenanceSourceKind?: string
  provenanceSourceId?: string
  reviewState?: string
  trend?: ReturnType<typeof numericMetricTrend>
}

export interface MeasurementRuleEvaluation {
  ruleId: string
  label: string
  metric: string
  state: 'triggered' | 'not-triggered' | 'missing' | 'stale' | 'unit-mismatch' | 'blocked-by-consent' | 'source-unverified'
  priority?: Exclude<CareWorkflowPriority, 'routine'>
  rationale: string
  observed?: number
  unit?: string
  ageMinutes?: number
}

export interface ClinicianContinuousCareDigest {
  planId: string
  planVersion: string
  subjectId: string
  clinicianId: string
  generatedAt: string
  diagnosisRefs: readonly ContinuousCareConditionRef[]
  latestDailyReport: DailyAnamnesisReport | null
  monitoredSignals: readonly MonitoredSignalDigest[]
  measurementRules: readonly MeasurementRuleEvaluation[]
  workflowPriority: CareWorkflowPriority
  requiresHumanReview: true
  tasks: readonly (
    | 'verify-patient-reported-history'
    | 'review-triggered-rules'
    | 'perform-physical-examination'
    | 'form-clinical-assessment'
    | 'review-and-sign-orders-or-medications'
  )[]
  governance: {
    patientReportIsSignedDiagnosis: false
    deviceSignalIsSignedRecord: false
    autonomousDiagnosisAllowed: false
    autonomousTreatmentAllowed: false
    autonomousEmergencyDispositionAllowed: false
  }
}

export interface QueuedDailyReport {
  clientSequence: number
  queuedAt: string
  report: DailyAnamnesisReport
}

export interface OfflineReconcileResult {
  accepted: DailyAnamnesisReport[]
  rejected: Array<{
    reportId: string
    reason: 'duplicate' | 'subject-mismatch' | 'plan-mismatch' | 'plan-version-mismatch' | 'invalid-sequence'
  }>
}

export interface DailyQuestionnaireFhirReferences {
  patientReference: string
  encounterReference?: string
  questionnaireReference?: string
}

export interface DailyQuestionnaireResponse {
  resourceType: 'QuestionnaireResponse'
  id: string
  identifier: Array<{ system: string; value: string }>
  questionnaire: string
  status: 'completed' | 'in-progress'
  subject: { reference: string }
  encounter?: { reference: string }
  authored: string
  source: { reference: string }
  item: Array<{
    linkId: string
    text: string
    answer: Array<
      | { valueBoolean: boolean }
      | { valueDecimal: number }
      | { valueString: string }
    >
  }>
}

function requiredText(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} must not be blank`)
  return normalized
}

function parseIso(value: string, field: string): number {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid ISO timestamp`)
  return parsed
}

function validateComparator(actual: CareAnswerValue, operator: CareComparator, expected: CareAnswerValue): boolean {
  if (operator === 'equals') return actual === expected
  if (operator === 'not-equals') return actual !== expected
  if (operator === 'contains') {
    return typeof actual === 'string' && typeof expected === 'string'
      ? actual.toLocaleLowerCase().includes(expected.toLocaleLowerCase())
      : false
  }
  if (typeof actual !== 'number' || typeof expected !== 'number') return false
  return operator === 'gte' ? actual >= expected : actual <= expected
}

function questionVisible(question: ContinuousCareQuestion, answers: ReadonlyMap<string, CareAnswerValue>): boolean {
  if (!question.showWhen) return true
  const actual = answers.get(question.showWhen.questionId)
  return actual === undefined
    ? false
    : validateComparator(actual, question.showWhen.operator, question.showWhen.value)
}

function rank(priority: CareWorkflowPriority): number {
  if (priority === 'immediate-human-review') return 2
  if (priority === 'review-today') return 1
  return 0
}

function maxPriority(...priorities: CareWorkflowPriority[]): CareWorkflowPriority {
  return priorities.reduce<CareWorkflowPriority>(
    (best, current) => rank(current) > rank(best) ? current : best,
    'routine',
  )
}

function validateQuestion(question: ContinuousCareQuestion) {
  requiredText(question.id, 'question.id')
  requiredText(question.metric, 'question.metric')
  requiredText(question.prompt, 'question.prompt')
  if (question.kind === 'choice' && (!question.choices || question.choices.length < 1)) {
    throw new Error('choice question requires at least one choice')
  }
  if (question.kind !== 'choice' && question.choices?.length) {
    throw new Error('choices are only valid for choice questions')
  }
}

export function validateContinuousCarePlan(plan: ContinuousCarePlan): true {
  requiredText(plan.id, 'plan.id')
  requiredText(plan.version, 'plan.version')
  requiredText(plan.subjectId, 'plan.subjectId')
  requiredText(plan.clinicianId, 'plan.clinicianId')
  requiredText(plan.questionnaireId, 'plan.questionnaireId')
  const activeFrom = parseIso(plan.activeFrom, 'plan.activeFrom')
  if (plan.activeUntil && parseIso(plan.activeUntil, 'plan.activeUntil') <= activeFrom) {
    throw new Error('plan.activeUntil must be after activeFrom')
  }
  if (!Number.isSafeInteger(plan.schedule.graceMinutes) || plan.schedule.graceMinutes < 0) {
    throw new Error('plan.schedule.graceMinutes must be a non-negative integer')
  }
  if (plan.diagnosisRefs.length < 1) throw new Error('plan requires at least one diagnosis reference')
  if (plan.questions.length < 1) throw new Error('plan requires at least one question')

  const questionIds = new Set<string>()
  for (const condition of plan.diagnosisRefs) {
    requiredText(condition.code, 'condition.code')
    requiredText(condition.display, 'condition.display')
  }
  for (const question of plan.questions) {
    validateQuestion(question)
    if (questionIds.has(question.id)) throw new Error(`duplicate question id: ${question.id}`)
    questionIds.add(question.id)
  }
  for (const question of plan.questions) {
    if (question.showWhen && !questionIds.has(question.showWhen.questionId)) {
      throw new Error(`showWhen references unknown question: ${question.showWhen.questionId}`)
    }
  }

  const ruleIds = new Set<string>()
  for (const rule of plan.patientReportedReviewRules) {
    requiredText(rule.id, 'patientReportedReviewRule.id')
    requiredText(rule.label, 'patientReportedReviewRule.label')
    requiredText(rule.rationale, 'patientReportedReviewRule.rationale')
    if (!questionIds.has(rule.questionId)) throw new Error(`review rule references unknown question: ${rule.questionId}`)
    if (ruleIds.has(rule.id)) throw new Error(`duplicate rule id: ${rule.id}`)
    ruleIds.add(rule.id)
  }

  for (const rule of plan.measurementReviewRules) {
    requiredText(rule.id, 'measurementReviewRule.id')
    requiredText(rule.label, 'measurementReviewRule.label')
    requiredText(rule.metric, 'measurementReviewRule.metric')
    requiredText(rule.unit, 'measurementReviewRule.unit')
    requiredText(rule.rationale, 'measurementReviewRule.rationale')
    requiredText(rule.evidenceRef, 'measurementReviewRule.evidenceRef')
    requiredText(rule.verifiedBy, 'measurementReviewRule.verifiedBy')
    parseIso(rule.verifiedAt, 'measurementReviewRule.verifiedAt')
    const sourcePolicy = rule.sourcePolicy ?? (rule.metric.startsWith('lab.') ? 'shared-lab-transcribed' : undefined)
    if (!sourcePolicy) throw new Error('non-lab measurement rules require an explicit source policy')
    if (sourcePolicy === 'shared-lab-transcribed' && !rule.metric.startsWith('lab.')) throw new Error('shared-lab source policy requires a lab metric')
    if (sourcePolicy === 'verified-clinical-vital' && !rule.metric.startsWith('vital.')) throw new Error('verified-vital source policy requires a vital metric')
    if (!Number.isFinite(rule.threshold)) throw new Error('measurement rule threshold must be finite')
    if (!Number.isFinite(rule.maxAgeMinutes) || rule.maxAgeMinutes <= 0) {
      throw new Error('measurement rule maxAgeMinutes must be positive')
    }
    if (ruleIds.has(rule.id)) throw new Error(`duplicate rule id: ${rule.id}`)
    ruleIds.add(rule.id)
  }
  return true
}

export function buildDailyInterview(
  plan: ContinuousCarePlan,
  scheduledFor: string,
  previousAnswers: readonly DailyAnamnesisAnswer[] = [],
): DailyInterview {
  validateContinuousCarePlan(plan)
  const scheduledMs = parseIso(scheduledFor, 'scheduledFor')
  const activeFrom = parseIso(plan.activeFrom, 'plan.activeFrom')
  const activeUntil = plan.activeUntil ? parseIso(plan.activeUntil, 'plan.activeUntil') : Number.POSITIVE_INFINITY
  if (scheduledMs < activeFrom || scheduledMs >= activeUntil) throw new Error('scheduledFor is outside active plan window')

  const prior = new Map(previousAnswers.map((answer) => [answer.questionId, answer.value] as const))
  return {
    planId: plan.id,
    planVersion: plan.version,
    subjectId: plan.subjectId,
    questionnaireId: plan.questionnaireId,
    scheduledFor,
    questions: plan.questions.filter((question) => questionVisible(question, prior)),
  }
}

export function submitDailyAnamnesis(
  plan: ContinuousCarePlan,
  input: DailyAnamnesisSubmissionInput,
): DailyAnamnesisReport {
  validateContinuousCarePlan(plan)
  requiredText(input.id, 'input.id')
  if (input.planId !== plan.id) throw new Error('input.planId does not match plan')
  if (input.planVersion !== plan.version) throw new Error('input.planVersion does not match plan')
  if (input.subjectId !== plan.subjectId) throw new Error('input.subjectId does not match plan')
  parseIso(input.scheduledFor, 'input.scheduledFor')
  parseIso(input.authoredAt, 'input.authoredAt')

  const answers = new Map<string, CareAnswerValue>()
  for (const answer of input.answers) {
    if (answers.has(answer.questionId)) throw new Error(`duplicate answer: ${answer.questionId}`)
    const question = plan.questions.find((candidate) => candidate.id === answer.questionId)
    if (!question) throw new Error(`answer references unknown question: ${answer.questionId}`)
    if (question.kind === 'boolean' && typeof answer.value !== 'boolean') throw new Error(`answer type mismatch: ${question.id}`)
    if (question.kind === 'number' && typeof answer.value !== 'number') throw new Error(`answer type mismatch: ${question.id}`)
    if ((question.kind === 'text' || question.kind === 'choice') && typeof answer.value !== 'string') {
      throw new Error(`answer type mismatch: ${question.id}`)
    }
    if (question.kind === 'choice' && question.choices && !question.choices.includes(String(answer.value))) {
      throw new Error(`answer is outside allowed choices: ${question.id}`)
    }
    answers.set(answer.questionId, answer.value)
  }

  const visibleQuestions = plan.questions.filter((question) => questionVisible(question, answers))
  const missingRequiredQuestionIds = visibleQuestions
    .filter((question) => question.required && !answers.has(question.id))
    .map((question) => question.id)

  const triggeredRules = plan.patientReportedReviewRules.filter((rule) => {
    const actual = answers.get(rule.questionId)
    return actual === undefined ? false : validateComparator(actual, rule.operator, rule.value)
  })

  const workflowPriority = triggeredRules.reduce<CareWorkflowPriority>(
    (priority, rule) => maxPriority(priority, rule.priority),
    'routine',
  )

  return {
    id: input.id,
    planId: plan.id,
    planVersion: plan.version,
    questionnaireId: plan.questionnaireId,
    subjectId: plan.subjectId,
    scheduledFor: input.scheduledFor,
    authoredAt: input.authoredAt,
    answers: input.answers.map((answer) => ({ ...answer })),
    missingRequiredQuestionIds,
    triggeredRuleIds: triggeredRules.map((rule) => rule.id),
    completion: missingRequiredQuestionIds.length ? 'incomplete' : 'complete',
    workflowPriority,
  }
}

export function dailyAnamnesisToLongitudinalEvents(
  plan: ContinuousCarePlan,
  report: DailyAnamnesisReport,
  consent: ConsentEnvelope,
  receivedAt: string,
  confidence = 1,
): LongitudinalEvent[] {
  validateContinuousCarePlan(plan)
  if (report.planId !== plan.id || report.planVersion !== plan.version) throw new Error('report does not match plan version')
  if (report.subjectId !== plan.subjectId) throw new Error('report subject does not match plan')
  parseIso(receivedAt, 'receivedAt')
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error('confidence must be in [0,1]')

  return report.answers.map((answer) => {
    const question = plan.questions.find((candidate) => candidate.id === answer.questionId)
    if (!question) throw new Error(`unknown question in report: ${answer.questionId}`)
    const event: LongitudinalEvent = {
      id: `continuous-care:${report.id}:${question.id}`,
      subjectId: report.subjectId,
      domain: question.domain,
      metric: question.metric,
      value: answer.value,
      unit: question.unit,
      recordedAt: report.authoredAt,
      confidence,
      provenance: {
        sourceKind: 'manual',
        sourceId: `continuous-care:${plan.id}`,
        capturedAt: report.authoredAt,
        receivedAt,
        method: `daily-questionnaire:${plan.questionnaireId}@${plan.version}`,
      },
      consent: { ...consent, purposes: [...consent.purposes] },
      review: { state: 'pending' },
      tags: [
        'continuous-care',
        `plan:${plan.id}`,
        `questionnaire:${plan.questionnaireId}`,
        ...plan.diagnosisRefs.map((condition) => `condition:${condition.system}:${condition.code}`),
      ],
    }
    validateLongitudinalEvent(event)
    return event
  })
}

function evaluateMeasurementRule(
  state: LongitudinalPatientState,
  rule: MeasurementReviewRule,
  now: string,
): MeasurementRuleEvaluation {
  const snapshot = metricSnapshot(state, rule.metric)
  if (!snapshot) {
    return { ruleId: rule.id, label: rule.label, metric: rule.metric, state: 'missing', rationale: rule.rationale }
  }
  if (!isConsentActive(snapshot.latest.consent, 'clinical-support', Date.parse(now))) {
    return { ruleId: rule.id, label: rule.label, metric: rule.metric, state: 'blocked-by-consent', rationale: rule.rationale }
  }
  const sourcePolicy = rule.sourcePolicy ?? (rule.metric.startsWith('lab.') ? 'shared-lab-transcribed' : undefined)
  if (sourcePolicy === 'verified-clinical-vital') {
    const trusted = snapshot.latest.provenance.sourceKind === 'clinical-system'
      && snapshot.latest.provenance.sourceId === 'panaceamed:ai-emr'
      && snapshot.latest.semanticState === 'clinician-entered'
    if (!trusted) return { ruleId: rule.id, label: rule.label, metric: rule.metric, state: 'source-unverified', rationale: rule.rationale }
  }
  if (snapshot.latest.unit !== rule.unit) {
    return {
      ruleId: rule.id,
      label: rule.label,
      metric: rule.metric,
      state: 'unit-mismatch',
      rationale: rule.rationale,
      unit: snapshot.latest.unit,
    }
  }
  if (typeof snapshot.latest.value !== 'number' || !Number.isFinite(snapshot.latest.value)) {
    return { ruleId: rule.id, label: rule.label, metric: rule.metric, state: 'not-triggered', rationale: rule.rationale }
  }

  // Umur NILAI dihitung dari saat diukur (capturedAt), bukan saat diterima sistem:
  // hasil lab lama yang baru dibagikan/diimpor bukan data segar.
  const ageMinutes = Math.max(0, Date.parse(now) - Date.parse(snapshot.latest.provenance.capturedAt)) / 60_000
  if (ageMinutes > rule.maxAgeMinutes) {
    return {
      ruleId: rule.id,
      label: rule.label,
      metric: rule.metric,
      state: 'stale',
      rationale: rule.rationale,
      observed: snapshot.latest.value,
      unit: snapshot.latest.unit,
      ageMinutes,
    }
  }

  const triggered = validateComparator(snapshot.latest.value, rule.operator, rule.threshold)
  return {
    ruleId: rule.id,
    label: rule.label,
    metric: rule.metric,
    state: triggered ? 'triggered' : 'not-triggered',
    priority: triggered ? rule.priority : undefined,
    rationale: rule.rationale,
    observed: snapshot.latest.value,
    unit: snapshot.latest.unit,
    ageMinutes,
  }
}

export function buildClinicianContinuousCareDigest(
  plan: ContinuousCarePlan,
  latestDailyReport: DailyAnamnesisReport | null,
  state: LongitudinalPatientState,
  generatedAt: string,
): ClinicianContinuousCareDigest {
  validateContinuousCarePlan(plan)
  parseIso(generatedAt, 'generatedAt')
  if (state.subjectId !== plan.subjectId) throw new Error('longitudinal state subject does not match plan')
  if (latestDailyReport && latestDailyReport.subjectId !== plan.subjectId) {
    throw new Error('daily report subject does not match plan')
  }

  const monitoredSignals = plan.monitoredMetrics.map<MonitoredSignalDigest>((metric) => {
    const snapshot = metricSnapshot(state, metric)
    if (!snapshot) return { metric, available: false }
    if (!isConsentActive(snapshot.latest.consent, 'clinical-support', Date.parse(generatedAt))) {
      return { metric, available: false }
    }
    return {
      metric,
      available: true,
      value: snapshot.latest.value,
      unit: snapshot.latest.unit,
      recordedAt: snapshot.latest.recordedAt,
      receivedAt: snapshot.latest.provenance.receivedAt,
      provenanceSourceKind: snapshot.latest.provenance.sourceKind,
      provenanceSourceId: snapshot.latest.provenance.sourceId,
      reviewState: snapshot.latest.review.state,
      trend: numericMetricTrend(state, metric) ?? undefined,
    }
  })

  const measurementRules = plan.measurementReviewRules.map((rule) => evaluateMeasurementRule(state, rule, generatedAt))
  const measurementPriority = measurementRules.reduce<CareWorkflowPriority>(
    (priority, evaluation) => evaluation.state === 'triggered' && evaluation.priority
      ? maxPriority(priority, evaluation.priority)
      : priority,
    'routine',
  )
  const reportPriority = latestDailyReport?.workflowPriority ?? 'routine'
  const workflowPriority = maxPriority(reportPriority, measurementPriority)
  const hasTriggeredReview = measurementRules.some((rule) => rule.state === 'triggered')
    || Boolean(latestDailyReport?.triggeredRuleIds.length)

  return {
    planId: plan.id,
    planVersion: plan.version,
    subjectId: plan.subjectId,
    clinicianId: plan.clinicianId,
    generatedAt,
    diagnosisRefs: plan.diagnosisRefs.map((condition) => ({ ...condition })),
    latestDailyReport,
    monitoredSignals,
    measurementRules,
    workflowPriority,
    requiresHumanReview: true,
    tasks: [
      'verify-patient-reported-history',
      ...(hasTriggeredReview ? ['review-triggered-rules' as const] : []),
      'perform-physical-examination',
      'form-clinical-assessment',
      'review-and-sign-orders-or-medications',
    ],
    governance: {
      patientReportIsSignedDiagnosis: false,
      deviceSignalIsSignedRecord: false,
      autonomousDiagnosisAllowed: false,
      autonomousTreatmentAllowed: false,
      autonomousEmergencyDispositionAllowed: false,
    },
  }
}

function fhirReference(reference: string, type: 'Patient' | 'Encounter' | 'Questionnaire'): string {
  const normalized = requiredText(reference, `${type} reference`)
  if (!normalized.startsWith(`${type}/`) && !normalized.startsWith('urn:uuid:')) {
    throw new Error(`${type} reference must be ${type}/<id> or urn:uuid:<id>`)
  }
  return normalized
}

export function buildDailyAnamnesisQuestionnaireResponse(
  plan: ContinuousCarePlan,
  report: DailyAnamnesisReport,
  refs: DailyQuestionnaireFhirReferences,
): DailyQuestionnaireResponse {
  validateContinuousCarePlan(plan)
  if (report.planId !== plan.id || report.planVersion !== plan.version) throw new Error('report does not match plan')
  const patientReference = fhirReference(refs.patientReference, 'Patient')
  const questionnaireReference = refs.questionnaireReference
    ? fhirReference(refs.questionnaireReference, 'Questionnaire')
    : `Questionnaire/${plan.questionnaireId}`
  const encounterReference = refs.encounterReference
    ? fhirReference(refs.encounterReference, 'Encounter')
    : undefined

  const answerById = new Map(report.answers.map((answer) => [answer.questionId, answer.value] as const))
  const item = plan.questions
    .filter((question) => answerById.has(question.id))
    .map((question) => {
      const value = answerById.get(question.id)!
      const answer = typeof value === 'boolean'
        ? [{ valueBoolean: value }]
        : typeof value === 'number'
          ? [{ valueDecimal: value }]
          : [{ valueString: value }]
      return {
        linkId: question.id,
        text: question.prompt,
        answer,
      }
    })

  return {
    resourceType: 'QuestionnaireResponse',
    id: report.id.replace(/[^A-Za-z0-9\-.]/g, '-').slice(0, 64),
    identifier: [{
      system: 'https://panaceamed.id/fhir/identifier/daily-anamnesis',
      value: report.id,
    }],
    questionnaire: questionnaireReference,
    status: report.completion === 'complete' ? 'completed' : 'in-progress',
    subject: { reference: patientReference },
    ...(encounterReference ? { encounter: { reference: encounterReference } } : {}),
    authored: new Date(parseIso(report.authoredAt, 'report.authoredAt')).toISOString(),
    source: { reference: patientReference },
    item,
  }
}

export function reconcileOfflineDailyReports(
  plan: ContinuousCarePlan,
  queued: readonly QueuedDailyReport[],
  serverSeenReportIds: readonly string[] = [],
): OfflineReconcileResult {
  validateContinuousCarePlan(plan)
  const seen = new Set(serverSeenReportIds)
  const accepted: DailyAnamnesisReport[] = []
  const rejected: OfflineReconcileResult['rejected'] = []

  const sorted = [...queued].sort((left, right) => {
    const leftAt = parseIso(left.queuedAt, 'queuedAt')
    const rightAt = parseIso(right.queuedAt, 'queuedAt')
    return leftAt - rightAt || left.clientSequence - right.clientSequence
  })

  for (const envelope of sorted) {
    const report = envelope.report
    if (!Number.isSafeInteger(envelope.clientSequence) || envelope.clientSequence < 0) {
      rejected.push({ reportId: report.id, reason: 'invalid-sequence' })
      continue
    }
    if (seen.has(report.id)) {
      rejected.push({ reportId: report.id, reason: 'duplicate' })
      continue
    }
    if (report.subjectId !== plan.subjectId) {
      rejected.push({ reportId: report.id, reason: 'subject-mismatch' })
      continue
    }
    if (report.planId !== plan.id) {
      rejected.push({ reportId: report.id, reason: 'plan-mismatch' })
      continue
    }
    if (report.planVersion !== plan.version) {
      rejected.push({ reportId: report.id, reason: 'plan-version-mismatch' })
      continue
    }
    seen.add(report.id)
    accepted.push(report)
  }
  return { accepted, rejected }
}

export const CONTINUOUS_CARE_OS_BOUNDARY =
  'Continuous Care OS may collect longitudinal patient-reported history, normalize authorized device/wearable signals, evaluate only explicitly clinician-governed review rules, and prepare a clinician digest. It never converts a questionnaire answer or raw device stream into a signed diagnosis, treatment, prescription, order, or emergency disposition without human clinical review.'
