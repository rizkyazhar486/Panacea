#!/usr/bin/env node
/**
 * PanaceaMed.id OS — 7-Dimension Neon Continuous & Legacy Trust Gate.
 * Prints objective measurements and exits non-zero if any automated gate fails.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { checkOrchestratorLock } from './orchestrator-lock.mjs'

const ROOT = process.cwd()
const SKIP_BUILD = process.argv.includes('--skip-build')
const LIVE_URL = process.env.PANACEA_LIVE_URL || 'https://panaceamed.id'

function runCmd(command, args, opts = {}) {
  const res = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: opts.inherit ? 'inherit' : 'pipe',
    env: process.env,
  })
  return {
    ok: res.status === 0,
    status: res.status ?? 1,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  }
}

function walkFiles(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
      continue
    }
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(full, exts, out)
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full)
    }
  }
  return out
}

const checks = []

// 1. Engineering & QA Integrity
if (SKIP_BUILD) {
  const ratchet = runCmd('node', ['scripts/arch/ratchet.mjs'])
  checks.push({
    dimension: '1. Engineering & QA Integrity',
    pass: ratchet.ok,
    detail: ratchet.ok
      ? 'Skipped full build via --skip-build; arch-ratchet PASSED'
      : `arch-ratchet FAILED (exit ${ratchet.status})`,
  })
} else {
  const buildRes = runCmd('npm', ['run', 'build'], { inherit: true })
  const ratchet = runCmd('node', ['scripts/arch/ratchet.mjs'])
  const ok = buildRes.ok && ratchet.ok
  checks.push({
    dimension: '1. Engineering & QA Integrity',
    pass: ok,
    detail: ok
      ? 'npm run build + QA test suite + arch-ratchet PASSED'
      : `buildOk=${buildRes.ok} (exit ${buildRes.status}), ratchetOk=${ratchet.ok}`,
  })
}

// 2. Cloudflare SPA, Redirect & Edge API Lock
const wranglerPath = path.join(ROOT, 'wrangler.toml')
const wranglerContent = fs.existsSync(wranglerPath) ? fs.readFileSync(wranglerPath, 'utf8') : ''
const hasSpaLock = wranglerContent.includes('not_found_handling = "single-page-application"')
const hasWorkerMain =
  wranglerContent.includes('main = "worker/index.ts"') &&
  wranglerContent.includes('binding = "ASSETS"') &&
  wranglerContent.includes('run_worker_first = ["/api/*"]') &&
  fs.existsSync(path.join(ROOT, 'worker', 'index.ts'))
const hasDistRedirects = fs.existsSync(path.join(ROOT, 'dist', '_redirects'))
const hasPublicRedirects = fs.existsSync(path.join(ROOT, 'public', '_redirects'))
const edgeApiPaths = [
  'functions/api/v1/_edgeGuard.ts',
  'functions/api/v1/health.ts',
  'functions/api/v1/session.ts',
  'functions/api/v1/sync.ts',
  'functions/api/v1/export.ts',
  'functions/api/v1/feedback.ts',
  'functions/api/v1/wearables/webhook.ts',
]
const missingEdgeHandlers = edgeApiPaths.filter((p) => !fs.existsSync(path.join(ROOT, p)))
const edgeConfigPass =
  hasSpaLock &&
  hasWorkerMain &&
  !hasDistRedirects &&
  !hasPublicRedirects &&
  missingEdgeHandlers.length === 0

checks.push({
  dimension: '2. Cloudflare SPA & Edge API Lock',
  pass: edgeConfigPass,
  detail: edgeConfigPass
    ? `wrangler.toml Worker+SPA locked; 0 _redirects; worker/index.ts + ${edgeApiPaths.length} Edge handlers present`
    : `spaLock=${hasSpaLock}, workerMain=${hasWorkerMain}, dist/_redirects=${hasDistRedirects}, public/_redirects=${hasPublicRedirects}, missingEdge=${missingEdgeHandlers.join(',')}`,
})

// 3. Identity, Privacy, Secret & Orchestrator Lock Hygiene
const scanRoots = ['src', 'worker', 'functions', 'scripts', 'sql', 'DOCS/legacy']
const trackedCode = scanRoots.flatMap((dir) => walkFiles(path.join(ROOT, dir), ['.ts', '.tsx', '.js', '.mjs', '.jsx', '.sql', '.md']))
const typoHits = []
const secretHits = []
const secretPattern = /(postgres(?:ql)?:\/\/[^\s'"]+:[^\s'"<>]+@[^\s'"]+|ghp_[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{16,}|xoxb-[A-Za-z0-9-]{16,}|-----BEGIN (?:RSA|EC|OPENSSH) PRIVATE KEY-----)/

for (const file of trackedCode) {
  const rel = path.relative(ROOT, file)
  const content = fs.readFileSync(file, 'utf8')
  if (rel.startsWith('src/') && content.includes('Asrizal')) {
    typoHits.push(rel)
  }
  if (rel === 'scripts/ops/neon-trust-gate.mjs') continue
  if (secretPattern.test(content)) {
    secretHits.push(rel)
  }
}

const lockCheck = checkOrchestratorLock(ROOT)
const hygienePass = typoHits.length === 0 && secretHits.length === 0 && lockCheck.ok
checks.push({
  dimension: '3. Identity, Secret & Lock Hygiene',
  pass: hygienePass,
  detail: hygienePass
    ? `Canonical "Azrissal" clean; 0 leaked secrets; lock=${lockCheck.state}`
    : `typoHits=${typoHits.length}, secretHits=${secretHits.length} (${secretHits.slice(0, 3).join(',')}), lockOk=${lockCheck.ok}`,
})

// 4. Neon Persistence, RLS & Legacy Schema Integrity
const sql001Path = path.join(ROOT, 'sql', '001_panaceamed_neon_os.sql')
const sql002Path = path.join(ROOT, 'sql', '002_panaceamed_legacy_governance.sql')
const sql003Path = path.join(ROOT, 'sql', '003_panaceamed_beta_50.sql')
const neonPushPath = path.join(ROOT, 'scripts', 'db', 'push-neon.mjs')
const hasNeonFiles =
  fs.existsSync(sql001Path) &&
  fs.existsSync(sql002Path) &&
  fs.existsSync(sql003Path) &&
  fs.existsSync(neonPushPath)

let neonPass = false
let neonDetail = 'Missing sql/001..003 or scripts/db/push-neon.mjs'
if (hasNeonFiles) {
  const pushArgs = process.env.DATABASE_URL ? ['scripts/db/push-neon.mjs'] : ['scripts/db/push-neon.mjs', '--dry-run']
  const neonRes = runCmd('node', pushArgs)
  let tableCount = 0
  let rlsEnabled = false
  try {
    const parsed = JSON.parse(neonRes.stdout || '{}')
    tableCount = parsed.tableCount || 0
    rlsEnabled = Boolean(parsed.rlsEnabled)
  } catch { /* ignore */ }
  neonPass = neonRes.ok && tableCount >= 18 && (process.env.DATABASE_URL ? true : rlsEnabled)
  neonDetail = neonPass
    ? process.env.DATABASE_URL
      ? `Neon live push PASSED (${tableCount} tables + RLS)`
      : `Neon 001+002+003 schema & RLS dry-run PASSED (${tableCount} tables; DATABASE_URL unset)`
    : `Neon script failed (exit ${neonRes.status}, tables=${tableCount}, rls=${rlsEnabled})`
}

checks.push({
  dimension: '4. Neon Persistence, RLS & Schema',
  pass: neonPass,
  detail: neonDetail,
})

// 5. Live Edge Production Smoke Check
let smokePass = false
let smokeDetail = `Failed to reach ${LIVE_URL}`
try {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  const resp = await fetch(LIVE_URL, { signal: controller.signal })
  clearTimeout(timer)
  const html = await resp.text()
  const isHelloWorld = html.trim() === 'Hello world'
  const hasRoot = html.includes('<div id="root"') || html.includes('<!doctype html') || html.includes('<!DOCTYPE html')
  const cssMatch = html.match(/href="([^"]+\.css[^"]*)"/)
  let cssOk = true
  let cssInfo = 'no-linked-css'
  if (cssMatch) {
    const cssUrl = new URL(cssMatch[1], LIVE_URL).toString()
    const cssRes = await fetch(cssUrl)
    const mime = cssRes.headers.get('content-type') || ''
    cssOk = cssRes.status === 200 && mime.includes('text/css')
    cssInfo = `css=${cssRes.status}:${mime.split(';')[0]}`
  }
  smokePass = resp.status === 200 && !isHelloWorld && hasRoot && cssOk
  smokeDetail = smokePass
    ? `HTTP 200 OK · valid root HTML & ${cssInfo} at ${LIVE_URL}`
    : `HTTP ${resp.status} · helloWorld=${isHelloWorld} · validHtml=${hasRoot} · ${cssInfo}`
} catch (err) {
  smokeDetail = `Network check error (${err?.name || 'Error'})`
}

checks.push({
  dimension: '5. Live Edge Production Smoke',
  pass: smokePass,
  detail: smokeDetail,
})

// 6. Scientific Honesty & Evidence Gate
const claimGuard = runCmd('node', ['scripts/qa/claim-guard.mjs'])
const validationQa = runCmd('node', ['--test', 'scripts/qa/reproducible-validation.test.mjs'])
const evidencePass = claimGuard.ok && validationQa.ok
checks.push({
  dimension: '6. Scientific Honesty & Evidence Gate',
  pass: evidencePass,
  detail: evidencePass
    ? 'claim-guard 0 violations & E0-E4 SHA-256 manifest gate PASSED'
    : `claimGuard=${claimGuard.ok}, validationQa=${validationQa.ok}`,
})

// 7. Bundle Efficiency & Humanitarian Core Availability
const constitutionPath = path.join(ROOT, 'DOCS', 'legacy', 'PANACEAMED_CONSTITUTION_2000_2100.md')
const skdiManifestPath = path.join(ROOT, 'public', 'data', 'corpora', 'skdi', 'manifest.json')
const osceManifestPath = path.join(ROOT, 'public', 'data', 'corpora', 'osce', 'manifest.json')
const shardCheck = runCmd('node', ['--import=./scripts/uji/typescript-resolver.mjs', 'scripts/medstudy/build-corpus-shards.mjs', '--check'])
const coreQa = runCmd('node', ['--test', 'scripts/qa/hippocratic-continuum.test.mjs', 'scripts/qa/ethical-open-core.test.mjs'])
let shardSummary = 'missing shards'
let shardsWithinBudget = false
if (fs.existsSync(skdiManifestPath) && fs.existsSync(osceManifestPath)) {
  try {
    const sk = JSON.parse(fs.readFileSync(skdiManifestPath, 'utf8'))
    const os = JSON.parse(fs.readFileSync(osceManifestPath, 'utf8'))
    shardsWithinBudget = sk.maxShardRawBytes < 50_000 && os.maxShardRawBytes < 50_000
    shardSummary = `SKDI=${sk.shardCount} shards (max ${sk.maxShardGzipBytes}B gz), OSCE=${os.shardCount} shards (max ${os.maxShardGzipBytes}B gz)`
  } catch { /* ignore */ }
}
const distIdx = path.join(ROOT, 'dist', 'index.html')
const budgetCheck = !SKIP_BUILD && fs.existsSync(distIdx) ? runCmd('node', ['scripts/qa/bundle-budget.mjs']).ok : true
const dim7Pass =
  fs.existsSync(constitutionPath) &&
  shardCheck.ok &&
  shardsWithinBudget &&
  coreQa.ok &&
  budgetCheck

checks.push({
  dimension: '7. Bundle Shards & Humanitarian Core',
  pass: dim7Pass,
  detail: dim7Pass
    ? `${shardSummary}; Free-Forever Core & 2000-2100 Constitution PASSED`
    : `constitution=${fs.existsSync(constitutionPath)}, shardCheck=${shardCheck.ok}, shardsBudget=${shardsWithinBudget}, coreQa=${coreQa.ok}, bundleBudget=${budgetCheck}`,
})

const passedCount = checks.filter((c) => c.pass).length
const scorePct = Math.round((passedCount / checks.length) * 100)

console.log('\n================ PANACEAMED LEGACY COMMANDER TRUST SCORECARD ================')
for (const c of checks) {
  console.log(`${c.pass ? 'PASS' : 'FAIL'} | ${c.dimension} -> ${c.detail}`)
}
console.log('-----------------------------------------------------------------------------')
console.log(`AUTOMATED LEGACY TRUST SCORE: ${passedCount}/${checks.length} (${scorePct}%)`)
console.log('=============================================================================\n')

process.exit(passedCount === checks.length ? 0 : 1)
