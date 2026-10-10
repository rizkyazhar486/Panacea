#!/usr/bin/env node
// Production may consume only current main with complete, exact-revision acceptance.
import { pathToFileURL } from 'node:url'

export const REQUIRED_RELEASE_GATES = Object.freeze([
  { path: '.github/workflows/stabilization-acceptance.yml', jobs: ['full-acceptance', 'server-acceptance'] },
  { path: '.github/workflows/organ-3d-acceptance.yml', jobs: ['render-proof'] },
  { path: '.github/workflows/clinical-evidence.yml', jobs: ['clinical-evidence'] },
  { path: '.github/workflows/security-baseline-enforcement.yml', jobs: ['enforce'] },
  { path: '.github/workflows/dependency-audit.yml', jobs: ['dependency-audit'] },
].map(gate => Object.freeze({ ...gate, jobs: Object.freeze(gate.jobs) })))

const SHA = /^[a-f0-9]{40}$/
const MAIN_EVENTS = new Set(['push', 'workflow_dispatch', 'schedule'])
const PAGE_SIZE = 100
const MAX_PAGES = 10 // GitHub's filtered workflow-run endpoint returns at most 1,000 runs.
const PENDING_STATUSES = new Set(['queued', 'waiting', 'requested', 'pending', 'in_progress'])
const RETRYABLE_CODES = new Set(['WORKFLOW_PENDING', 'MISSING_WORKFLOW'])

function requireEvidence(condition, code, message) {
  if (!condition) {
    const error = new Error(message)
    error.code = code
    throw error
  }
}

function attemptStartedAt(run, path) {
  const timestamp = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return NaN
    const parsed = Date.parse(value)
    if (!Number.isFinite(parsed)) return NaN
    const canonical = new Date(parsed).toISOString()
    return canonical === value || canonical.replace('.000Z', 'Z') === value ? parsed : NaN
  }
  const created = timestamp(run.created_at)
  // A queued attempt may not have started yet; creation still establishes its
  // identity/time. It remains pending and can never supply successful evidence.
  const started = run.run_started_at === null && PENDING_STATUSES.has(run.status)
    ? created : timestamp(run.run_started_at)
  requireEvidence(Number.isFinite(created) && Number.isFinite(started) && started >= created,
    'INVALID_RUN_TIME', `Actual workflow attempt time is unavailable: ${path}`)
  return started
}

function throwBlockingErrors(errors) {
  if (errors.length) throw errors.find(error => !RETRYABLE_CODES.has(error.code)) || errors[0]
}

function inspectReleaseRuns(sha, runs) {
  requireEvidence(typeof sha === 'string' && SHA.test(sha), 'INVALID_SHA', 'A full lowercase target SHA is required')
  requireEvidence(Array.isArray(runs), 'INVALID_RUNS', 'Workflow evidence must be an array')
  const selected = []
  const errors = []
  for (const gate of REQUIRED_RELEASE_GATES) {
    try {
      const candidates = runs.filter(run => run?.path === gate.path && run.head_sha === sha
        && run.head_branch === 'main' && MAIN_EVENTS.has(run.event))
      requireEvidence(candidates.length > 0, 'MISSING_WORKFLOW', `No exact-main workflow evidence: ${gate.path}`)
      for (const run of candidates) {
        requireEvidence(Number.isSafeInteger(run.id) && run.id > 0
          && Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0,
        'INVALID_RUN', `Invalid workflow run identity: ${gate.path}`)
        requireEvidence(run.status === 'completed' || (PENDING_STATUSES.has(run.status) && run.conclusion === null),
          'INVALID_RUN_STATUS', `Invalid workflow status: ${gate.path}`)
        attemptStartedAt(run, gate.path)
      }
      const latestTime = Math.max(...candidates.map(run => attemptStartedAt(run, gate.path)))
      const latest = candidates.filter(run => attemptStartedAt(run, gate.path) === latestTime)
      requireEvidence(new Set(latest.map(run => `${run.id}:${run.run_attempt}`)).size === 1,
        'AMBIGUOUS_LATEST_ATTEMPT', `Distinct latest workflow attempts share timestamp precision: ${gate.path}`)
      const run = latest[0]
      // A latest terminal failure outranks outstanding older attempts. Across
      // gates, terminal errors likewise outrank missing/pending evidence.
      requireEvidence(run.status !== 'completed' || run.conclusion === 'success',
        'WORKFLOW_NOT_PASSED', `Latest exact-main workflow is not successful: ${gate.path} (run ${run.id}, attempt ${run.run_attempt})`)
      // Keep a latest successful run available for job inspection even if an
      // older outstanding attempt also prevents release of this same gate.
      if (run.status === 'completed') selected.push({ gate, run })
      requireEvidence(!candidates.some(candidate => PENDING_STATUSES.has(candidate.status)), 'WORKFLOW_PENDING',
        `Outstanding exact-main workflow attempt: ${gate.path}`)
    } catch (error) { errors.push(error) }
  }
  return { selected, errors }
}

/** A later failure or pending run supersedes an earlier success at the same SHA. */
export function selectReleaseRuns(sha, runs) {
  const inspected = inspectReleaseRuns(sha, runs)
  throwBlockingErrors(inspected.errors)
  return inspected.selected
}

export function verifyReleaseJobs(sha, selected, jobsByRun) {
  return selected.map(({ gate, run }) => {
    const jobs = jobsByRun.get(run.id)
    requireEvidence(Array.isArray(jobs), 'MISSING_JOBS', `Missing job collection for run ${run.id}`)
    const accepted = gate.jobs.map(name => {
      const matches = jobs.filter(job => job?.name === name)
      requireEvidence(matches.length === 1, 'MISSING_OR_DUPLICATE_JOB', `Expected one ${name} job in run ${run.id}`)
      const job = matches[0]
      requireEvidence(Number.isSafeInteger(job.id) && job.id > 0 && job.run_id === run.id
        && job.run_attempt === run.run_attempt && job.head_sha === sha,
      'JOB_REVISION_MISMATCH', `Job provenance does not match run ${run.id}: ${name}`)
      requireEvidence(job.status === 'completed' && job.conclusion === 'success',
        'JOB_NOT_PASSED', `Required job is not successful in run ${run.id}: ${name}`)
      return { name, id: job.id }
    })
    return { workflow: gate.path, run_id: run.id, run_attempt: run.run_attempt, jobs: accepted }
  })
}

/** Read-only REST adapter. API errors never expose response bodies or credentials. */
export async function verifyVercelRelease({ repository, sha, token, fetchImpl = fetch,
  requestTimeoutMs = 15_000, totalTimeoutMs = 120_000 }) {
  requireEvidence(typeof repository === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(repository),
    'INVALID_REPOSITORY', 'GITHUB_REPOSITORY must be owner/name')
  requireEvidence(typeof sha === 'string' && SHA.test(sha), 'INVALID_SHA', 'A full lowercase target SHA is required')
  requireEvidence(typeof token === 'string' && token.trim().length > 0, 'MISSING_TOKEN', 'GITHUB_TOKEN is required for release evidence')
  requireEvidence(Number.isSafeInteger(requestTimeoutMs) && requestTimeoutMs > 0 && requestTimeoutMs <= 15_000
    && Number.isSafeInteger(totalTimeoutMs) && totalTimeoutMs > 0 && totalTimeoutMs <= 120_000,
  'INVALID_TIMEOUT', 'Release evidence timeouts must remain bounded')
  const base = `https://api.github.com/repos/${repository}`
  const deadline = AbortSignal.timeout(totalTimeoutMs)
  const get = async path => {
    let response
    let body
    try {
      response = await fetchImpl(`${base}${path}`, {
        method: 'GET', redirect: 'error',
        headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
        signal: AbortSignal.any([deadline, AbortSignal.timeout(requestTimeoutMs)]),
      })
      requireEvidence(response.ok, 'GITHUB_HTTP_ERROR', `GitHub evidence request failed (HTTP ${response.status})`)
      body = await response.json()
    } catch (error) {
      if (error.code === 'GITHUB_HTTP_ERROR') throw error
      requireEvidence(false, 'GITHUB_RESPONSE_ERROR', 'GitHub evidence request timed out or returned an unreadable response')
    }
    return body
  }
  const currentMain = async () => {
    const main = await get('/branches/main')
    requireEvidence(main?.commit?.sha === sha, 'MAIN_MOVED', 'Target revision is not current canonical main; release deferred')
  }
  const collection = async (path, key) => {
    const items = []
    const ids = new Set()
    let total
    for (let page = 1; page <= MAX_PAGES; page++) {
      const body = await get(`${path}${path.includes('?') ? '&' : '?'}per_page=${PAGE_SIZE}&page=${page}`)
      requireEvidence(Number.isSafeInteger(body?.total_count) && body.total_count >= 0
        && body.total_count <= PAGE_SIZE * MAX_PAGES && Array.isArray(body[key]),
      'INCOMPLETE_PAGINATION', 'GitHub collection is invalid or exceeds the bounded evidence limit')
      total ??= body.total_count
      requireEvidence(body.total_count === total
        && body[key].length === Math.min(PAGE_SIZE, total - items.length),
      'INCOMPLETE_PAGINATION', 'GitHub evidence pages are missing or changed during collection')
      for (const item of body[key]) {
        requireEvidence(Number.isSafeInteger(item?.id) && item.id > 0 && !ids.has(item.id),
          'INCOMPLETE_PAGINATION', 'GitHub evidence contains invalid or duplicate identities')
        ids.add(item.id)
        items.push(item)
      }
      if (items.length === total) return items
    }
    requireEvidence(false, 'INCOMPLETE_PAGINATION', 'GitHub evidence pagination did not complete')
  }
  const runsPath = `/actions/runs?branch=main&head_sha=${sha}`
  const inspect = runs => {
    requireEvidence(runs.every(run => run.head_sha === sha && run.head_branch === 'main'),
      'RUN_REVISION_MISMATCH', 'GitHub returned workflow evidence outside the requested main revision')
    return inspectReleaseRuns(sha, runs)
  }
  await currentMain()
  const { selected, errors } = inspect(await collection(runsPath, 'workflow_runs'))
  // Inspect every gate before deciding whether waiting is safe. Passed gates'
  // jobs must also be checked; an earlier pending gate cannot hide a bad job.
  throwBlockingErrors(errors.filter(error => !RETRYABLE_CODES.has(error.code)))
  const jobsByRun = new Map()
  for (const { run } of selected) {
    jobsByRun.set(run.id, await collection(`/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs`, 'jobs'))
  }
  const gates = verifyReleaseJobs(sha, selected, jobsByRun)
  throwBlockingErrors(errors)
  // A new run or rerun while collecting jobs invalidates the old green snapshot.
  const refreshedInspection = inspect(await collection(runsPath, 'workflow_runs'))
  throwBlockingErrors(refreshedInspection.errors)
  const refreshed = refreshedInspection.selected
  requireEvidence(refreshed.every(({ run }, index) => run.id === selected[index].run.id
    && run.run_attempt === selected[index].run.run_attempt),
  'SUPERSEDED_EVIDENCE', 'Acceptance was superseded while collecting release evidence')
  await currentMain()
  return { status: 'RELEASE_GATES_PASSED', repository, commit_sha: sha, gates }
}

/** Only absent/not-yet-finished workflows may be observed again. Every
 * observation starts from current main and fetches all evidence afresh. */
export async function waitForVercelRelease({ waitSeconds = 0, now = Date.now,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), ...options }) {
  requireEvidence(Number.isSafeInteger(waitSeconds) && waitSeconds >= 0 && waitSeconds <= 1200,
    'INVALID_WAIT', 'Release wait must be an integer from 0 to 1200 seconds')
  if (waitSeconds === 0) return verifyVercelRelease(options)
  let previousTime = now()
  requireEvidence(Number.isSafeInteger(previousTime), 'INVALID_CLOCK', 'Release wait clock is invalid')
  const deadline = previousTime + waitSeconds * 1000
  while (true) {
    const time = now()
    requireEvidence(Number.isSafeInteger(time) && time >= previousTime, 'INVALID_CLOCK', 'Release wait clock moved backwards')
    const remaining = deadline - time
    requireEvidence(remaining > 0, 'RELEASE_WAIT_TIMEOUT', 'Required workflows did not pass within the release wait budget')
    try {
      const evidence = await verifyVercelRelease({ ...options,
        requestTimeoutMs: Math.min(options.requestTimeoutMs ?? 15_000, remaining),
        totalTimeoutMs: Math.min(options.totalTimeoutMs ?? 120_000, remaining) })
      const finished = now()
      requireEvidence(Number.isSafeInteger(finished) && finished >= time, 'INVALID_CLOCK', 'Release wait clock moved backwards')
      requireEvidence(finished <= deadline, 'RELEASE_WAIT_TIMEOUT', 'Release evidence exceeded the release wait budget')
      return evidence
    } catch (error) {
      if (!RETRYABLE_CODES.has(error.code)) throw error
      previousTime = now()
      requireEvidence(Number.isSafeInteger(previousTime) && previousTime >= time,
        'INVALID_CLOCK', 'Release wait clock moved backwards')
      requireEvidence(previousTime < deadline, 'RELEASE_WAIT_TIMEOUT', 'Required workflows did not pass within the release wait budget')
      await sleep(Math.min(30_000, deadline - previousTime))
      requireEvidence(now() > previousTime, 'INVALID_CLOCK', 'Release wait clock did not advance during polling')
    }
  }
}

export async function main(env = process.env, io = console, options = {}) {
  try {
    const rawWait = env.RELEASE_GATE_WAIT_SECONDS ?? '0'
    requireEvidence(typeof rawWait === 'string' && /^\d+$/.test(rawWait), 'INVALID_WAIT',
      'RELEASE_GATE_WAIT_SECONDS must be an integer from 0 to 1200')
    const evidence = await waitForVercelRelease({ ...options, waitSeconds: Number(rawWait), repository: env.GITHUB_REPOSITORY,
      sha: env.GITHUB_SHA, token: env.GITHUB_TOKEN })
    io.log(JSON.stringify(evidence))
    return 0
  } catch (error) {
    io.error(`Release blocked: ${error.code || 'UNVERIFIED'}: ${error.message}`)
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main()
}
