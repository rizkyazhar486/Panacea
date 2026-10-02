import assert from 'node:assert/strict'
import { susunRencana, susunLaporan, laporanKeBundelFhir } from '../src/carePlan.js'

const kini = new Date('2026-09-25T08:00:00Z')
const r = susunRencana({
  diagnosisRefs: [{ system: 'icd-10', code: 'I10', display: 'Hypertension', verificationStatus: 'confirmed' }],
  questions: [
    { id: 'pusing', prompt: 'Dizzy today?', kind: 'boolean', required: true },
    { id: 'sbp', prompt: 'Home systolic', kind: 'number', unit: 'mmHg', required: false },
    { id: 'obat', prompt: 'Took medicine?', kind: 'choice', choices: ['yes', 'no'], required: true },
  ],
  patientReportedReviewRules: [{ label: 'Dizzy', questionId: 'pusing', operator: 'equals', value: true, priority: 'review-today', rationale: 'clinician rule' }],
}, 'pasien@x', 'dokter@x', kini)
const l = susunLaporan(r, { scheduledFor: '2026-09-25', answers: [{ questionId: 'pusing', value: true }, { questionId: 'sbp', value: 148 }, { questionId: 'obat', value: 'yes' }] }, kini)
const b = laporanKeBundelFhir(r, [l], 'Patient/p1', kini.toISOString())
const [q, qr, prov] = b.entry.map((e) => e.resource as Record<string, any>)
assert.equal(q.resourceType, 'Questionnaire')
assert.deepEqual(q.item.map((i: any) => i.type), ['boolean', 'decimal', 'choice'])
assert.equal(qr.resourceType, 'QuestionnaireResponse')
assert.equal(qr.status, 'completed')
assert.equal(qr.questionnaire, `${q.url}|${q.version}`, 'QR harus menunjuk Questionnaire yang sama')
assert.equal(qr.subject.reference, 'Patient/p1')
assert.deepEqual(qr.item[1].answer[0], { valueQuantity: { value: 148, unit: 'mmHg' } })
assert.deepEqual(qr.item[0].answer[0], { valueBoolean: true })
assert.ok(qr.item.every((i: any) => q.item.some((x: any) => x.linkId === i.linkId)), 'linkId tak dikenal')
assert.equal(prov.resourceType, 'Provenance')
assert.equal(prov.target.length, 2)
for (const e of b.entry) assert.match(e.fullUrl, /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
// Server tidak menilai: aturan/prioritas tidak boleh bocor ke ekspor.
const teks = JSON.stringify(b)
assert.ok(!/review-today|immediate-human-review|clinician rule/.test(teks), 'prioritas/aturan klinis ikut diekspor — server tampak menilai')
// Laporan rencana lain tidak ikut.
assert.equal(laporanKeBundelFhir(r, [{ ...l, planId: 'lain' }], 'Patient/p1', kini.toISOString()).entry.length, 2)
console.log('carePlanFhir: Questionnaire + QuestionnaireResponse + Provenance, tanpa prioritas klinis')
