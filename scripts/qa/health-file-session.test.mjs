import test from 'node:test'
import assert from 'node:assert/strict'
import '../uji/typescript-resolver.mjs'
const { capturePersonalHealthOperation, readPersonalHealthFile, readPersonalHealthImage } = await import('../../src/domains/personal-health/index.ts')
const { bindPersonalHealthAccount } = await import('../../src/shared/kernel/personalHealthStorageScope.ts')
const { parseHealthFile } = await import('../../src/lib/healthImport.ts')
const { mergeWorkouts, getWorkouts } = await import('../../src/lib/workoutStore.ts')
const { parseWorkouts } = await import('../../src/lib/workoutImport.ts')
const memory = new Map()
globalThis.localStorage = { getItem:k=>memory.get(k)??null, setItem:(k,v)=>memory.set(k,String(v)), removeItem:k=>memory.delete(k) }
globalThis.BroadcastChannel = undefined
globalThis.FileReader = undefined
const now=Date.parse('2026-10-06T05:00:00Z')
const login=(id='A')=>{memory.set('panaceamed.session.v1',JSON.stringify({account:{id,patientId:id},loginAt:now}));bindPersonalHealthAccount({id,patientId:id})}
test.beforeEach(t=>{t.mock.method(Date,'now',()=>now);memory.clear();login()})
test.afterEach(()=>bindPersonalHealthAccount(undefined))
const fixture=JSON.stringify({data:{metrics:[{name:'resting_heart_rate',units:'bpm',data:[{qty:61,date:'2026-10-05 10:00:00 +0000'}]}],workouts:[{name:'Running',start:'2026-10-05T10:00:00Z',end:'2026-10-05T10:10:00Z',duration:600}]}})
const neverImage=()=>assert.fail('text must not use image reader')
test('delayed A file cannot publish into replacement owner B',async()=>{
  const current=capturePersonalHealthOperation({id:'A',patientId:'A'})
  let finish
  const pending=readPersonalHealthFile({name:'fixture.json',type:'application/json',text:()=>new Promise(r=>finish=r)},current,parseHealthFile,neverImage)
  login('B');const before=new Map(memory);finish(fixture)
  const prepared=await pending
  if(prepared)mergeWorkouts(parseWorkouts(prepared.text))
  assert.equal(prepared,null);assert.deepEqual(memory,before);assert.deepEqual(getWorkouts(),[])
})
test('valid text is read once and supplies metrics and workouts from the same payload',async()=>{
  let reads=0
  const prepared=await readPersonalHealthFile({name:'fixture.json',type:'application/json',text:async()=>{reads++;return fixture}},capturePersonalHealthOperation(),parseHealthFile,neverImage)
  assert.equal(reads,1);assert.equal(prepared.values.restingHr,61);assert.equal(prepared.text,fixture)
  assert.equal(mergeWorkouts(parseWorkouts(prepared.text)),1)
})
test('same-owner token renewal rejects delayed image interpretation',async()=>{
  let finish
  const pending=readPersonalHealthFile({name:'fixture.png',type:'image/png'},capturePersonalHealthOperation(),()=>assert.fail('must not parse text'),()=>new Promise(r=>finish=r))
  memory.set('pmd-token','replacement');finish({restingHr:173});assert.equal(await pending,null)
})
test('unmounted or superseded import cannot start reading',async()=>{
  let active=true
  const current=capturePersonalHealthOperation({id:'A',patientId:'A'},()=>active);active=false
  assert.equal(await readPersonalHealthFile({name:'f.json',type:'',text:()=>assert.fail('must not read')},current,parseHealthFile,neverImage),null)
})
test('old form cannot capture replacement owner as its origin',async()=>{
  login('B');const current=capturePersonalHealthOperation({id:'A',patientId:'A'})
  assert.equal(current(),false)
  assert.equal(await readPersonalHealthFile({name:'f.json',type:'',text:()=>assert.fail('must not read')},current,parseHealthFile,neverImage),null)
})
test('unavailable storage and anonymous-to-account replacement fail closed',async t=>{
  const getter=t.mock.method(localStorage,'getItem',()=>{throw new Error('unavailable')});assert.equal(capturePersonalHealthOperation()(),false)
  getter.mock.restore();memory.clear();bindPersonalHealthAccount(null)
  const current=capturePersonalHealthOperation(null);assert.equal(current(),true);login();assert.equal(current(),false)
})
test('session replacement during FileReader prevents recognition upload',async t=>{
  let reader,uploads=0
  t.mock.property(globalThis,'FileReader',class {constructor(){reader=this}readAsDataURL(){}})
  const pending=readPersonalHealthImage({},capturePersonalHealthOperation(),async()=>{uploads++;return 'fixture'})
  login('B');reader.result='data:fixture';reader.onload()
  assert.equal(await pending,null);assert.equal(uploads,0)
})
test('current recognition succeeds but token replacement during recognition discards result',async t=>{
  t.mock.property(globalThis,'FileReader',class {readAsDataURL(){this.result='data:fixture';this.onload()}})
  assert.equal(await readPersonalHealthImage({},capturePersonalHealthOperation(),async()=>'fixture text'),'fixture text')
  let finish
  const pending=readPersonalHealthImage({},capturePersonalHealthOperation(),()=>new Promise(r=>finish=r))
  await Promise.resolve();memory.set('pmd-token','renewed');finish('late text');assert.equal(await pending,null)
})
