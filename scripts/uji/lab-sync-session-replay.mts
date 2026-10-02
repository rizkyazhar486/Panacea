import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const runnerModule = await import('../../src/lib/labSyncRunner.ts').catch(() => null)
assert.ok(runnerModule, 'lab sync runner must exist so async continuations can be session-bound')

const { createLabSyncRunner, labSessionScope } = runnerModule as any

function deferred() {
  let resolve!: (value: any) => void
  let reject!: (reason: Error) => void
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

const cap = '2026-09-20T10:00:00.000Z'
const remote = { log: { hb: [{ id: 'source-1', tanggal: '2026-09-20', nilai: 12, rujukanBawah: 11 }] }, diperbaruiPada: cap }
const empty = { log: {}, diperbaruiPada: null }

function setup(enabled = true) {
  let session: string | null = 'A'
  let status: any = 'lokal'
  let localReads = 0
  const gets: any[] = []
  const puts: any[] = []
  const applied: any[] = []
  const run = createLabSyncRunner({
    enabled,
    session: () => session,
    getServer: () => { const d = deferred(); gets.push(d); return d.promise },
    putServer: (log: any, timestamp: string) => { const pending = deferred(); puts.push({ log, timestamp, pending }); return pending.promise },
    getLocal: () => { localReads++; return remote.log },
    getLocalTimestamp: () => null,
    applyServer: (log: any, diperbaruiPada: string) => applied.push({ log, diperbaruiPada }),
    getStatus: () => status,
    setStatus: (value: any) => { status = value },
    now: () => cap,
  })
  return { run, gets, puts, applied, setSession: (value: string | null) => { session = value }, status: () => status, localReads: () => localReads }
}

for (const next of [null, 'B']) {
  const h = setup()
  const pending = h.run()
  h.setSession(next)
  h.gets[0].resolve(remote)
  assert.equal(await pending, 'lokal')
  assert.equal(h.localReads(), 0, 'stale GET must not read the next session local log')
  assert.equal(h.applied.length, 0, 'stale GET must not overwrite local clinical sources')
  assert.equal(h.puts.length, 0, 'stale GET must not upload under a different session')
}

{
  const h = setup()
  const pending = h.run()
  h.gets[0].resolve(empty)
  await Promise.resolve()
  assert.equal(h.puts.length, 1)
  h.setSession('B')
  h.puts[0].pending.reject(new Error('409 conflict'))
  assert.equal(await pending, 'lokal')
  assert.equal(h.gets.length, 1, 'stale conflict retry must not fetch for a different session')
}

{
  const h = setup()
  const older = h.run()
  h.setSession('B')
  const newer = h.run()
  h.gets[1].resolve(remote)
  assert.equal(await newer, 'tersinkron')
  h.gets[0].reject(new Error('network unavailable'))
  assert.equal(await older, 'tersinkron')
  assert.equal(h.status(), 'tersinkron', 'obsolete run cannot overwrite newer status')
  assert.deepEqual(h.applied, [remote])
}

{
  const h = setup()
  h.setSession(null)
  assert.equal(await h.run(), 'lokal')
  assert.equal(h.gets.length, 0, 'missing session must make no backend request')
}

const now = Date.parse(cap)
const sessionEnvelope = JSON.stringify({ account: { email: 'test@example.test' }, loginAt: now })
const reader = (raw: string | null, token = 'opaque-token') => (key: string) => key === 'panaceamed.session.v1' ? raw : token
assert.ok(labSessionScope(reader(sessionEnvelope), now))
assert.notEqual(labSessionScope(reader(sessionEnvelope), now), labSessionScope(reader(sessionEnvelope, 'new-token'), now))
for (const raw of [
  null,
  '{',
  'null',
  '{}',
  JSON.stringify({ account: {}, loginAt: now }),
  JSON.stringify({ account: { email: 'a' }, loginAt: now + 1 }),
  JSON.stringify({ account: { email: 'a' }, loginAt: now - 8 * 86400000 }),
]) {
  assert.equal(labSessionScope(reader(raw), now), null, 'absent, malformed, future or expired session fails closed')
}

const wiring = readFileSync(new URL('../../src/lib/labSync.ts', import.meta.url), 'utf8')
assert.match(wiring, /export const sinkronLab = createLabSyncRunner\(/, 'production sync must use the tested runner')
assert.match(wiring, /session: \(\) => labSessionScope\(key => localStorage.getItem\(key\)\)/, 'production session must be rechecked at continuation time')

console.log('lab sync replay: session isolation and latest-run ownership passed')
