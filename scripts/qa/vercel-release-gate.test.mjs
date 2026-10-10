import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { REQUIRED_RELEASE_GATES, selectReleaseRuns, verifyReleaseJobs, verifyVercelRelease, waitForVercelRelease, main } from './vercel-release-gate.mjs'

const SHA = 'a'.repeat(40)
const OTHER_SHA = 'b'.repeat(40)
const REPOSITORY = 'rizkyazhar486/Panacea'
const TOKEN = 'fixture-token-never-print'
const clone = value => structuredClone(value)
const runFixtures = () => REQUIRED_RELEASE_GATES.map((gate, i) => ({
  id: 100 + i, run_attempt: 1, path: gate.path, head_sha: SHA, head_branch: 'main',
  event: 'push', status: 'completed', conclusion: 'success',
  created_at: '2026-10-10T09:00:00Z', run_started_at: '2026-10-10T09:00:00Z',
}))
const jobFixtures = runs => new Map(runs.map((run, i) => [run.id,
  REQUIRED_RELEASE_GATES[i].jobs.map((name, j) => ({ id: 1000 + i * 10 + j, name,
    run_id: run.id, run_attempt: run.run_attempt, head_sha: SHA, status: 'completed', conclusion: 'success' })),
]))
const errorCode = code => error => error.code === code

function harness({ runs = runFixtures(), refreshedRuns = runs, jobs = jobFixtures(runFixtures()),
  mainSha = SHA, finalMainSha = mainSha, intercept } = {}) {
  const calls = []
  let mainReads = 0
  let runReads = 0
  const fetchImpl = async (url, options) => {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(`/repos/${REPOSITORY}`, '')
    calls.push({ url, options })
    const altered = intercept?.({ path, parsed, calls })
    if (altered !== undefined) return altered
    let body
    if (path === '/branches/main') {
      body = { commit: { sha: mainReads++ === 0 ? mainSha : finalMainSha } }
    } else {
      let items
      let key
      const page = Number(parsed.searchParams.get('page'))
      assert.equal(parsed.searchParams.get('per_page'), '100')
      if (path === '/actions/runs') {
        assert.equal(parsed.searchParams.get('branch'), 'main')
        assert.equal(parsed.searchParams.get('head_sha'), SHA)
        if (page === 1) runReads++
        items = runReads === 1 ? runs : refreshedRuns
        key = 'workflow_runs'
      } else {
        const match = path.match(/^\/actions\/runs\/(\d+)\/attempts\/(\d+)\/jobs$/)
        assert.ok(match, `Unexpected API path: ${path}`)
        assert.equal(Number(match[2]), 1, 'job request pins the selected attempt')
        items = jobs.get(Number(match[1])) || []
        key = 'jobs'
      }
      body = { total_count: items.length, [key]: items.slice((page - 1) * 100, page * 100) }
    }
    return Response.json(body)
  }
  return { calls, options: { repository: REPOSITORY, sha: SHA, token: TOKEN, fetchImpl } }
}

function waitingHarness(snapshots) {
  let clock = 0
  let observation = 0
  const sleeps = []
  const fixtures = snapshots.map(snapshot => harness(snapshot))
  return { sleeps, fixtures, options: { repository: REPOSITORY, sha: SHA, token: TOKEN,
    now: () => clock, sleep: async ms => { sleeps.push(ms); clock += ms; observation++ },
    fetchImpl: (url, options) => fixtures[Math.min(observation, fixtures.length - 1)].options.fetchImpl(url, options) },
  advance: ms => { clock += ms } }
}

test('required policy matches existing main workflow/job names', () => {
  assert.equal(REQUIRED_RELEASE_GATES.length, 5)
  assert.equal(REQUIRED_RELEASE_GATES.flatMap(gate => gate.jobs).length, 6)
  for (const gate of REQUIRED_RELEASE_GATES) {
    const workflow = readFileSync(new URL(`../../${gate.path}`, import.meta.url), 'utf8')
    assert.match(workflow, /push:[\s\S]*main/)
    for (const job of gate.jobs) assert.match(workflow, new RegExp(`^  ${job}:`, 'm'))
  }
  assert.equal(Object.isFrozen(REQUIRED_RELEASE_GATES), true)
  assert.equal(Object.isFrozen(REQUIRED_RELEASE_GATES[0].jobs), true)
})

test('complete exact-main workflows and jobs produce exact evidence without mutation', () => {
  const runs = runFixtures()
  const jobs = jobFixtures(runs)
  const before = clone({ runs, jobs })
  const evidence = verifyReleaseJobs(SHA, selectReleaseRuns(SHA, runs), jobs)
  assert.deepEqual(evidence, REQUIRED_RELEASE_GATES.map((gate, i) => ({ workflow: gate.path,
    run_id: 100 + i, run_attempt: 1, jobs: gate.jobs.map((name, j) => ({ name, id: 1000 + i * 10 + j })) })))
  assert.deepEqual({ runs, jobs }, before)
  assert.deepEqual(verifyReleaseJobs(SHA, selectReleaseRuns(SHA, runs), jobs), evidence)
})

for (const gate of REQUIRED_RELEASE_GATES) {
  test(`missing exact revision workflow blocks ${gate.path}`, () => {
    assert.throws(() => selectReleaseRuns(SHA, runFixtures().filter(run => run.path !== gate.path)), errorCode('MISSING_WORKFLOW'))
  })
  for (const name of gate.jobs) {
    test(`missing required job blocks ${name}`, () => {
      const runs = runFixtures()
      const jobs = jobFixtures(runs)
      const run = runs.find(item => item.path === gate.path)
      jobs.set(run.id, jobs.get(run.id).filter(job => job.name !== name))
      assert.throws(() => verifyReleaseJobs(SHA, selectReleaseRuns(SHA, runs), jobs), errorCode('MISSING_OR_DUPLICATE_JOB'))
    })
  }
}

for (const replacement of [{ head_sha: OTHER_SHA }, { head_branch: 'feature' }, { event: 'pull_request' }, { path: 'renamed-workflow.yml' }]) {
  test(`unrelated evidence cannot replace exact-main acceptance: ${JSON.stringify(replacement)}`, () => {
    const runs = runFixtures()
    Object.assign(runs[0], replacement)
    assert.throws(() => selectReleaseRuns(SHA, runs), errorCode('MISSING_WORKFLOW'))
  })
}

test('an unrelated newer commit does not supersede accepted exact revision', () => {
  const runs = runFixtures()
  const selected = selectReleaseRuns(SHA, [...runs, { ...runs[0], id: 999, head_sha: OTHER_SHA, conclusion: 'failure' }])
  assert.equal(selected[0].run.id, runs[0].id)
})

for (const [status, conclusion] of [['queued', null], ['in_progress', null], ['completed', 'failure'],
  ['completed', 'cancelled'], ['completed', 'skipped'], ['completed', 'neutral'], ['completed', 'timed_out'], ['completed', null]]) {
  test(`nonpassing workflow and job block: ${status}/${conclusion}`, () => {
    const runs = runFixtures()
    const jobs = jobFixtures(runs)
    runs[0].status = status
    runs[0].conclusion = conclusion
    assert.throws(() => selectReleaseRuns(SHA, runs), errorCode(status === 'completed' ? 'WORKFLOW_NOT_PASSED' : 'WORKFLOW_PENDING'))
    runs[0].status = 'completed'
    runs[0].conclusion = 'success'
    Object.assign(jobs.get(runs[0].id)[0], { status, conclusion })
    assert.throws(() => verifyReleaseJobs(SHA, selectReleaseRuns(SHA, runs), jobs), errorCode('JOB_NOT_PASSED'))
  })
}

test('newer failed run and failed rerun both supersede older success', () => {
  const runs = runFixtures()
  for (const replacement of [{ id: 999 }, { run_attempt: 2 }]) {
    const newer = { ...runs[0], ...replacement, run_started_at: '2026-10-10T10:00:00Z', conclusion: 'failure' }
    for (const list of [[...runs, newer], [newer, ...runs]]) {
      assert.throws(() => selectReleaseRuns(SHA, list), errorCode('WORKFLOW_NOT_PASSED'))
    }
  }
})

test('newer passing run and attempt are selected regardless of API ordering', () => {
  const runs = runFixtures()
  const latest = { ...runs[0], id: 999, run_attempt: 2, run_started_at: '2026-10-10T10:00:00Z' }
  assert.equal(selectReleaseRuns(SHA, [latest, ...runs])[0].run, latest)
  assert.equal(selectReleaseRuns(SHA, [...runs, latest])[0].run, latest)
})

test('an older run rerun after a newer success supersedes that stale success', () => {
  const runs = runFixtures()
  const newerRun = { ...runs[0], id: 200, created_at: '2026-10-10T10:00:00Z', run_started_at: '2026-10-10T10:00:00Z' }
  for (const conclusion of ['failure', 'cancelled']) {
    const rerun = { ...runs[0], run_attempt: 2, run_started_at: '2026-10-10T11:00:00Z', conclusion }
    assert.throws(() => selectReleaseRuns(SHA, [newerRun, rerun, ...runs.slice(1)]), errorCode('WORKFLOW_NOT_PASSED'))
  }
  const rerun = { ...runs[0], run_attempt: 2, run_started_at: '2026-10-10T11:00:00Z' }
  assert.equal(selectReleaseRuns(SHA, [newerRun, rerun, ...runs.slice(1)])[0].run, rerun)
})

test('co-latest distinct attempts at GitHub timestamp precision fail closed rather than use ID ordering', () => {
  const runs = runFixtures()
  const laterTime = '2026-10-10T10:00:00Z'
  const success = { ...runs[0], id: 200, created_at: laterTime, run_started_at: laterTime }
  const failedRerun = { ...runs[0], run_attempt: 2, run_started_at: laterTime, conclusion: 'failure' }
  assert.throws(() => selectReleaseRuns(SHA, [success, failedRerun, ...runs.slice(1)]), errorCode('AMBIGUOUS_LATEST_ATTEMPT'))
  assert.throws(() => selectReleaseRuns(SHA, [{ ...success, id: 201 }, success, ...runs.slice(1)]), errorCode('AMBIGUOUS_LATEST_ATTEMPT'))
})

test('any outstanding exact-revision attempt blocks release even beside a completed success', () => {
  const runs = runFixtures()
  for (const status of ['queued', 'waiting', 'in_progress']) {
    assert.throws(() => selectReleaseRuns(SHA, [...runs, { ...runs[0], id: 99, run_attempt: 2,
      status, conclusion: null, created_at: '2026-10-10T08:00:00Z', run_started_at: null }]), errorCode('WORKFLOW_PENDING'))
  }
})

test('missing, impossible, or pre-creation attempt timestamps cannot establish latest evidence', () => {
  for (const update of [{ run_started_at: null }, { run_started_at: '2026-02-31T09:00:00Z' },
    { created_at: 'unknown' }, { run_started_at: '2026-10-10T08:59:59Z' }]) {
    const runs = runFixtures()
    Object.assign(runs[0], update)
    assert.throws(() => selectReleaseRuns(SHA, runs), errorCode('INVALID_RUN_TIME'))
  }
  const runs = runFixtures()
  runs[0].run_started_at = '2026-10-10T09:00:00.001Z'
  assert.equal(selectReleaseRuns(SHA, runs)[0].run, runs[0])
})

for (const replacement of [{ id: 0 }, { id: NaN }, { run_attempt: 0 }, { run_attempt: undefined }]) {
  test(`invalid run identity blocks: ${JSON.stringify(replacement)}`, () => {
    const runs = runFixtures()
    Object.assign(runs[0], replacement)
    assert.throws(() => selectReleaseRuns(SHA, runs), errorCode('INVALID_RUN'))
  })
}

test('invalid SHA and collection types fail closed', () => {
  for (const sha of ['', 'a'.repeat(39), 'A'.repeat(40), null]) {
    assert.throws(() => selectReleaseRuns(sha, runFixtures()), errorCode('INVALID_SHA'))
  }
  assert.throws(() => selectReleaseRuns(SHA, {}), errorCode('INVALID_RUNS'))
  assert.throws(() => verifyReleaseJobs(SHA, selectReleaseRuns(SHA, runFixtures()), new Map()), errorCode('MISSING_JOBS'))
})

for (const replacement of [{ id: 0 }, { run_id: 999 }, { run_attempt: 2 }, { head_sha: OTHER_SHA }]) {
  test(`wrong job provenance blocks: ${JSON.stringify(replacement)}`, () => {
    const runs = runFixtures()
    const jobs = jobFixtures(runs)
    Object.assign(jobs.get(runs[0].id)[0], replacement)
    assert.throws(() => verifyReleaseJobs(SHA, selectReleaseRuns(SHA, runs), jobs), errorCode('JOB_REVISION_MISMATCH'))
  })
}

test('duplicate required job names are not accepted', () => {
  const runs = runFixtures()
  const jobs = jobFixtures(runs)
  jobs.get(runs[0].id).push({ ...jobs.get(runs[0].id)[0], id: 9999 })
  assert.throws(() => verifyReleaseJobs(SHA, selectReleaseRuns(SHA, runs), jobs), errorCode('MISSING_OR_DUPLICATE_JOB'))
})

test('REST verification pins attempts, rechecks main/runs, and uses bounded authenticated GET only', async () => {
  const fixture = harness()
  const result = await verifyVercelRelease(fixture.options)
  assert.equal(result.status, 'RELEASE_GATES_PASSED')
  assert.equal(result.commit_sha, SHA)
  assert.equal(result.gates.length, 5)
  assert.equal(fixture.calls.length, 9)
  for (const { url, options } of fixture.calls) {
    assert.equal(new URL(url).origin, 'https://api.github.com')
    assert.equal(options.method, 'GET')
    assert.equal(options.redirect, 'error')
    assert.equal(options.headers.Authorization, `Bearer ${TOKEN}`)
    assert.ok(options.signal instanceof AbortSignal)
  }
})

test('all workflow pages and all job pages are consumed before approval', async () => {
  const runs = runFixtures()
  const filler = Array.from({ length: 100 }, (_, i) => ({ ...runs[0], id: 2000 + i, path: '.github/workflows/unrelated.yml' }))
  const jobs = jobFixtures(runs)
  jobs.get(runs[0].id).unshift(...Array.from({ length: 100 }, (_, i) => ({ id: 3000 + i, name: `unrelated-${i}` })))
  const fixture = harness({ runs: [...filler, ...runs], jobs })
  const result = await verifyVercelRelease(fixture.options)
  assert.equal(result.gates[0].jobs.length, 2)
  assert.equal(fixture.calls.filter(call => call.url.includes('&page=2')).length, 3)
})

for (const body of [{ total_count: 6, workflow_runs: [] }, { total_count: 1001, workflow_runs: [] },
  { total_count: 5, workflow_runs: [...runFixtures().slice(0, 4), runFixtures()[0]] },
  { total_count: -1, workflow_runs: [] }, { total_count: 5, workflow_runs: {} }, {}]) {
  test(`incomplete or invalid API collection fails closed: ${JSON.stringify(body).slice(0, 80)}`, async () => {
    const fixture = harness({ intercept: ({ path }) => path === '/actions/runs' ? Response.json(body) : undefined })
    await assert.rejects(verifyVercelRelease(fixture.options), errorCode('INCOMPLETE_PAGINATION'))
  })
}

test('collection total changing between pages fails closed', async () => {
  const runs = runFixtures()
  const filler = Array.from({ length: 100 }, (_, i) => ({ ...runs[0], id: 2000 + i, path: '.github/workflows/unrelated.yml' }))
  const fixture = harness({ runs: [...filler, ...runs], intercept: ({ path, parsed }) =>
    path === '/actions/runs' && parsed.searchParams.get('page') === '2'
      ? Response.json({ total_count: 106, workflow_runs: runs }) : undefined })
  await assert.rejects(verifyVercelRelease(fixture.options), errorCode('INCOMPLETE_PAGINATION'))
})

test('main mismatch blocks before reading CI; a main advance during verification also blocks', async () => {
  const initiallyStale = harness({ mainSha: OTHER_SHA })
  await assert.rejects(verifyVercelRelease(initiallyStale.options), errorCode('MAIN_MOVED'))
  assert.equal(initiallyStale.calls.length, 1)
  const advanced = harness({ finalMainSha: OTHER_SHA })
  await assert.rejects(verifyVercelRelease(advanced.options), errorCode('MAIN_MOVED'))
})

test('a new failed/pending workflow during collection blocks old success', async () => {
  const runs = runFixtures()
  for (const update of [{ status: 'in_progress', conclusion: null }, { status: 'completed', conclusion: 'failure' }]) {
    const fixture = harness({ runs, refreshedRuns: [...runs, { ...runs[0], id: 999,
      run_started_at: '2026-10-10T10:00:00Z', ...update }] })
    await assert.rejects(verifyVercelRelease(fixture.options), errorCode(update.status === 'completed' ? 'WORKFLOW_NOT_PASSED' : 'WORKFLOW_PENDING'))
  }
})

test('a new successful run or rerun during collection requires fresh pinned job evidence', async () => {
  const runs = runFixtures()
  for (const update of [{ id: 999 }, { run_attempt: 2 }]) {
    const fixture = harness({ runs, refreshedRuns: [{ ...runs[0], ...update }, ...runs.slice(1)] })
    await assert.rejects(verifyVercelRelease(fixture.options), errorCode('SUPERSEDED_EVIDENCE'))
  }
})

for (const status of [401, 403, 429, 500, 503]) {
  test(`HTTP ${status} blocks without exposing server diagnostic payload`, async () => {
    const fixture = harness({ intercept: () => Response.json({ message: TOKEN }, { status }) })
    await assert.rejects(verifyVercelRelease(fixture.options), error => error.code === 'GITHUB_HTTP_ERROR'
      && error.message === `GitHub evidence request failed (HTTP ${status})` && !error.message.includes(TOKEN))
    assert.equal(fixture.calls.length, 1, 'no blind retries or mutations')
  })
}

test('network/timeout and malformed JSON failures expose only controlled errors', async () => {
  for (const fetchImpl of [async () => { throw new Error(`Timeout with ${TOKEN}`) },
    async () => new Response(`invalid JSON: ${TOKEN}`)]) {
    await assert.rejects(verifyVercelRelease({ ...harness().options, fetchImpl }), error =>
      error.code === 'GITHUB_RESPONSE_ERROR' && !error.message.includes(TOKEN))
  }
})

test('configuration failures cause no HTTP side effects', async () => {
  for (const [update, code] of [[{ token: '' }, 'MISSING_TOKEN'], [{ repository: '../wrong' }, 'INVALID_REPOSITORY'],
    [{ sha: 'main' }, 'INVALID_SHA'], [{ requestTimeoutMs: 15001 }, 'INVALID_TIMEOUT'],
    [{ totalTimeoutMs: 120001 }, 'INVALID_TIMEOUT'], [{ requestTimeoutMs: 0 }, 'INVALID_TIMEOUT']]) {
    const fixture = harness()
    await assert.rejects(verifyVercelRelease({ ...fixture.options, ...update }), errorCode(code))
    assert.equal(fixture.calls.length, 0)
  }
})

test('CLI reports approval or blocker with correct exit code and no token disclosure', async () => {
  const logs = []
  const errors = []
  const io = { log: line => logs.push(line), error: line => errors.push(line) }
  const env = { GITHUB_REPOSITORY: REPOSITORY, GITHUB_SHA: SHA, GITHUB_TOKEN: TOKEN }
  assert.equal(await main(env, io, harness().options), 0)
  assert.equal(JSON.parse(logs[0]).commit_sha, SHA)
  assert.equal(errors.length, 0)
  assert.equal(await main({ ...env, GITHUB_TOKEN: '' }, io, harness().options), 1)
  assert.match(errors[0], /^Release blocked: MISSING_TOKEN:/)
  assert.equal([...logs, ...errors].join('\n').includes(TOKEN), false)
})

test('pending and missing workflow observations retry with entirely fresh evidence until accepted', async () => {
  const pending = runFixtures()
  Object.assign(pending[0], { status: 'queued', conclusion: null, run_started_at: null })
  const fixture = waitingHarness([{ runs: pending }, { runs: runFixtures().slice(1) }, {}])
  const result = await waitForVercelRelease({ ...fixture.options, waitSeconds: 120 })
  assert.equal(result.status, 'RELEASE_GATES_PASSED')
  assert.deepEqual(fixture.sleeps, [30_000, 30_000])
  for (const observation of fixture.fixtures) {
    assert.ok(observation.calls[0].url.endsWith('/branches/main'))
    assert.ok(observation.calls.some(call => call.url.includes('/actions/runs?')))
  }
  assert.equal(fixture.fixtures[2].calls.filter(call => call.url.includes('/attempts/')).length, 5,
    'passing observations never reuse previously green jobs')
})

test('default zero wait rejects pending immediately without polling', async () => {
  const pending = runFixtures()
  Object.assign(pending[0], { status: 'in_progress', conclusion: null })
  const fixture = waitingHarness([{ runs: pending }, {}])
  await assert.rejects(waitForVercelRelease(fixture.options), errorCode('WORKFLOW_PENDING'))
  assert.deepEqual(fixture.sleeps, [])
  assert.equal(fixture.fixtures[1].calls.length, 0)
})

test('a later terminal workflow failure outranks an earlier pending or missing gate without polling', async () => {
  for (const earlier of ['pending', 'missing']) {
    for (const conclusion of ['failure', 'cancelled', 'skipped', 'neutral', 'timed_out', null]) {
      const runs = runFixtures()
      runs.at(-1).conclusion = conclusion
      if (earlier === 'pending') Object.assign(runs[0], { status: 'in_progress', conclusion: null })
      else runs.shift()
      assert.throws(() => selectReleaseRuns(SHA, runs), errorCode('WORKFLOW_NOT_PASSED'))
      const fixture = waitingHarness([{ runs }, {}])
      await assert.rejects(waitForVercelRelease({ ...fixture.options, waitSeconds: 120 }), errorCode('WORKFLOW_NOT_PASSED'))
      assert.deepEqual(fixture.sleeps, [])
      assert.equal(fixture.fixtures[1].calls.length, 0)
    }
  }
})

test('pending or missing A cannot hide skipped/wrong-provenance/missing required jobs in successful B', async () => {
  for (const earlier of ['pending', 'missing']) {
    for (const [update, code] of [[{ conclusion: 'skipped' }, 'JOB_NOT_PASSED'],
      [{ head_sha: OTHER_SHA }, 'JOB_REVISION_MISMATCH'], [{ run_attempt: 2 }, 'JOB_REVISION_MISMATCH'],
      [null, 'MISSING_OR_DUPLICATE_JOB']]) {
      const runs = runFixtures()
      const jobs = jobFixtures(runs)
      if (earlier === 'pending') Object.assign(runs[0], { status: 'queued', conclusion: null, run_started_at: null })
      else runs.shift()
      if (update) Object.assign(jobs.get(101)[0], update)
      else jobs.set(101, [])
      const fixture = waitingHarness([{ runs, jobs }, {}])
      await assert.rejects(waitForVercelRelease({ ...fixture.options, waitSeconds: 120 }), errorCode(code))
      assert.deepEqual(fixture.sleeps, [])
      assert.ok(fixture.fixtures[0].calls.some(call => call.url.includes('/runs/101/attempts/1/jobs')))
    }
  }
})

test('an older pending attempt cannot hide terminal jobs in the latest successful run of the same gate', async () => {
  for (const [update, code] of [[{ conclusion: 'skipped' }, 'JOB_NOT_PASSED'],
    [{ head_sha: OTHER_SHA }, 'JOB_REVISION_MISMATCH'], [null, 'MISSING_OR_DUPLICATE_JOB']]) {
    const runs = runFixtures()
    runs.push({ ...runs[0], id: 99, status: 'in_progress', conclusion: null,
      created_at: '2026-10-10T08:00:00Z', run_started_at: '2026-10-10T08:00:00Z' })
    const jobs = jobFixtures(runFixtures())
    if (update) Object.assign(jobs.get(100)[0], update)
    else jobs.set(100, [])
    const fixture = waitingHarness([{ runs, jobs }, {}])
    await assert.rejects(waitForVercelRelease({ ...fixture.options, waitSeconds: 120 }), errorCode(code))
    assert.deepEqual(fixture.sleeps, [])
    assert.ok(fixture.fixtures[0].calls.some(call => call.url.includes('/runs/100/attempts/1/jobs')))
  }
})

test('malformed timestamps, provenance, ambiguous attempts, status and HTTP errors never retry', async () => {
  const cases = [
    [{ run_started_at: 'unknown' }, 'INVALID_RUN_TIME'], [{ head_sha: OTHER_SHA }, 'RUN_REVISION_MISMATCH'],
    [{ status: 'unknown' }, 'INVALID_RUN_STATUS'], [{ status: 'queued', conclusion: 'success' }, 'INVALID_RUN_STATUS'],
  ]
  for (const [update, code] of cases) {
    const runs = runFixtures()
    Object.assign(runs[0], { status: 'in_progress', conclusion: null })
    Object.assign(runs[1], update)
    const fixture = waitingHarness([{ runs }, {}])
    await assert.rejects(waitForVercelRelease({ ...fixture.options, waitSeconds: 120 }), errorCode(code))
    assert.deepEqual(fixture.sleeps, [])
  }
  const ambiguous = runFixtures()
  ambiguous.push({ ...ambiguous[1], id: 999 })
  const fixture = waitingHarness([{ runs: ambiguous }, {}])
  await assert.rejects(waitForVercelRelease({ ...fixture.options, waitSeconds: 120 }), errorCode('AMBIGUOUS_LATEST_ATTEMPT'))
  assert.deepEqual(fixture.sleeps, [])
  for (const status of [403, 429, 503]) {
    const failed = waitingHarness([{ intercept: () => Response.json({ message: TOKEN }, { status }) }, {}])
    await assert.rejects(waitForVercelRelease({ ...failed.options, waitSeconds: 120 }), errorCode('GITHUB_HTTP_ERROR'))
    assert.deepEqual(failed.sleeps, [])
  }
})

test('a missing gate appearing as a terminal failure stops after exactly one safe observation', async () => {
  const failed = runFixtures()
  failed[0].conclusion = 'failure'
  const fixture = waitingHarness([{ runs: runFixtures().slice(1) }, { runs: failed }, {}])
  await assert.rejects(waitForVercelRelease({ ...fixture.options, waitSeconds: 120 }), errorCode('WORKFLOW_NOT_PASSED'))
  assert.deepEqual(fixture.sleeps, [30_000])
  assert.equal(fixture.fixtures[2].calls.length, 0)
})

test('poll delays never exceed 30 seconds or remaining budget; timeout never approves cached green', async () => {
  const fixture = waitingHarness([{ runs: runFixtures().slice(1) }])
  await assert.rejects(waitForVercelRelease({ ...fixture.options, waitSeconds: 65 }), errorCode('RELEASE_WAIT_TIMEOUT'))
  assert.deepEqual(fixture.sleeps, [30_000, 30_000, 5000])
  assert.equal(fixture.fixtures[0].calls.filter(call => call.url.endsWith('/branches/main')).length, 3)
})

test('wait budget and injected clock boundaries reject invalid inputs before unsafe approval', async () => {
  for (const waitSeconds of [-1, 1201, 0.1, NaN, '30']) {
    const fixture = waitingHarness([{}])
    await assert.rejects(waitForVercelRelease({ ...fixture.options, waitSeconds }), errorCode('INVALID_WAIT'))
    assert.equal(fixture.fixtures[0].calls.length, 0)
  }
  const max = waitingHarness([{}])
  assert.equal((await waitForVercelRelease({ ...max.options, waitSeconds: 1200 })).status, 'RELEASE_GATES_PASSED')
  assert.deepEqual(max.sleeps, [])
  const stalled = waitingHarness([{ runs: runFixtures().slice(1) }])
  await assert.rejects(waitForVercelRelease({ ...stalled.options, waitSeconds: 30, sleep: async () => {} }), errorCode('INVALID_CLOCK'))
  const reversed = waitingHarness([{}])
  await assert.rejects(waitForVercelRelease({ ...reversed.options, waitSeconds: 30, now: () => -Infinity }), errorCode('INVALID_CLOCK'))
})

test('a verification finishing outside the overall budget cannot approve even if HTTP completed', async () => {
  const fixture = waitingHarness([{}])
  const fetchImpl = async (url, options) => {
    const response = await fixture.options.fetchImpl(url, options)
    if (url.endsWith('/branches/main') && fixture.fixtures[0].calls.length > 1) fixture.advance(1001)
    return response
  }
  await assert.rejects(waitForVercelRelease({ ...fixture.options, fetchImpl, waitSeconds: 1 }), errorCode('RELEASE_WAIT_TIMEOUT'))
  assert.deepEqual(fixture.sleeps, [])
})

test('canonical main advancing between observations is terminal and never retried', async () => {
  const fixture = waitingHarness([{ runs: runFixtures().slice(1) }, { mainSha: OTHER_SHA }, {}])
  await assert.rejects(waitForVercelRelease({ ...fixture.options, waitSeconds: 120 }), errorCode('MAIN_MOVED'))
  assert.deepEqual(fixture.sleeps, [30_000])
  assert.equal(fixture.fixtures[2].calls.length, 0)
})

test('CLI enables bounded wait only through valid RELEASE_GATE_WAIT_SECONDS configuration', async () => {
  const logs = []
  const errors = []
  const io = { log: line => logs.push(line), error: line => errors.push(line) }
  const env = { GITHUB_REPOSITORY: REPOSITORY, GITHUB_SHA: SHA, GITHUB_TOKEN: TOKEN }
  const fixture = waitingHarness([{ runs: runFixtures().slice(1) }, {}])
  assert.equal(await main({ ...env, RELEASE_GATE_WAIT_SECONDS: '120' }, io, fixture.options), 0)
  assert.deepEqual(fixture.sleeps, [30_000])
  for (const value of ['-1', '1201', '1.5', 'NaN', '', '30 seconds']) {
    const invalid = waitingHarness([{}])
    assert.equal(await main({ ...env, RELEASE_GATE_WAIT_SECONDS: value }, io, invalid.options), 1)
    assert.equal(invalid.fixtures[0].calls.length, 0)
  }
  assert.equal([...logs, ...errors].join('\n').includes(TOKEN), false)
})
