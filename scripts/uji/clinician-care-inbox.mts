import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CLINICIAN_INBOX_SAFETY_CONTRACT,
  sortClinicianCareInbox,
  summarizeClinicianCareDigest,
} from '../../src/lib/clinicianCareInbox.ts'
import type { ClinicianContinuousCareDigest } from '../../src/lib/continuousCareOperatingSystem.ts'

const base: ClinicianContinuousCareDigest = {
  planId: 'plan-1',
  planVersion: '1',
  subjectId: 'patient-1',
  clinicianId: 'doctor-1',
  generatedAt: '2026-09-29T12:00:00.000Z',
  diagnosisRefs: [{
    system: 'icd-10',
    code: 'I10',
    display: 'Hypertension',
    verificationStatus: 'confirmed',
  }],
  latestDailyReport: {
    id: 'report-1',
    planId: 'plan-1',
    planVersion: '1',
    questionnaireId: 'q-1',
    subjectId: 'patient-1',
    scheduledFor: '2026-09-29T08:00:00.000Z',
    authoredAt: '2026-09-29T08:05:00.000Z',
    answers: [],
    missingRequiredQuestionIds: ['medication'],
    triggeredRuleIds: ['rule-1'],
    completion: 'incomplete',
    workflowPriority: 'review-today',
  },
  monitoredSignals: [
    { metric: 'vital.sbp', available: true, value: 150, unit: 'mmHg' },
    { metric: 'vital.hr', available: false },
  ],
  measurementRules: [{
    ruleId: 'vital-rule-1',
    label: 'Review measured BP',
    metric: 'vital.sbp',
    state: 'triggered',
    priority: 'review-today',
    rationale: 'clinician-authored demo fixture',
    observed: 150,
    unit: 'mmHg',
    ageMinutes: 5,
  }],
  workflowPriority: 'review-today',
  requiresHumanReview: true,
  tasks: [
    'verify-patient-reported-history',
    'review-triggered-rules',
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

const row=summarizeClinicianCareDigest('share-1','Patient A',base)
assert.equal(row.workflowPriority,'review-today')
assert.equal(row.hasActivePlan,true)
assert.equal(row.missingRequiredCount,1)
assert.equal(row.triggeredRuleCount,1)
assert.equal(row.availableSignalCount,1)
assert.equal(row.measurementAttentionCount,1)
assert.equal(row.requiresHumanReview,true)

const sorted=sortClinicianCareInbox([
  row,
  summarizeClinicianCareDigest('share-2','Patient B',{...base,planId:'plan-2',subjectId:'patient-2',workflowPriority:'routine',latestDailyReport:{...base.latestDailyReport!,id:'report-2',subjectId:'patient-2',missingRequiredQuestionIds:[],triggeredRuleIds:[],completion:'complete',workflowPriority:'routine'}}),
  summarizeClinicianCareDigest('share-3','Patient C',{...base,planId:'plan-3',subjectId:'patient-3',workflowPriority:'immediate-human-review'}),
])
assert.deepEqual(sorted.map((item)=>item.workflowPriority),['immediate-human-review','review-today','routine'])

const noPlan=summarizeClinicianCareDigest('share-4','Patient D',null)
assert.equal(noPlan.hasActivePlan,false)
assert.equal(noPlan.requiresHumanReview,true)

assert.match(CLINICIAN_INBOX_SAFETY_CONTRACT,/not diagnosis/)
assert.match(CLINICIAN_INBOX_SAFETY_CONTRACT,/human-review required/)

const ui=readFileSync('src/components/clinical/LabPasienUntukDokter.tsx','utf8')
assert.match(ui,/buildClinicianContinuousCareDigest/)
assert.match(ui,/data-clinician-care-inbox/)
assert.match(ui,/no bulk diagnosis, prescription or treatment action/)
assert.doesNotMatch(ui,/bulk.*sign/i)
const awal = ui.indexOf('const loadInbox = async')
const akhir = ui.indexOf('void loadInbox()')
assert.ok(awal >= 0 && akhir > awal, 'loader inbox harus ditemukan agar asersi di bawah bermakna')
// Hanya KODE yang dinilai: komentar penjelas boleh menyebut endpoint tanpa memanggilnya.
const tanpaKomentar = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const inboxEffect = tanpaKomentar(ui.slice(awal, akhir))
assert.doesNotMatch(inboxEffect, /clinicianLabFhir/,
  'inbox must not eagerly open audited lab records for every shared patient')
// Kontrol positif: pemanggilan nyata (bukan komentar) tetap tertangkap; komentar saja tidak.
assert.match(tanpaKomentar('await api.clinicianLabFhir(share.id)'), /clinicianLabFhir/)
assert.doesNotMatch(tanpaKomentar('// jangan panggil clinicianLabFhir di sini\n/* clinicianLabFhir */'), /clinicianLabFhir/)
assert.match(ui, /audited clinical-record access/,
  'privacy boundary must stay explicit next to the inbox loader')

console.log('clinician-care-inbox: canonical digest compression + deterministic queue order + mandatory human review.')
