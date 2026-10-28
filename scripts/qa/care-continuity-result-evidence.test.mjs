import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { loadTypeScriptSubject } from './load-typescript-subject.mjs'
const root = fileURLToPath(new URL('../../src/domains/clinical-operations/model/', import.meta.url))
const { deriveCareContinuityState } = await loadTypeScriptSubject(root + 'careContinuityProjection.ts')
const { evaluateResultClosure } = await loadTypeScriptSubject(root + 'resultClosure.ts')
const now = '2026-10-28T12:00:00.000Z'
const at = '2026-10-28T09:00:00.000Z'
const patientId = 'synthetic-patient'
const fixture = {
  patientId, evaluatedAt: now,
  supportiveResults: [{ id:'synthetic-result', takenAt:'2026-10-28T08:00:00.000Z', category:'Lab', name:'Synthetic fixture', value:'fixture', flag:'critical' }],
  record: {
    id:'synthetic-encounter', patientId, createdAt:'2026-10-28T08:00:00.000Z', updatedAt:at,
    signedById:'synthetic-actor', signedAt:at,
    physicalExam:{ general:'', vitalsNote:'', perSystem:'', doctorVerified:true, verifiedById:'synthetic-actor' },
    anamnesis:{ keluhanUtama:'Synthetic history', rps:'', rpd:'', rpk:'', riwayatKehamilan:'', riwayatPengobatan:'', riwayatAlergi:'', riwayatTumbuhKembang:'', riwayatNutrisi:'', riwayatImunisasi:'', riwayatSosialEkonomi:'' },
    plan:[{ id:'synthetic-plan', category:'Follow-up', text:'Synthetic draft', source:'AI', status:'usulan' }], problems:[], references:[],
  },
}
const expected = ['explanation','follow-up','review']
for (const signed of [true, false]) {
  test(`${signed ? 'signed' : 'unsigned'} generic record cannot establish per-result clinical completion`, () => {
    const record = signed ? fixture.record : { ...fixture.record, signedAt:undefined, signedById:undefined }
    const result = deriveCareContinuityState({ ...fixture, record }).closure
    assert.equal(result.closedCount,0)
    assert.notEqual(result.items[0].state,'closed')
    assert.deepEqual([...result.items[0].unmetSteps].sort(), expected)
  })
}
test('foreign encounter cannot establish result closure', () => {
  const result = deriveCareContinuityState({ ...fixture, record:{...fixture.record, patientId:'synthetic-other'} }).closure
  assert.equal(result.closedCount,0)
  assert.deepEqual([...result.items[0].unmetSteps].sort(), expected)
})
test('general interpretation and verified plan do not prove actions for a specific result', () => {
  const record = {
    ...fixture.record,
    labEkgInterpretation: 'Synthetic interpretation only',
    plan: [{ ...fixture.record.plan[0], source:'Dokter', status:'diverifikasi', verifiedById:'synthetic-clinician', verifiedAt:at }],
  }
  const result = deriveCareContinuityState({ ...fixture, record }).closure
  assert.equal(result.closedCount,0)
  assert.notEqual(result.items[0].state,'closed')
  assert.deepEqual([...result.items[0].unmetSteps].sort(), expected)
})
const person = {at, actorId:'synthetic-clinician', recordedBy:'person'}
const record = {resultId:'synthetic-result', patientId, resultedAt:'2026-10-28T08:00:00.000Z', dueBy:'2026-10-28T10:00:00.000Z', required:{review:true, explanation:true, 'follow-up':true}, review:{...person, authorizedClinician:true}, explanation:person, followUp:{evidence:person}}
const evaluate = r => evaluateResultClosure({targetPatientId:patientId, evaluatedAt:now, windowStart:'2026-10-28T00:00:00.000Z', windowEnd:now, validNotApplicableReasons:[], results:[r]})
test('explicit per-result human evidence closes through existing engine', () => {
  assert.equal(evaluate(record).items[0].state,'closed')
})
test('system-generated explanation cannot close through existing engine', () => {
  const result=evaluate({...record, explanation:{...person,recordedBy:'system'}})
  assert.notEqual(result.items[0].state,'closed')
  assert.ok(result.items[0].unmetSteps.includes('explanation'))
})
test('foreign patient cannot close through existing engine', () => {
  assert.equal(evaluate({...record, patientId:'synthetic-other'}).items[0].state,'invalid')
})

test('routine result remains unclosed without review or explanation, without requiring follow-up', () => {
  const result = deriveCareContinuityState({
    ...fixture, supportiveResults: [{ ...fixture.supportiveResults[0], flag:'normal' }],
  }).closure
  assert.equal(result.closedCount,0)
  assert.notEqual(result.items[0].state,'closed')
  assert.deepEqual([...result.items[0].unmetSteps].sort(), ['explanation','review'])
})

test('absence of results remains unmeasured', () => {
  assert.equal(deriveCareContinuityState({ ...fixture, supportiveResults:[] }).closure,null)
})
