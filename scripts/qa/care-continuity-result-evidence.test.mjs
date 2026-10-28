import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { fileURLToPath } from 'node:url'
import { loadTypeScriptSubject } from './load-typescript-subject.mjs'
const root = fileURLToPath(new URL('../../src/domains/clinical-operations/model/', import.meta.url))
const { deriveCareContinuityState } = await loadTypeScriptSubject(root + 'careContinuityProjection.ts')
const { evaluateResultClosure } = await loadTypeScriptSubject(root + 'resultClosure.ts')
const { CareContinuityPanel } = await loadTypeScriptSubject(fileURLToPath(new URL('../../src/domains/clinical-operations/ui/CareContinuityPanel.tsx', import.meta.url)))
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
    assert.equal(result.closedCount,null)
    assert.notEqual(result.items[0].state,'closed')
    assert.deepEqual([...result.items[0].unmetSteps].sort(), expected)
  })
}
test('foreign encounter cannot establish result closure', () => {
  const result = deriveCareContinuityState({ ...fixture, record:{...fixture.record, patientId:'synthetic-other'} }).closure
  assert.equal(result.closedCount,null)
  assert.deepEqual([...result.items[0].unmetSteps].sort(), expected)
})
test('general interpretation and verified plan do not prove actions for a specific result', () => {
  const record = {
    ...fixture.record,
    labEkgInterpretation: 'Synthetic interpretation only',
    plan: [{ ...fixture.record.plan[0], source:'Dokter', status:'diverifikasi', verifiedById:'synthetic-clinician', verifiedAt:at }],
  }
  const result = deriveCareContinuityState({ ...fixture, record }).closure
  assert.equal(result.closedCount,null)
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
  assert.equal(result.closedCount,null)
  assert.notEqual(result.items[0].state,'closed')
  assert.deepEqual([...result.items[0].unmetSteps].sort(), ['explanation','review'])
})

test('absence of results remains unmeasured', () => {
  assert.equal(deriveCareContinuityState({ ...fixture, supportiveResults:[] }).closure,null)
})

test('a recent result without an actual deadline stays open and unmeasured', () => {
  const result = deriveCareContinuityState({
    ...fixture,
    supportiveResults:[{ ...fixture.supportiveResults[0], takenAt:'2026-10-28T11:59:00.000Z' }],
  }).closure
  assert.equal(result.items[0].state,'open-no-deadline')
  assert.equal(result.items[0].closedLate,null)
  assert.deepEqual(result.overdueIds,[])
  assert.equal(result.dueCount,null)
  assert.equal(result.closedCount,null)
  assert.equal(result.closureRate,null)
  assert.match(result.unmeasuredReason,/no protocol deadline/)
})

test('known overdue remains visible when another result has no deadline', () => {
  const known = { ...record, review:undefined }
  const unknown = { ...record, resultId:'synthetic-other-result', dueBy:null, review:undefined }
  const result = evaluateResultClosure({targetPatientId:patientId, evaluatedAt:now, windowStart:'2026-10-28T00:00:00.000Z', windowEnd:now, validNotApplicableReasons:[], results:[known,unknown]})
  assert.equal(result.items[0].state,'overdue')
  assert.equal(result.items[1].state,'open-no-deadline')
  assert.deepEqual(result.overdueIds,['synthetic-result'])
  assert.equal(result.dueCount,null)
  assert.equal(result.closedCount,null)
  assert.equal(result.closureRate,null)
})

test('explicit human evidence can close when timeliness is unknown', () => {
  const result=evaluate({...record, dueBy:null})
  assert.equal(result.items[0].state,'closed')
  assert.equal(result.items[0].closedLate,null)
  assert.equal(result.closedCount,null)
  assert.equal(result.closureRate,null)
})

test('missing deadline stays distinct from an explicitly malformed deadline', () => {
  for (const dueBy of [undefined,null]) {
    const result=evaluate({...record, dueBy, review:undefined})
    assert.equal(result.items[0].state,'open-no-deadline')
    assert.deepEqual(result.invalidIds,[])
  }
  for (const dueBy of ['', 'not-a-date']) {
    const result=evaluate({...record, dueBy})
    assert.equal(result.items[0].state,'invalid')
    assert.ok(result.items[0].invalidReasons.includes('invalid-timestamp'))
  }
})

test('the panel displays unknown aggregate counts and a visible open state', () => {
  const closure=deriveCareContinuityState({ ...fixture }).closure
  const html=renderToStaticMarkup(React.createElement(CareContinuityPanel,{patientName:'Synthetic patient',closure}))
  assert.match(html,/Due in window:<\/span><span[^>]*>—<\/span>/)
  assert.match(html,/Clinician-closed:<\/span><span[^>]*>—<\/span>/)
  assert.match(html,/open-no-deadline/)
  assert.match(html,/no protocol deadline/)
  assert.match(html,/Results pending/)
  assert.doesNotMatch(html,/Results up to date/)
})

test('the panel retains known overdue counts for an explicit protocol deadline', () => {
  const closure=evaluate({...record, review:undefined})
  const html=renderToStaticMarkup(React.createElement(CareContinuityPanel,{patientName:'Synthetic patient',closure}))
  assert.match(html,/Due in window:<\/span><span[^>]*>1<\/span>/)
  assert.match(html,/Clinician-closed:<\/span><span[^>]*>0<\/span>/)
  assert.match(html,/overdue/)
  assert.match(html,/Overdue results/)
  assert.deepEqual(closure.overdueIds,['synthetic-result'])
})

test('the panel distinguishes fully closed results from absent results', () => {
  const closed=renderToStaticMarkup(React.createElement(CareContinuityPanel,{patientName:'Synthetic patient',closure:evaluate(record)}))
  const absent=renderToStaticMarkup(React.createElement(CareContinuityPanel,{patientName:'Synthetic patient',closure:null}))
  assert.match(closed,/Results up to date/)
  assert.doesNotMatch(closed,/Results pending/)
  assert.match(absent,/No results in scope/)
  assert.doesNotMatch(absent,/Results up to date/)
})

test('invalid records never present a measured zero aggregate', () => {
  for (const invalid of [
    { ...record, patientId:'synthetic-foreign', dueBy:null },
    { ...record, dueBy:'not-a-date' },
  ]) {
    const result=evaluate(invalid)
    assert.equal(result.items[0].state,'invalid')
    assert.equal(result.dueCount,null)
    assert.equal(result.closedCount,null)
    assert.equal(result.closureRate,null)
    const html=renderToStaticMarkup(React.createElement(CareContinuityPanel,{patientName:'Synthetic patient',closure:result}))
    assert.match(html,/Due in window:<\/span><span[^>]*>—<\/span>/)
    assert.match(html,/Clinician-closed:<\/span><span[^>]*>—<\/span>/)
    assert.doesNotMatch(html,/Results up to date/)
  }
})

test('invalid mixed records keep genuine overdue IDs without a false aggregate', () => {
  const result=evaluateResultClosure({targetPatientId:patientId, evaluatedAt:now, windowStart:'2026-10-28T00:00:00.000Z', windowEnd:now, validNotApplicableReasons:[], results:[
    {...record,review:undefined},
    {...record,resultId:'synthetic-foreign-result',patientId:'synthetic-foreign'},
  ]})
  assert.deepEqual(result.overdueIds,['synthetic-result'])
  assert.deepEqual(result.invalidIds,['synthetic-foreign-result'])
  assert.equal(result.dueCount,null)
  assert.equal(result.closedCount,null)
  assert.equal(result.closureRate,null)
})

test('invalid evaluation leaves aggregate counts unknown even with no records', () => {
  for (const results of [[],[record]]) {
    const result=evaluateResultClosure({targetPatientId:patientId,evaluatedAt:'not-a-date',windowStart:'2026-10-28T00:00:00.000Z',windowEnd:now,validNotApplicableReasons:[],results})
    assert.equal(result.dueCount,null)
    assert.equal(result.closedCount,null)
    assert.equal(result.closureRate,null)
    assert.match(result.unmeasuredReason,/evaluation inputs are invalid/)
  }
})

test('closed results with no deadline do not imply verified timeliness', () => {
  const closure=evaluate({...record,dueBy:null})
  const html=renderToStaticMarkup(React.createElement(CareContinuityPanel,{patientName:'Synthetic patient',closure}))
  assert.equal(closure.items[0].state,'closed')
  assert.match(html,/Result timing unknown/)
  assert.doesNotMatch(html,/Results up to date/)
})
