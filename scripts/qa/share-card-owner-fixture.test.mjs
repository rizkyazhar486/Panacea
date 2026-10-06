import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import '../uji/typescript-resolver.mjs'
const { getWorkouts } = await import('../../src/lib/workoutStore.ts')
const { bindPersonalHealthAccount } = await import('../../src/shared/kernel/personalHealthStorageScope.ts')
const source = readFileSync(new URL('./share-card-export-smoke.mjs', import.meta.url), 'utf8')
const start = source.indexOf('context.addInitScript(') + 'context.addInitScript('.length
const end = source.indexOf(', { ...sesi, __tema: tema })', start)
assert.ok(start > 0 && end > start, 'exercise the actual browser fixture initializer')
const now = Date.parse('2026-10-06T05:00:00Z')
const FixedDate = class extends Date { constructor(...args) { super(...(args.length ? args : [now])) } static now() { return now } }
const fixture = { id:'fixture-share', nama:'Running', mulai:'2026-10-05T10:00:00Z', selesai:'2026-10-05T10:10:00Z', durasi:600, hr:[], pemulihan:[] }
test.beforeEach(t => t.mock.method(Date, 'now', () => now))
test.afterEach(() => bindPersonalHealthAccount(undefined))
function seed() {
  const memory = new Map()
  const storage = { getItem:k=>memory.get(k)??null, setItem:(k,v)=>memory.set(k,String(v)), removeItem:k=>memory.delete(k) }
  const initialize = runInNewContext(`(${source.slice(start,end)})`, {localStorage:storage,Date:FixedDate,HTMLCanvasElement:{prototype:{toBlob(){}}},document:{documentElement:null,addEventListener(){}}})
  initialize(fixture)
  globalThis.localStorage = storage
  globalThis.BroadcastChannel = undefined
  const session = JSON.parse(storage.getItem('panaceamed.session.v1'))
  bindPersonalHealthAccount(session.account)
  return { memory, storage, session }
}
test('actual share fixture exposes its owned workout to the mounted QA account',()=>{
  const {storage,session}=seed()
  assert.equal(session.account.id,'share-qa-account')
  assert.equal(session.account.patientId,'share-qa-patient')
  assert.equal(storage.getItem('pmd_workouts_v1'),null,'fixture must not rely on unowned legacy adoption')
  assert.equal(getWorkouts().length,1)
  assert.equal(getWorkouts()[0].id,'fixture-share')
})
test('actual share fixture cannot be adopted by a replacement account',()=>{
  const {storage,memory}=seed()
  const account={id:'other-account',patientId:'other-patient'}
  storage.setItem('panaceamed.session.v1',JSON.stringify({account,loginAt:Date.now()}))
  bindPersonalHealthAccount(account)
  const before=new Map(memory)
  assert.deepEqual(getWorkouts(),[])
  assert.deepEqual(memory,before)
})
