import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import '../uji/typescript-resolver.mjs'
const { bindPersonalHealthAccount } = await import('../../src/shared/kernel/personalHealthStorageScope.ts')
const { getVitals } = await import('../../src/lib/healthVitals.ts')
const { getHealthCache } = await import('../../src/lib/profile.ts')
const { getWorkouts } = await import('../../src/lib/workoutStore.ts')

// Only the external HTTP boundary is replaced; parsing, storage and sync run unchanged.
registerHooks({ resolve(specifier, context, next) {
  if (context.parentURL?.includes('/src/lib/autoIsi.ts') && specifier === './api') {
    return { url: 'data:text/javascript,export const backendEnabled=true; export const api=globalThis.deviceSyncTestApi;', shortCircuit: true }
  }
  return next(specifier, context)
} })
const memory = new Map()
globalThis.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k,v) => memory.set(k,String(v)), removeItem: k => memory.delete(k) }
globalThis.BroadcastChannel = undefined
const now = Date.parse('2026-10-05T18:00:00Z')
const originalNow = Date.now
Date.now = () => now
const originalTimeout = globalThis.setTimeout
globalThis.setTimeout = (fn, ms, ...args) => { const timer = originalTimeout(fn, ms, ...args); if (ms >= 10000) timer.unref(); return timer }
test.after(() => { Date.now = originalNow; globalThis.setTimeout = originalTimeout })
const deferred = () => { let resolve, reject; const promise = new Promise((r,j) => { resolve=r;reject=j }); return { promise, resolve, reject } }
let revision=0
let profile, workouts, notifications
let calls
globalThis.deviceSyncTestApi = {
  getHealthProfile: () => { calls.profile++; return profile() },
  deviceWorkouts: () => { calls.workouts++; return workouts() },
  deviceHrNotifications: () => { calls.notifications++; return notifications() },
}
const login = (id, subject=id, loginAt=now) => {
  memory.set('panaceamed.session.v1', JSON.stringify({ account:{id,patientId:subject,email:`${id}@example.test`},loginAt }))
  memory.set('pmd-token', `token-${id}`)
  bindPersonalHealthAccount({id,patientId:subject})
}
const fresh = async () => {
  memory.clear(); bindPersonalHealthAccount(undefined)
  calls={profile:0,workouts:0,notifications:0}
  profile=async()=>({restingHr:61,weightKg:71,updatedAt:'2026-10-05T17:00:00Z'})
  workouts=async()=>({count:0,workouts:[]})
  notifications=async()=>({count:0,notifications:[]})
  return import(`../../src/lib/autoIsi.ts?test=${++revision}`)
}
test.afterEach(async()=>{
  // Drain the existing deferred vitals-history adapter before the next fixture.
  await import('../../src/lib/riwayatVitals.ts')
  await new Promise(resolve=>setImmediate(resolve))
  bindPersonalHealthAccount(undefined)
})

test('current session sync publishes finite health data and closes only its own initial gate', async()=>{
  const sync=await fresh();login('A')
  assert.equal(await sync.autoIsiDariPerangkat(),2)
  assert.equal(getVitals().restingHr,61);assert.equal(getHealthCache().weightKg,71)
  assert.equal(sync.getAutoSyncStatus().state,'ok')
  assert.equal(await sync.autoIsiDariPerangkat(),0)
  login('B');profile=async()=>({restingHr:81})
  assert.equal(await sync.autoIsiDariPerangkat(),1,'B must not inherit A success/throttle')
  assert.equal(getVitals().restingHr,81)
})
test('late A profile cannot write into B or start B secondary requests', async()=>{
  const sync=await fresh();login('A');const late=deferred();profile=()=>late.promise
  const running=sync.autoIsiDariPerangkat();login('B');const before=new Map(memory)
  late.resolve({restingHr:173,weightKg:99})
  assert.equal(await running,0);assert.deepEqual(memory,before)
  assert.deepEqual(getVitals(),{});assert.equal(calls.workouts,0)
})
test('late workout and notification responses cannot publish after logout', async()=>{
  const sync=await fresh();login('A');const w=deferred(),n=deferred(),started=deferred()
  profile=async()=>({}) // isolate secondary responses from the vitals history microtask
  workouts=()=>{started.resolve();return w.promise};notifications=()=>n.promise
  const running=sync.autoIsiDariPerangkat();await started.promise
  memory.delete('panaceamed.session.v1');memory.delete('pmd-token');bindPersonalHealthAccount(null)
  const before=new Map(memory)
  w.resolve({count:1,workouts:[{name:'Running',start:'2026-10-05T16:00:00Z',end:'2026-10-05T16:10:00Z'}]})
  n.resolve({count:1,notifications:[{start:'2026-10-05T16:00:00Z',type:'high'}]})
  assert.equal(await running,0);assert.deepEqual(memory,before);assert.deepEqual(getWorkouts(),[])
})
test('current workout-only account imports its actual parsed workout', async()=>{
  const sync=await fresh();login('A');profile=async()=>({})
  workouts=async()=>({count:1,workouts:[{name:'Running',start:'2026-10-05T16:00:00Z',end:'2026-10-05T16:10:00Z'}]})
  assert.equal(await sync.autoIsiDariPerangkat(),0)
  assert.equal(getWorkouts().length,1);assert.equal(getWorkouts()[0].durasi,600)
  assert.equal(sync.getAutoSyncStatus().workoutsPulled,1)
  assert.equal(await sync.autoIsiDariPerangkat(),0);assert.equal(calls.workouts,1)
})
test('an older completion cannot clear a newer account sync in flight', async()=>{
  const sync=await fresh();login('A');const a=deferred(),b=deferred();profile=()=>a.promise
  const old=sync.autoIsiDariPerangkat();login('B');profile=()=>b.promise
  const current=sync.autoIsiDariPerangkat();a.resolve({restingHr:173});assert.equal(await old,0)
  const concurrent=sync.autoIsiDariPerangkat(true)
  assert.equal(calls.profile,2,'one HTTP request per current-session run')
  b.resolve({restingHr:81});assert.equal(await current,1);assert.equal(await concurrent,1)
  assert.equal(getVitals().restingHr,81)
})
test('invalid, missing and mounted-mismatched identities do not start remote sync', async()=>{
  for(const raw of [null,'{',JSON.stringify({account:{id:'A'},loginAt:now}),JSON.stringify({account:{id:'A',patientId:'A'},loginAt:now+1}),JSON.stringify({account:{id:'A',patientId:'A'},loginAt:now-7*86400000-1})]){
    const sync=await fresh();if(raw!==null)memory.set('panaceamed.session.v1',raw)
    const before=new Map(memory);assert.equal(await sync.autoIsiDariPerangkat(),0)
    assert.deepEqual(memory,before);assert.equal(calls.profile,0)
  }
  const sync=await fresh();login('B');bindPersonalHealthAccount({id:'A',patientId:'A'})
  const before=new Map(memory);assert.equal(await sync.autoIsiDariPerangkat(),0);assert.deepEqual(memory,before)
})
test('token replacement invalidates an awaited response even for the same account',async()=>{
  const sync=await fresh();login('A');const late=deferred();profile=()=>late.promise
  const running=sync.autoIsiDariPerangkat();memory.set('pmd-token','replacement')
  const before=new Map(memory);late.resolve({restingHr:173})
  assert.equal(await running,0);assert.deepEqual(memory,before)
})
test('a retry stops before requesting data under a replacement session',async()=>{
  const sync=await fresh();login('A');const late=deferred();profile=()=>late.promise
  const running=sync.autoIsiDariPerangkat();login('B');late.reject(new Error('offline'))
  const before=new Map(memory);assert.equal(await running,0);assert.deepEqual(memory,before);assert.equal(calls.profile,1)
})
test('subject change, session renewal and expiry each invalidate the original response',async()=>{
  for(const replace of [()=>login('A','other-subject'),()=>login('A','A',now-1),()=>login('A','A',now-7*86400000-1)]){
    const sync=await fresh();login('A');const late=deferred();profile=()=>late.promise
    const running=sync.autoIsiDariPerangkat();replace();const before=new Map(memory)
    late.resolve({restingHr:173,weightKg:99});assert.equal(await running,0);assert.deepEqual(memory,before)
  }
})
test('unavailable session storage fails closed without HTTP or status writes',async(t)=>{
  const sync=await fresh();login('A');const before=new Map(memory)
  t.mock.method(localStorage,'getItem',()=>{throw new Error('storage unavailable')})
  assert.equal(await sync.autoIsiDariPerangkat(),0);assert.equal(calls.profile,0);assert.deepEqual(memory,before)
})
