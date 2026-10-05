import test from 'node:test'
import assert from 'node:assert/strict'
import '../uji/typescript-resolver.mjs'
const { ambilLab, tambahLab, labDiperbaruiPada, gantiDariServer } = await import('../../src/lib/lab.ts')
const { getVitals, mergeVitals, clearVitals } = await import('../../src/lib/healthVitals.ts')
const { createLabSyncRunner, labSessionScope } = await import('../../src/lib/labSyncRunner.ts')
const { bindPersonalHealthAccount } = await import('../../src/shared/kernel/personalHealthStorageScope.ts')
globalThis.BroadcastChannel = undefined

const now = Date.parse('2026-10-05T10:00:00.000Z')
const at = new Date(now).toISOString()
const originalNow = Date.now
Date.now = () => now
test.after(() => { Date.now = originalNow })
const memory = new Map()
globalThis.localStorage = { getItem:k=>memory.get(k)??null, setItem:(k,v)=>memory.set(k,String(v)), removeItem:k=>memory.delete(k) }
const session = (id, patientId=id) => memory.set('panaceamed.session.v1', JSON.stringify({account:{id,patientId,email:`${id}@localhost.test`},loginAt:now}))
const log = value => ({gdp:[{id:'lab',tanggal:'2026-10-04',nilai:value}]})
test.beforeEach(() => { memory.clear(); bindPersonalHealthAccount(undefined) })
test.afterEach(() => bindPersonalHealthAccount(undefined))

test('legacy labs are not relabelled or uploaded after a different account restores', async () => {
 memory.set('pmd_lab_v1',JSON.stringify(log(110)))
 memory.set('pmd_lab_diperbarui_v1',at)
 session('B')
 assert.deepEqual(ambilLab(),{})
 assert.equal(labDiperbaruiPada(),null)
 let uploads=0
 const sync=createLabSyncRunner({enabled:true,session:()=>labSessionScope(k=>localStorage.getItem(k),now),getServer:async()=>({log:{},diperbaruiPada:null}),putServer:async()=>{uploads++},getLocal:ambilLab,getLocalTimestamp:labDiperbaruiPada,applyServer:gantiDariServer,getStatus:()=> 'lokal',setStatus:()=>{},now:()=>at})
 await sync()
 assert.equal(uploads,0)
 assert.equal(memory.get('pmd_lab_v1'),JSON.stringify(log(110)))
})

test('independent owned lab caches and timestamps survive switching and reload reads',()=>{
 session('A'); gantiDariServer(log(110),at)
 assert.equal(ambilLab().gdp[0].nilai,110)
 assert.equal(labDiperbaruiPada(),at)
 session('B'); assert.deepEqual(ambilLab(),{}); assert.equal(labDiperbaruiPada(),null)
 gantiDariServer(log(80),'2026-10-05T09:00:00.000Z')
 assert.equal(ambilLab().gdp[0].nilai,80)
 session('A'); assert.equal(ambilLab().gdp[0].nilai,110); assert.equal(labDiperbaruiPada(),at)
})

test('foreign vitals never escape the parsed cache and a B write preserves A',()=>{
 const raw=JSON.stringify({subjectId:'A',ownerAccountId:'A',heartRate:76,source:'QA wearable',measuredAt:at,syncedAt:at})
 memory.set('pmd_vitals_v1',raw)
 session('A'); assert.equal(getVitals().heartRate,76)
 session('B'); assert.deepEqual(getVitals(),{})
 mergeVitals({heartRate:80,source:'QA wearable',measuredAt:at})
 assert.equal(getVitals().heartRate,80)
 session('A'); assert.equal(getVitals().heartRate,76)
 assert.equal(memory.get('pmd_vitals_v1'),raw)
})

test('ambiguous or invalid remembered sessions cannot read or write clinical caches',()=>{
 for(const account of [{id:'A'},{patientId:'A'}, {id:'',patientId:'A'}]) {
  memory.clear(); memory.set('panaceamed.session.v1',JSON.stringify({account,loginAt:now}))
  memory.set('pmd_lab_v1',JSON.stringify(log(110))); memory.set('pmd_vitals_v1',JSON.stringify({heartRate:76}))
  const before=new Map(memory)
  assert.deepEqual(ambilLab(),{});assert.deepEqual(getVitals(),{})
  tambahLab('gdp','2026-10-04',120);mergeVitals({heartRate:80})
  assert.deepEqual(memory,before)
 }
 for(const loginAt of [now+1,now-7*86400000-1,null]) {
  memory.clear();session('A');const s=JSON.parse(memory.get('panaceamed.session.v1'));s.loginAt=loginAt;memory.set('panaceamed.session.v1',JSON.stringify(s))
  memory.set('pmd_lab_v1',JSON.stringify(log(110))); memory.set('pmd_vitals_v1',JSON.stringify({subjectId:'A',ownerAccountId:'A',heartRate:76}))
  assert.deepEqual(ambilLab(),{});assert.deepEqual(getVitals(),{})
 }
})

test('anonymous demo data remains local and is not adopted at first sign-in',()=>{
 tambahLab('gdp','2026-10-04',110);mergeVitals({heartRate:76,source:'Manual',measuredAt:at})
 assert.equal(ambilLab().gdp[0].nilai,110);assert.equal(getVitals().heartRate,76)
 session('A');assert.deepEqual(ambilLab(),{});assert.deepEqual(getVitals(),{})
})

test('anonymous updates and clears preserve explicitly owned legacy vitals',()=>{
 const raw=JSON.stringify({subjectId:'A',ownerAccountId:'A',heartRate:76})
 memory.set('pmd_vitals_v1',raw)
 assert.deepEqual(getVitals(),{})
 mergeVitals({heartRate:80})
 assert.equal(getVitals().heartRate,80)
 assert.equal(memory.get('pmd_vitals_v1'),raw)
 clearVitals();assert.deepEqual(getVitals(),{});assert.equal(memory.get('pmd_vitals_v1'),raw)
 session('A');assert.equal(getVitals().heartRate,76)
 clearVitals();assert.deepEqual(getVitals(),{});assert.equal(memory.has('pmd_vitals_v1'),false)
})

test('anonymous lab writes preserve the original unowned legacy payload and timestamp',()=>{
 const raw=JSON.stringify(log(110));memory.set('pmd_lab_v1',raw);memory.set('pmd_lab_diperbarui_v1',at)
 tambahLab('gdp','2026-10-04',120)
 assert.equal(ambilLab().gdp.at(-1).nilai,120)
 assert.equal(memory.get('pmd_lab_v1'),raw);assert.equal(memory.get('pmd_lab_diperbarui_v1'),at)
 session('A');assert.deepEqual(ambilLab(),{})
})

test('stale React account A cannot read the B session cache on cross-tab updates',()=>{
 session('B');gantiDariServer(log(81),at);mergeVitals({heartRate:88,source:'QA wearable',measuredAt:at})
 const a={id:'A',patientId:'A'},b={id:'B',patientId:'B'}
 assert.deepEqual(ambilLab(a),{});assert.deepEqual(getVitals(a),{})
 assert.equal(ambilLab(b).gdp[0].nilai,81);assert.equal(getVitals(b).heartRate,88)
 assert.deepEqual(ambilLab(null),{});assert.deepEqual(getVitals(null),{})
})

test('mounted stale account cannot write, clear, or adopt another tab session',()=>{
 session('B');gantiDariServer(log(81),at);mergeVitals({heartRate:88})
 const before=Array.from(memory.entries())
 bindPersonalHealthAccount({id:'A',patientId:'A'})
 tambahLab('gdp','2026-10-04',110);gantiDariServer(log(110),at)
 assert.deepEqual(mergeVitals({heartRate:77}),{})
 clearVitals();assert.deepEqual(Array.from(memory.entries()),before)
 assert.deepEqual(ambilLab(),{});assert.deepEqual(getVitals(),{})
 bindPersonalHealthAccount({id:'B',patientId:'B'})
 assert.equal(ambilLab().gdp[0].nilai,81);assert.equal(getVitals().heartRate,88)
 tambahLab('gdp','2026-10-04',82);assert.equal(ambilLab().gdp.at(-1).nilai,82)
 bindPersonalHealthAccount(null);mergeVitals({heartRate:99});assert.equal(getVitals().heartRate,undefined)
 assert.equal(memory.get('pmd_vitals_scope_v1:'+encodeURIComponent(JSON.stringify(['B','B']))).includes('88'),true)
})
