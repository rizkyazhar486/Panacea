import assert from 'node:assert/strict'
import {
  CONVERSATIONAL_CARE_SAFETY_CONTRACT,
  acceptConstrainedConversationalAnswer,
  buildConstrainedConversationalTurn,
  draftSourceLinkedAnamnesis,
} from '../../src/lib/conversationalCareInterview.ts'
import type { ContinuousCarePlan, DailyAnamnesisAnswer } from '../../src/lib/continuousCareOperatingSystem.ts'

const plan: ContinuousCarePlan = {
  id: 'plan-1',
  version: '3',
  subjectId: 'patient-1',
  clinicianId: 'doctor-1',
  questionnaireId: 'daily-followup',
  diagnosisRefs: [{ system: 'icd-10', code: 'Z-demo', display: 'Demo', verificationStatus: 'confirmed' }],
  activeFrom: '2026-09-29T00:00:00.000Z',
  schedule: { cadence: 'daily', graceMinutes: 120 },
  questions: [
    { id: 'worse', metric: 'daily.worse', prompt: 'Are symptoms worse?', kind: 'boolean', domain: 'symptom', required: true },
    { id: 'detail', metric: 'daily.detail', prompt: 'What changed?', kind: 'text', domain: 'symptom', required: true, showWhen: { questionId: 'worse', operator: 'equals', value: true } },
    { id: 'meds', metric: 'daily.meds', prompt: 'Medication taken?', kind: 'choice', domain: 'medication', required: true, choices: ['Yes', 'Missed'] },
  ],
  patientReportedReviewRules: [{ id: 'r1', label: 'Worse', questionId: 'worse', operator: 'equals', value: true, priority: 'review-today', rationale: 'clinician rule' }],
  measurementReviewRules: [],
  monitoredMetrics: [],
}

const scheduled='2026-09-29T08:00:00.000Z'
let answers: DailyAnamnesisAnswer[]=[]

const first=buildConstrainedConversationalTurn(plan,scheduled,answers,{
  planId:plan.id,planVersion:plan.version,questionnaireId:plan.questionnaireId,
  questionId:'worse',displayPrompt:'Compared with yesterday, do your symptoms feel worse?',
})!
assert.equal(first.wordingSource,'ai-draft')
assert.equal(first.sourcePrompt,'Are symptoms worse?')
assert.equal(first.kind,'boolean')
assert.equal(first.required,true)
assert.match(first.sourceRef,/Questionnaire\/daily-followup\|3#worse/)

assert.throws(()=>buildConstrainedConversationalTurn(plan,scheduled,answers,{
  planId:plan.id,planVersion:'2',questionnaireId:plan.questionnaireId,questionId:'worse',displayPrompt:'Worse?',
}),/planVersion/)
assert.throws(()=>buildConstrainedConversationalTurn(plan,scheduled,answers,{
  planId:plan.id,planVersion:plan.version,questionnaireId:plan.questionnaireId,questionId:'detail',displayPrompt:'Tell me more',
}),/hidden, answered, or unknown/)

answers=acceptConstrainedConversationalAnswer(plan,first,true,answers,'2026-09-29T08:01:00.000Z').answers
const detail=buildConstrainedConversationalTurn(plan,scheduled,answers,{
  planId:plan.id,planVersion:plan.version,questionnaireId:plan.questionnaireId,questionId:'detail',displayPrompt:'What feels different today?',
})!
assert.equal(detail.questionId,'detail')
answers=acceptConstrainedConversationalAnswer(plan,detail,'More dizzy',answers,'2026-09-29T08:02:00.000Z').answers

const meds=buildConstrainedConversationalTurn(plan,scheduled,answers)!
assert.equal(meds.questionId,'meds')
assert.deepEqual(meds.choices,['Yes','Missed'])
assert.throws(()=>acceptConstrainedConversationalAnswer(plan,meds,'Sometimes',answers,'2026-09-29T08:03:00.000Z'),/outside allowed choices/)
answers=acceptConstrainedConversationalAnswer(plan,meds,'Yes',answers,'2026-09-29T08:03:00.000Z').answers
assert.equal(buildConstrainedConversationalTurn(plan,scheduled,answers),null)

const draft=draftSourceLinkedAnamnesis(plan,answers)
assert.equal(draft.clinicianReviewRequired,true)
assert.equal(draft.sources.length,3)
assert.match(draft.text,/Patient-reported draft/)
assert.match(draft.text,/clinician verification required/)

assert.match(CONVERSATIONAL_CARE_SAFETY_CONTRACT,/Requiredness, answer type, choices, clinical rules and thresholds remain clinician-owned/)
console.log('conversational-care: AI wording/sequence is bounded by exact Questionnaire version and canonical typed-answer validation.')
