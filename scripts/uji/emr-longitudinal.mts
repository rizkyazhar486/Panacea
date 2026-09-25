// Keadaan semantik eksplisit untuk AI-EMR di status longitudinal kanonik.
// Rekam bertanda tangan server sudah dijaga emr-status-longitudinal; gerbang ini
// menjaga vital (pencatat dicap server), label semantik dan validator kanonik.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emrRecordToLongitudinalEvents, emrVitalsToLongitudinalEvents } from '../../src/lib/emrLongitudinalBridge.ts'
import { createLongitudinalPatientState, ingestLongitudinalEvent, validateLongitudinalEvent, type ConsentEnvelope } from '../../src/lib/panaceaLongitudinalState.ts'
import { timelineHarian } from '../../src/lib/perubahanLongitudinal.ts'

const kini = '2026-09-26T10:00:00.000Z'
const consent: ConsentEnvelope = { granted: true, purposes: ['clinical-support'], grantedAt: '2026-01-01T00:00:00.000Z' }
const vital = (id: string, oleh?: { id: string; klinisi: boolean }, takenAt = '2026-09-25T08:00:00.000Z') => ({ id, takenAt, systolic: 150, diastolic: 95, heartRate: 88, respRate: 16, tempC: 36.8, spo2: 97, ...(oleh ? { dicatatOleh: oleh } : {}) })
const vit = (v: ReturnType<typeof vital>[]) => emrVitalsToLongitudinalEvents(v, 'emr:p1', consent, kini)

assert.ok(vit([vital('v1', { id: 'd1', klinisi: true })]).events.every((e) => e.semanticState === 'clinician-entered'))
assert.ok(vit([vital('v1', { id: 'u1', klinisi: false })]).events.every((e) => e.semanticState === 'patient-reported'), 'vital pasien dilabeli klinisi')
assert.ok(vit([vital('v1')]).events.every((e) => e.semanticState === 'imported'), 'pencatat tak diketahui ditebak')
assert.equal(vit([vital('v1')]).events.length, 6, 'glukosa kosong tidak boleh menjadi nilai')
assert.deepEqual([vit([vital('vf', undefined, '2026-09-27T00:00:00.000Z')]).events.length, vit([vital('vf', undefined, '2026-09-27T00:00:00.000Z')]).skipped], [0, 1], 'vital masa depan diterima')
assert.ok(vit([vital('v1', { id: 'd1', klinisi: true })]).events.every((e) => e.review.state === 'not-required' && e.semanticState !== 'clinician-reviewed'))

// Rekam bertanda tangan server membawa 'clinician-reviewed' + peninjau.
const rekam = { id: 'r1', patientId: 'p1', createdAt: '2026-09-20T00:00:00.000Z', updatedAt: '2026-09-25T09:00:00.000Z', signedAt: '2026-09-25T09:00:00.000Z', signedById: 'd1', problems: [], plan: [], anamnesis: {}, physicalExam: {}, primaryDiagnosis: { code: 'I10', title: 'Essential hypertension', source: 'AI' } } as never
const ttd = emrRecordToLongitudinalEvents(rekam, 'emr:p1', consent, kini).events
assert.ok(ttd.length > 0 && ttd.every((e) => e.semanticState === 'clinician-reviewed' && e.review.reviewerId === 'd1'))

// Validator kanonik menegakkan batas untuk SEMUA jembatan.
const dx = ttd[0]
assert.throws(() => validateLongitudinalEvent({ ...dx, review: { state: 'pending' } }), /accepted review/)
assert.throws(() => validateLongitudinalEvent({ ...dx, semanticState: 'ai-draft' }), /ai-draft/)
assert.throws(() => validateLongitudinalEvent({ ...dx, semanticState: 'made-up' as never }), /semantic state/)

let s = createLongitudinalPatientState('emr:p1', kini)
for (const e of [...vit([vital('v1', { id: 'd1', klinisi: true })]).events, ...ttd]) s = ingestLongitudinalEvent(s, e as never).state
const butir = timelineHarian(s, 30, {}, 'dokter').flatMap((h) => h.butir)
assert.ok(butir.some((b) => b.metric === 'vital.sbp' && b.keadaan === 'clinician-entered'), 'timeline tidak membawa keadaan semantik')
assert.ok(butir.some((b) => b.metric === 'emr.primary-diagnosis' && b.keadaan === 'clinician-reviewed'))

assert.match(readFileSync('server/src/index.ts', 'utf8'), /dicatatOleh: \{ id: pencatat\.id, klinisi: klinisiAtauPemilik\(pencatat, isOwner\(pencatat\)\) \}/, 'server tidak mencap pencatat vital/penunjang')
assert.match(readFileSync('src/lib/useLongitudinalState.ts', 'utf8'), /emrVitalsToLongitudinalEvents\(vitals, subjectId/, 'vital EMR tidak masuk status kanonik')
console.log('emr-longitudinal: vital berkeadaan dari pencatat server, rekam bertanda tangan = clinician-reviewed, validator kanonik menegakkan, timeline membawa keadaan')
