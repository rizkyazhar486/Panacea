import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Execute the actual provider effect, with only the asynchronous network and
// React scheduling boundaries controlled to reproduce late response races.
const source = readFileSync(new URL('../../src/lib/store.tsx', import.meta.url), 'utf8')
const effect = source.slice(source.indexOf('  // When a backend is configured'), source.indexOf('  // #9: multi-user social feed'))
const compiled = ts.transpileModule(effect, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
const execute = new Function('state', 'setState', 'useRef', 'useEffect', 'backendEnabled', 'api', 'normalisasiDaftarPasien', compiled)
const account = { id: 'a', patientId: 'patient-a', email: 'a@example.test', role: 'dokter', loggedAt: '2026-10-04T00:00:00Z' }
function harness() {
  let state = { account, patients: [], vitals: {}, supportive: {}, records: {}, education: {}, settings: { apiKey: 'local-secret' }, wallet: { balance: 1 } }
  let dependencies, cleanup
  const references = [], requests = []
  function render() {
    let index = 0
    execute(state, update => { state = update(state) }, initial => references[index++] ??= { current: initial }, (effect, deps) => {
      if (!dependencies || deps.some((value, i) => value !== dependencies[i])) {
        cleanup?.(); dependencies = deps; cleanup = effect()
      }
    }, true, Object.fromEntries(['clinical', 'getSettings', 'wallet'].map(method => [method, () => new Promise(resolve => requests.push({ method, resolve }))])), rows => rows)
  }
  render()
  return {
    state: () => state, requests,
    change(next) { state = { ...state, account: next }; render() },
    changeBeforeCleanup(next) { state = { ...state, account: next } },
    unmount() { cleanup?.() },
    async resolve() {
      for (const request of requests.slice(0, 3)) request.resolve(request.method === 'clinical' ? { patients: [{ id: 'remote-a' }], vitals: { 'remote-a': [1] } } : request.method === 'getSettings' ? { strStatus: 'verified', chronicLifetime: true } : { balance: 900 })
      await new Promise(resolve => setImmediate(resolve))
    },
  }
}
for (const [name, next] of Object.entries({ logout: null, account: { ...account, id: 'b' }, patient: { ...account, patientId: 'patient-b' }, role: { ...account, role: 'pasien' }, session: { ...account, loggedAt: '2026-10-04T01:00:00Z' } })) {
  test(`late hydration cannot mutate state after ${name} changes`, async () => {
    const h = harness(); h.change(next); const before = h.state(); await h.resolve()
    assert.equal(h.state(), before)
  })
}
test('unmounted provider ignores all late hydration responses', async () => {
  const h = harness(); h.unmount(); const before = h.state(); await h.resolve(); assert.equal(h.state(), before)
})
test('same-email fresh login fetches a fresh session snapshot', () => {
  const h = harness(); h.change(null); h.change({ ...account, loggedAt: '2026-10-04T01:00:00Z' }); assert.equal(h.requests.length, 6)
})
test('current session accepts clinical, preferences, verification and wallet hydration', async () => {
  const h = harness(); await h.resolve()
  assert.deepEqual(h.state().patients, [{ id: 'remote-a' }]); assert.equal(h.state().account.strStatus, 'verified')
  assert.equal(h.state().settings.apiKey, 'local-secret'); assert.equal(h.state().chronicLifetime, true); assert.equal(h.state().wallet.balance, 900)
})

test('owner guard rejects queued responses before effect cleanup runs', async () => {
  const h = harness(); h.changeBeforeCleanup({ ...account, id: 'b' }); const before = h.state()
  await h.resolve(); assert.equal(h.state(), before)
})
