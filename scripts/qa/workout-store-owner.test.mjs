import test from 'node:test'
import assert from 'node:assert/strict'
import '../uji/typescript-resolver.mjs'
const store = await import('../../src/lib/workoutStore.ts')
const { bindPersonalHealthAccount } = await import('../../src/shared/kernel/personalHealthStorageScope.ts')
const memory = new Map()
globalThis.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k,v) => memory.set(k,String(v)), removeItem: k => memory.delete(k) }
globalThis.BroadcastChannel = undefined
const now = Date.parse('2026-10-05T18:00:00Z')
const originalNow = Date.now
Date.now = () => now
test.after(() => { Date.now = originalNow })
test.beforeEach(() => { memory.clear(); bindPersonalHealthAccount(undefined) })
const login = (id, patientId=id) => {
  memory.set('panaceamed.session.v1', JSON.stringify({ account:{ id, patientId }, loginAt:now }))
  bindPersonalHealthAccount({ id, patientId })
}
const workout = (id='same',hr=61) => ({ id, nama:'Fixture running', mulai:'2026-10-04T10:00:00Z', selesai:'2026-10-04T10:10:00Z', durasi:600, avgHr:hr, hr:[], pemulihan:[] })
const alert = hr => ({ jenis:'tinggi', label:'Fixture alert', mulai:'2026-10-04T10:00:00Z', sampel:1, puncakBpm:hr })
const keys = (id,patientId=id) => ['pmd_workouts_v1','pmd_hr_notifications_v1'].map(k => `${k}:scope_v1:${encodeURIComponent(JSON.stringify([id,patientId]))}`)

test('workouts and alerts follow account and patient without merging foreign IDs', () => {
  login('A'); assert.equal(store.mergeWorkouts([workout('same',61)]),1); store.mergeHrNotifications([alert(101)])
  login('B'); assert.deepEqual(store.getWorkouts(),[]); assert.deepEqual(store.getHrNotifications(),[])
  assert.equal(store.mergeWorkouts([workout('same',81)]),1); store.mergeHrNotifications([alert(121)])
  login('A'); assert.equal(store.getWorkouts()[0].avgHr,61); assert.equal(store.getHrNotifications()[0].puncakBpm,101)
  login('A','other'); assert.deepEqual(store.getWorkouts(),[]); assert.deepEqual(store.getHrNotifications(),[])
})
test('clearing B leaves A and unowned legacy data intact', () => {
  const legacyW=JSON.stringify([workout('legacy')]), legacyN=JSON.stringify([alert(91)])
  memory.set('pmd_workouts_v1',legacyW); memory.set('pmd_hr_notifications_v1',legacyN)
  login('A');store.mergeWorkouts([workout('A')]);store.mergeHrNotifications([alert(101)])
  login('B');store.mergeWorkouts([workout('B')]);store.mergeHrNotifications([alert(121)]);store.clearWorkouts()
  assert.deepEqual(store.getWorkouts(),[]);assert.deepEqual(store.getHrNotifications(),[])
  assert.equal(memory.get('pmd_workouts_v1'),legacyW);assert.equal(memory.get('pmd_hr_notifications_v1'),legacyN)
  login('A');assert.equal(store.getWorkouts()[0].id,'A');assert.equal(store.getHrNotifications()[0].puncakBpm,101)
})
test('legacy arrays remain anonymous and are not adopted into a signed-in account', () => {
  memory.set('pmd_workouts_v1',JSON.stringify([workout('legacy')]));memory.set('pmd_hr_notifications_v1',JSON.stringify([alert(91)]))
  assert.equal(store.getWorkouts()[0].id,'legacy');assert.equal(store.getHrNotifications()[0].puncakBpm,91)
  login('A');assert.deepEqual(store.getWorkouts(),[]);assert.deepEqual(store.getHrNotifications(),[])
  store.mergeWorkouts([workout('A')]);store.mergeHrNotifications([alert(101)])
  memory.delete('panaceamed.session.v1');bindPersonalHealthAccount(null)
  assert.equal(store.getWorkouts()[0].id,'legacy');assert.equal(store.getHrNotifications()[0].puncakBpm,91)
})
test('foreign copied envelopes cannot bypass cache ownership checks', () => {
  login('A');store.mergeWorkouts([workout('A')]);store.mergeHrNotifications([alert(101)])
  const [aW,aN]=keys('A').map(k=>memory.get(k));store.getWorkouts();store.getHrNotifications()
  login('B');const [bW,bN]=keys('B');memory.set(bW,aW);memory.set(bN,aN)
  assert.deepEqual(store.getWorkouts(),[]);assert.deepEqual(store.getHrNotifications(),[])
})
test('stale mounted tabs cannot read, merge or clear another session history', () => {
  login('B');store.mergeWorkouts([workout('B')]);store.mergeHrNotifications([alert(121)])
  bindPersonalHealthAccount({id:'A',patientId:'A'});const before=new Map(memory)
  assert.deepEqual(store.getWorkouts(),[]);assert.deepEqual(store.getHrNotifications(),[])
  assert.equal(store.mergeWorkouts([workout('late')]),0);assert.equal(store.mergeHrNotifications([alert(173)]),0)
  store.clearWorkouts();assert.deepEqual(memory,before)
})
test('invalid and expired remembered sessions deny all storage operations', () => {
  login('A');store.mergeWorkouts([workout('A')]);store.mergeHrNotifications([alert(101)]);bindPersonalHealthAccount(undefined)
  for(const raw of ['{',JSON.stringify({account:{id:'A'},loginAt:now}),JSON.stringify({account:{id:'A',patientId:'A'},loginAt:now-7*86400000-1})]){
    memory.set('panaceamed.session.v1',raw);const before=new Map(memory)
    assert.deepEqual(store.getWorkouts(),[]);assert.deepEqual(store.getHrNotifications(),[])
    assert.equal(store.mergeWorkouts([workout('bad')]),0);assert.equal(store.mergeHrNotifications([alert(173)]),0)
    store.clearWorkouts();assert.deepEqual(memory,before)
  }
})
test('account re-import preserves deduplication and normalized sensor values', () => {
  login('A');assert.equal(store.mergeWorkouts([workout('A')]),1);assert.equal(store.mergeWorkouts([workout('A',71)]),0)
  assert.equal(store.getWorkouts().length,1);assert.equal(store.getWorkouts()[0].avgHr,71)
  assert.equal(store.mergeHrNotifications([alert(101)]),1);assert.equal(store.mergeHrNotifications([alert(111)]),0)
  assert.equal(store.getHrNotifications()[0].puncakBpm,111)
})
test('unowned arrays and malformed/unsupported envelopes in account keys fail closed', () => {
  login('A');const [w,n]=keys('A')
  for(const raw of ['{','null',JSON.stringify([workout('foreign')]),JSON.stringify({version:2,ownerAccountId:'A',subjectId:'A',items:[]})]){
    memory.set(w,raw);memory.set(n,raw);assert.deepEqual(store.getWorkouts(),[]);assert.deepEqual(store.getHrNotifications(),[])
  }
  assert.equal(store.mergeWorkouts([workout('A')]),1);assert.equal(store.getWorkouts()[0].id,'A')
})
test('quota failure keeps reads aligned with existing owned storage', t => {
  login('A');store.mergeWorkouts([workout('A')]);store.mergeHrNotifications([alert(101)]);const before=new Map(memory)
  t.mock.method(localStorage,'setItem',()=>{throw new Error('quota')})
  store.mergeWorkouts([workout('new')]);store.mergeHrNotifications([alert(173)])
  assert.deepEqual(memory,before);assert.deepEqual(store.getWorkouts().map(w=>w.id),['A']);assert.equal(store.getHrNotifications()[0].puncakBpm,101)
})
test('unavailable session storage fails closed without clearing unknown data', t => {
  login('A');store.mergeWorkouts([workout('A')]);const before=new Map(memory)
  t.mock.method(localStorage,'getItem',()=>{throw new Error('unavailable')})
  assert.deepEqual(store.getWorkouts(),[]);assert.deepEqual(store.getHrNotifications(),[])
  assert.equal(store.mergeWorkouts([workout('late')]),0);store.clearWorkouts();assert.deepEqual(memory,before)
})
test('session replacement during runtime normalization cannot publish into either owner', () => {
  login('A');store.mergeWorkouts([workout('A')]);login('B');store.mergeWorkouts([workout('B')]);login('A')
  const [a]=keys('A'),[b]=keys('B');const beforeA=memory.get(a),beforeB=memory.get(b)
  const incoming=workout('late')
  Object.defineProperty(incoming,'nama',{get(){login('B');return 'late'}})
  assert.equal(store.mergeWorkouts([incoming]),0)
  assert.equal(memory.get(a),beforeA);assert.equal(memory.get(b),beforeB)
})
test('alert normalization cannot publish after its starting owner is replaced', () => {
  login('A');store.mergeHrNotifications([alert(101)]);login('B');store.mergeHrNotifications([alert(121)]);login('A')
  const [,a]=keys('A'),[,b]=keys('B');const beforeA=memory.get(a),beforeB=memory.get(b)
  const incoming=alert(173)
  Object.defineProperty(incoming,'label',{get(){login('B');return 'late alert'}})
  assert.equal(store.mergeHrNotifications([incoming]),0)
  assert.equal(memory.get(a),beforeA);assert.equal(memory.get(b),beforeB)
})

const { runPersonalHealthOperation } = await import('../../src/domains/personal-health/index.ts')
test('aggregate rejects an already fulfilled response after same-owner session renewal', async () => {
  login('A')
  let rejectAlerts
  const alerts = new Promise((_, reject) => { rejectAlerts = reject })
  const pending = runPersonalHealthOperation(
    () => Promise.all([Promise.resolve([workout('late')]), alerts.catch(() => [])]),
    ([w,n]) => { store.mergeWorkouts(w); store.mergeHrNotifications(n) },
  )
  await Promise.resolve()
  memory.set('panaceamed.session.v1', JSON.stringify({account:{id:'A',patientId:'A'},loginAt:now-1}))
  const before = new Map(memory)
  rejectAlerts(new Error('offline'))
  await pending
  assert.deepEqual(memory,before)
  assert.deepEqual(store.getWorkouts(),[])
})
test('unchanged operation imports the available endpoint despite partial offline failure', async () => {
  login('A')
  await runPersonalHealthOperation(
    () => Promise.all([Promise.resolve([workout('valid')]), Promise.reject(new Error('offline')).catch(() => [])]),
    ([w,n]) => { store.mergeWorkouts(w); store.mergeHrNotifications(n) },
  )
  assert.equal(store.getWorkouts()[0].id,'valid')
})
test('operation denies stale mounted identity before loading and token renewal before publishing', async () => {
  login('A'); bindPersonalHealthAccount({id:'B',patientId:'B'})
  await runPersonalHealthOperation(() => { assert.fail('must not load') }, () => assert.fail('must not publish'))
  bindPersonalHealthAccount({id:'A',patientId:'A'})
  await runPersonalHealthOperation(async () => { memory.set('pmd-token','replacement'); return [workout('late')] }, w => store.mergeWorkouts(w))
  assert.deepEqual(store.getWorkouts(),[])
})
