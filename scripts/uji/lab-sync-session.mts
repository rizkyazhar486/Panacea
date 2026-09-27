import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createLabSyncRunner, labSessionScope, type LabSyncStatus, type LabServerSnapshot } from '../../src/lib/labSyncRunner.ts'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const cap = '2026-09-20T10:00:00.000Z'
const remote: LabServerSnapshot = { log: { hb: [{ id: 'source-1', tanggal: '2026-09-20', nilai: 12, rujukanBawah: 11 }] }, diperbaruiPada: cap }
const empty: LabServerSnapshot = { log: {}, diperbaruiPada: null }
function setup(enabled = true) {
  let session: string | null = 'A'
  let status: LabSyncStatus = 'lokal'
  let localReads = 0
  const gets: ReturnType<typeof deferred<LabServerSnapshot>>[] = []
  const puts: { log: LabServerSnapshot['log']; cap: string; pending: ReturnType<typeof deferred<unknown>> }[] = []
  const applied: LabServerSnapshot[] = []
  const run = createLabSyncRunner({
    enabled, session: () => session,
    getServer: () => { const d = deferred<LabServerSnapshot>(); gets.push(d); return d.promise },
    putServer: (log, cap) => { const pending = deferred<unknown>(); puts.push({ log, cap, pending }); return pending.promise },
    getLocal: () => { localReads++; return remote.log }, getLocalTimestamp: () => null,
    applyServer: (log, diperbaruiPada) => applied.push({ log, diperbaruiPada }),
    getStatus: () => status, setStatus: value => { status = value }, now: () => cap,
  })
  return { run, gets, puts, applied, setSession: (value: string | null) => { session = value }, status: () => status, localReads: () => localReads }
}
for (const next of [null, 'B']) {
  for (const response of [remote, empty]) {
    const h = setup(), pending = h.run()
    h.setSession(next)
    h.gets[0].resolve(response)
    assert.equal(await pending, 'lokal')
    assert.equal(h.localReads(), 0, 'stale GET must not read the new account local log')
    assert.equal(h.applied.length, 0, 'stale GET must not overwrite local clinical sources')
    assert.equal(h.puts.length, 0, 'stale GET must not upload under the new session')
  }
}
{
  const h = setup(), pending = h.run()
  h.gets[0].resolve(empty)
  await Promise.resolve()
  assert.equal(h.puts.length, 1)
  h.setSession('B')
  h.puts[0].pending.reject(new Error('409 conflict'))
  assert.equal(await pending, 'lokal')
  assert.equal(h.gets.length, 1, 'stale conflict must not request data for a different session')
}
for (const changeSession of [true, false]) {
  const h = setup(), pending = h.run()
  h.gets[0].resolve(empty)
  await Promise.resolve()
  h.puts[0].pending.reject(new Error('409 conflict'))
  await Promise.resolve()
  assert.equal(h.gets.length, 2)
  if (changeSession) h.setSession(null)
  h.gets[1].resolve(remote)
  assert.equal(await pending, changeSession ? 'lokal' : 'tersinkron')
  assert.deepEqual(h.applied, changeSession ? [] : [remote], 'conflict pull preserves source payload and timestamp only in its own session')
}
for (const fail of [true, false]) {
  const h = setup(), older = h.run()
  h.setSession('B')
  const newer = h.run()
  h.gets[1].resolve(remote)
  assert.equal(await newer, 'tersinkron')
  if (fail) h.gets[0].reject(new Error('network unavailable'))
  else h.gets[0].resolve(remote)
  assert.equal(await older, 'tersinkron')
  assert.equal(h.status(), 'tersinkron', 'obsolete run cannot overwrite newer status')
  assert.deepEqual(h.applied, [remote])
}
{
  const h = setup(), older = h.run(), newer = h.run()
  h.gets[1].resolve(remote)
  await newer
  h.gets[0].resolve(remote)
  await older
  assert.deepEqual(h.applied, [remote], 'out-of-order same-session results cannot overwrite newer data')
}
{
  const h = setup()
  h.setSession(null)
  assert.equal(await h.run(), 'lokal')
  assert.equal(h.gets.length, 0)
}
{
  const h = setup(), pending = h.run()
  h.gets[0].resolve(empty)
  await Promise.resolve()
  assert.deepEqual(h.puts[0].log, remote.log, 'push preserves exact source values, dates and reference bounds')
  assert.equal(h.puts[0].cap, cap)
  h.puts[0].pending.resolve({})
  assert.equal(await pending, 'tersinkron')
  assert.deepEqual(h.applied, [], 'successful upload never fabricates a measured local fact')
}
const now = Date.parse(cap)
{
  const h = setup(false)
  assert.equal(await h.run(), 'lokal')
  assert.equal(h.gets.length, 0, 'demo mode makes no backend request')
}
for (const [message, expected] of [['401 unauthorized', 'lokal'], ['network unavailable', 'gagal']] as const) {
  const h = setup(), pending = h.run()
  h.gets[0].reject(new Error(message))
  assert.equal(await pending, expected, 'current-session failure retains existing classification')
}
{
  const h = setup(), pending = h.run()
  h.gets[0].resolve(empty)
  await Promise.resolve()
  h.setSession(null)
  h.puts[0].pending.resolve({})
  assert.equal(await pending, 'lokal', 'an in-flight upload completion cannot mark a logged-out session synced')
}
const session = JSON.stringify({ account: { email: 'test@example.test' }, loginAt: now })
const reader = (raw: string | null, token = 'opaque-token') => (key: string) => key === 'panaceamed.session.v1' ? raw : token
assert.ok(labSessionScope(reader(session), now))
assert.notEqual(labSessionScope(reader(session), now), labSessionScope(reader(session, 'new-token'), now))
for (const raw of [null, '{', 'null', '{}', JSON.stringify({ account: {}, loginAt: now }), JSON.stringify({ account: { email: 'a' }, loginAt: now + 1 }), JSON.stringify({ account: { email: 'a' }, loginAt: now - 8 * 86400000 })]) {
  assert.equal(labSessionScope(reader(raw), now), null, 'malformed, absent, future or expired session fails closed')
}
assert.equal(labSessionScope(() => { throw new Error('storage unavailable') }, now), null)
const wiring = readFileSync(new URL('../../src/lib/labSync.ts', import.meta.url), 'utf8')
assert.match(wiring, /export const sinkronLab = createLabSyncRunner\(/, 'production sync uses the tested runner')
assert.match(wiring, /session: \(\) => labSessionScope\(key => localStorage.getItem\(key\)\)/, 'production session is checked at continuation time')
console.log('lab sync: session isolation, latest-run ownership, conflict handling and unchanged payloads passed')
