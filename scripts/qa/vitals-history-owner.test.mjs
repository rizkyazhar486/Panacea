import test from 'node:test'
import assert from 'node:assert/strict'
import '../uji/typescript-resolver.mjs'
const { ambilRiwayat, catatRiwayat, deretMetrik } = await import('../../src/lib/riwayatVitals.ts')
const { mergeVitals } = await import('../../src/lib/healthVitals.ts')
const { bindPersonalHealthAccount } = await import('../../src/shared/kernel/personalHealthStorageScope.ts')
const memory = new Map()
globalThis.localStorage = { getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k) }
globalThis.BroadcastChannel = undefined
const now = Date.parse('2026-10-05T18:00:00Z')
const originalNow=Date.now
Date.now=()=>now
test.after(()=>{Date.now=originalNow})
test.beforeEach(()=>{memory.clear();bindPersonalHealthAccount(undefined)})
test.afterEach(async()=>{await new Promise(resolve=>setImmediate(resolve));bindPersonalHealthAccount(undefined)})
const login=(id,subject=id)=>{memory.set('panaceamed.session.v1',JSON.stringify({account:{id,patientId:subject},loginAt:now}));bindPersonalHealthAccount({id,patientId:subject})}
const record=(id,value,subject=id)=>catatRiwayat({ownerAccountId:id,subjectId:subject,restingHr:value})
const key=(id,subject=id)=>'pmd_riwayat_vitals_scope_v1:'+encodeURIComponent(JSON.stringify([id,subject]))

test('account/subject history is isolated and a return to A preserves its own baseline',()=>{
 login('A');record('A',61);assert.equal(deretMetrik('restingHr')[0].nilai,61)
 login('B');assert.deepEqual(ambilRiwayat(),[]);record('B',81);assert.equal(deretMetrik('restingHr')[0].nilai,81)
 login('A');assert.equal(deretMetrik('restingHr')[0].nilai,61)
 login('A','other');assert.deepEqual(ambilRiwayat(),[]);record('A',71,'other')
 login('A');assert.equal(deretMetrik('restingHr')[0].nilai,61)
})
test('late A snapshot cannot write into B after session replacement',()=>{
 login('A');record('A',61);login('B');record('B',81)
 const before=new Map(memory);record('A',173)
 assert.deepEqual(memory,before);assert.equal(deretMetrik('restingHr')[0].nilai,81)
})
test('the real deferred mergeVitals writer rejects the original account after a switch',async()=>{
 login('A');mergeVitals({restingHr:61})
 login('B');const before=new Map(memory)
 await new Promise(resolve=>setImmediate(resolve))
 assert.deepEqual(memory,before);assert.deepEqual(ambilRiwayat(),[])
 mergeVitals({restingHr:81});await new Promise(resolve=>setImmediate(resolve))
 assert.equal(deretMetrik('restingHr')[0].nilai,81)
})
test('legacy unowned history remains anonymous and is never adopted on login',()=>{
 const raw=JSON.stringify([{tanggal:'2026-10-04',nilai:{restingHr:61}}]);memory.set('pmd_riwayat_vitals_v1',raw)
 assert.equal(deretMetrik('restingHr')[0].nilai,61)
 catatRiwayat({restingHr:62});assert.equal(memory.get('pmd_riwayat_vitals_v1'),raw)
 login('B');assert.deepEqual(ambilRiwayat(),[]);record('B',81)
 assert.equal(memory.get('pmd_riwayat_vitals_v1'),raw)
 memory.delete('panaceamed.session.v1');bindPersonalHealthAccount(null)
 assert.equal(deretMetrik('restingHr').at(-1).nilai,62)
})
test('a cached envelope copied into another account namespace cannot leak history',()=>{
 login('A');record('A',61);assert.equal(ambilRiwayat().length,1)
 const a=memory.get(key('A'));login('B');memory.set(key('B'),a)
 assert.deepEqual(ambilRiwayat(),[]);record('B',81);assert.equal(deretMetrik('restingHr')[0].nilai,81)
 login('A');assert.equal(deretMetrik('restingHr')[0].nilai,61)
})
test('unowned and foreign snapshots cannot be relabelled as current-account history',()=>{
 login('A');record('A',61);const before=new Map(memory)
 for(const v of [{restingHr:173},{ownerAccountId:'B',subjectId:'A',restingHr:173},{ownerAccountId:'A',subjectId:'B',restingHr:173}])catatRiwayat(v)
 assert.deepEqual(memory,before)
})
test('anonymous history cannot accept an owned late callback',()=>{
 catatRiwayat({restingHr:61});const before=new Map(memory)
 record('A',173);assert.deepEqual(memory,before);assert.equal(deretMetrik('restingHr')[0].nilai,61)
})
test('mounted stale and malformed/expired sessions cannot read or write history',()=>{
 login('B');record('B',81);bindPersonalHealthAccount({id:'A',patientId:'A'})
 let before=new Map(memory);assert.deepEqual(ambilRiwayat(),[]);record('B',173);assert.deepEqual(memory,before)
 bindPersonalHealthAccount(undefined)
 for(const raw of ['{',JSON.stringify({account:{id:'B'},loginAt:now}),JSON.stringify({account:{id:'B',patientId:'B'},loginAt:now+1}),JSON.stringify({account:{id:'B',patientId:'B'},loginAt:now-7*86400000-1})]){
  memory.set('panaceamed.session.v1',raw);before=new Map(memory)
  assert.deepEqual(ambilRiwayat(),[]);record('B',173);assert.deepEqual(memory,before)
 }
})
test('invalid persisted envelopes fail closed instead of producing a baseline',()=>{
 login('A')
 for(const raw of ['null','[]','{',JSON.stringify({version:1,ownerAccountId:'A',subjectId:'other',history:[]}),JSON.stringify({version:2,ownerAccountId:'A',subjectId:'A',history:[]})]){
  memory.set(key('A'),raw);assert.deepEqual(ambilRiwayat(),[])
 }
 record('A',61);assert.equal(deretMetrik('restingHr')[0].nilai,61)
})
test('current owner keeps one last-finite snapshot per day',()=>{
 login('A');record('A',61);record('A',62)
 assert.equal(ambilRiwayat().length,1);assert.equal(deretMetrik('restingHr')[0].nilai,62)
 const before=new Map(memory);for(const v of [NaN,Infinity,-1,0])record('A',v)
 assert.deepEqual(memory,before)
})
test('quota retry persists an owned envelope while preserving other account and legacy records',t=>{
 login('A');record('A',61);const a=memory.get(key('A'))
 const legacy='[{"tanggal":"2026-10-04","nilai":{"restingHr":51}}]';memory.set('pmd_riwayat_vitals_v1',legacy)
 login('B');let failed=false
 t.mock.method(localStorage,'setItem',(k,v)=>{
  if(k===key('B')&&!failed){failed=true;throw new Error('quota')}
  memory.set(k,String(v))
 })
 record('B',81);assert.equal(deretMetrik('restingHr')[0].nilai,81)
 assert.equal(memory.get(key('A')),a);assert.equal(memory.get('pmd_riwayat_vitals_v1'),legacy)
})
test('unavailable storage returns no history and does not publish a write',t=>{
 login('A');record('A',61);const before=new Map(memory)
 t.mock.method(localStorage,'getItem',()=>{throw new Error('storage unavailable')})
 assert.deepEqual(ambilRiwayat(),[]);record('A',173);assert.deepEqual(memory,before)
})
