import test from 'node:test'
import assert from 'node:assert/strict'
import '../uji/typescript-resolver.mjs'
const { createVisitOperatingSession, startVisit, registerMedicalDevice, setMedicalDeviceConnection, ingestVisitDeviceObservation, buildAiEmrVisitContext, promoteObservationToClinicalRecord } = await import('../../src/lib/visitOperatingSystem.ts')
const at='2026-10-04T09:00:00.000Z'
const later='2026-10-04T09:00:10.000Z'
function fixture() {
 let state=createVisitOperatingSession({visitId:'v',subjectId:'p',clinicianId:'c',createdAt:at,consent:{clinicalData:{granted:true,purposes:['clinical-support','ai-context'],grantedAt:at},media:{camera:true,microphone:true,ambientAi:false,acknowledgedAt:at}}})
 state=startVisit(state,at)
 state=registerMedicalDevice(state,{id:'d',label:'QA device',deviceClass:'vital-signs-monitor',evidenceClass:'consumer',transport:'bluetooth-le',supports:['heart-rate']},at)
 state=setMedicalDeviceConnection(state,'d','live',at)
 return ingestVisitDeviceObservation(state,{id:'s',visitId:'v',subjectId:'p',deviceId:'d',metric:'heart-rate',value:73,unit:'bpm',capturedAt:later,receivedAt:later,signalQuality:0.9}).state
}
test('earlier context cannot expose an observation not yet received',()=>{
 const state=fixture(), before=structuredClone(state)
 assert.deepEqual(buildAiEmrVisitContext(state,at).observations,[])
 assert.equal(buildAiEmrVisitContext(state,later).observations[0].value,73)
 assert.deepEqual(state,before)
})
test('retained observations cannot cross patient or visit identity in context or signed promotion',()=>{
 for(const patch of [{subjectId:'other'},{visitId:'other'}]){
  const state=fixture();Object.assign(state.latestByMetric['heart-rate'],patch)
  const before=structuredClone(state)
  assert.deepEqual(buildAiEmrVisitContext(state,later).observations,[])
  assert.throws(()=>promoteObservationToClinicalRecord(state,'heart-rate','c',later),/identity/)
  assert.deepEqual(state,before)
 }
 const state=fixture()
 assert.equal(promoteObservationToClinicalRecord(state,'heart-rate','c',later).subjectId,'p')
})

test('invalid retained observation time is omitted without mutating history',()=>{
 for(const patch of [{capturedAt:'invalid'},{capturedAt:'2026-09-31T12:00:00.000Z'},{capturedAt:'1'},{receivedAt:'invalid'},{capturedAt:1},{receivedAt:null},{capturedAt:'2026-10-04T09:00:11.000Z'}]){
  const state=fixture();Object.assign(state.latestByMetric['heart-rate'],patch)
  const before=structuredClone(state)
  assert.deepEqual(buildAiEmrVisitContext(state,later).observations,[])
  assert.deepEqual(state,before)
 }
})
test('clinical promotion rejects invalid or reversed retained capture times',()=>{
 for(const patch of [{capturedAt:'invalid'},{capturedAt:'2026-09-31T12:00:00.000Z'},{capturedAt:'1'},{capturedAt:1},{receivedAt:null},{capturedAt:'2026-10-04T09:00:11.000Z'}]){
  const state=fixture();Object.assign(state.latestByMetric['heart-rate'],patch)
  const before=structuredClone(state)
  assert.throws(()=>promoteObservationToClinicalRecord(state,'heart-rate','c',later),/time|capture|receipt/i)
  assert.deepEqual(state,before)
 }
})
test('replay evaluation rejects coercible or nonexistent timestamp clocks',()=>{
 for(const at of ['1','2026-09-31T12:00:00.000Z','2026-10-04T24:00:00Z',1,null]){
  const state=fixture(),before=structuredClone(state)
  assert.throws(()=>buildAiEmrVisitContext(state,at),/timestamp/)
  assert.deepEqual(state,before)
 }
})
