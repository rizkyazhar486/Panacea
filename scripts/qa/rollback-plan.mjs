#!/usr/bin/env node
// ENG-E7-03: rollback DRY-RUN. Resolves a target commit to the production deployment that was built from it and prints the exact
// Vercel command an infra owner would run. It never runs that command and has no execute mode: a real rollback stays an
// infra-owner action. Fail closed: any doubt (malformed SHA, SHA not on main, no release evidence, evidence that was not
// smoke-verified, an ambiguous deployment) is a named refusal with exit code 1, never a guess.
//
//   node scripts/qa/rollback-plan.mjs --target <40-hex sha> --evidence <vercel-release-evidence.json | dir> [--evidence ...]
//                                     [--main-ref origin/main] [--current <sha>] [--repo <dir>]
//
// Evidence is the `vercel-release-evidence` artifact written by .github/workflows/vercel-prebuilt-production.yml (kept 30 days, so a
// target older than that has no evidence and is refused).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SHA = /^[0-9a-f]{40}$/
const VERIFIED = 'DEPLOYED_SMOKE_VERIFIED'
const DEPLOYMENT_URL = /^https:\/\/[a-z0-9][a-z0-9-]*\.vercel\.app$/
export const SCOPE = 'panaceamed'

/** Pure core. `onMain` is true/false/null (null = could not be determined, treated as a refusal). */
export function planRollback({ target, current = null, evidence = [], onMain }) {
  const refuse = (code, detail) => ({ ok: false, code, detail })
  if (typeof target !== 'string' || !SHA.test(target)) return refuse('invalid-target-sha', 'the target must be a full 40-character lowercase hex commit SHA')
  if (current !== null && (typeof current !== 'string' || !SHA.test(current))) return refuse('invalid-current-sha', 'the current SHA must be a full 40-character lowercase hex commit SHA')
  if (current !== null && current === target) return refuse('target-is-current', 'the target is already the deployed commit; there is nothing to roll back to')
  if (onMain !== true) return refuse('target-not-on-main', onMain === false ? 'the target commit is not an ancestor of main' : 'whether the target is on main could not be determined')
  const records = evidence.filter((r) => r && typeof r === 'object' && r.commit_sha === target)
  if (records.length === 0) return refuse('no-release-evidence', 'no release evidence names this commit (artifacts are kept 30 days)')
  const verified = records.filter((r) => r.status === VERIFIED)
  if (verified.length === 0) return refuse('evidence-not-verified', `release evidence exists but none has status ${VERIFIED} (found: ${[...new Set(records.map((r) => String(r.status)))].join(', ')})`)
  const urls = [...new Set(verified.map((r) => r.deployment_url))]
  if (urls.length !== 1) return refuse('ambiguous-deployment', `the verified evidence for this commit names ${urls.length} different deployment URLs`)
  const url = urls[0]
  if (typeof url !== 'string' || !DEPLOYMENT_URL.test(url)) return refuse('deployment-url-invalid', 'the evidence deployment URL is not an https *.vercel.app URL')
  return {
    ok: true,
    target,
    deploymentUrl: url,
    workflowRun: verified[0].workflow_run ?? null,
    command: ['vercel', 'rollback', url, `--scope=${SCOPE}`],
  }
}

function loadEvidence(paths) {
  const records = []
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? readdirSync(p).filter((f) => f.endsWith('.json')).map((f) => join(p, f)) : [p]
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, 'utf8'))
      records.push(...(Array.isArray(parsed) ? parsed : [parsed]))
    }
  }
  return records
}

/** true/false from git, null when git cannot answer (unknown ref, not a repository). Fixed argv, no shell. */
export function isAncestorOfMain(sha, mainRef, repo) {
  const r = spawnSync('git', ['merge-base', '--is-ancestor', sha, mainRef], { cwd: repo, encoding: 'utf8' })
  if (r.status === 0) return true
  if (r.status === 1) return false
  return null
}

function parseArgs(argv) {
  const out = { evidence: [], mainRef: 'origin/main', repo: process.cwd(), target: null, current: null }
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i], v = argv[i + 1]
    if (v === undefined) throw new Error(`missing value for ${k}`)
    if (k === '--target') out.target = v
    else if (k === '--current') out.current = v
    else if (k === '--evidence') out.evidence.push(v)
    else if (k === '--main-ref') out.mainRef = v
    else if (k === '--repo') out.repo = v
    else throw new Error(`unknown argument ${k}`)
  }
  return out
}

export function main(argv, io = { log: console.log, error: console.error }) {
  let args
  try { args = parseArgs(argv) } catch (e) { io.error(`rollback dry-run REFUSED [bad-arguments]: ${e.message}`); return 1 }
  let evidence
  try { evidence = loadEvidence(args.evidence) } catch (e) { io.error(`rollback dry-run REFUSED [evidence-unreadable]: ${e.message}`); return 1 }
  const onMain = typeof args.target === 'string' && SHA.test(args.target) ? isAncestorOfMain(args.target, args.mainRef, args.repo) : null
  const plan = planRollback({ target: args.target, current: args.current, evidence, onMain })
  if (!plan.ok) { io.error(`rollback dry-run REFUSED [${plan.code}]: ${plan.detail}`); return 1 }
  io.log(`rollback dry-run: target ${plan.target} is on ${args.mainRef}`)
  io.log(`deployment: ${plan.deploymentUrl} (release evidence ${VERIFIED}${plan.workflowRun ? `, ${plan.workflowRun}` : ''})`)
  io.log(`command (NOT EXECUTED; an infra owner runs it): ${plan.command.join(' ')}`)
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)))
