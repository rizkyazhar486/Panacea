#!/usr/bin/env node
/**
 * Single-Orchestrator Advisory Lock Guard.
 * Prevents concurrent multi-agent mutations on the shared worktree while
 * automatically recovering stale locks whose PID exited or TTL elapsed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

function resolveGitDir(root) {
  const gitPath = path.join(root, '.git')
  if (!fs.existsSync(gitPath)) return null
  const stat = fs.statSync(gitPath)
  if (stat.isDirectory()) return gitPath
  const raw = fs.readFileSync(gitPath, 'utf8')
  const match = raw.match(/^gitdir:\s*(.+)$/m)
  if (!match) return null
  return path.resolve(root, match[1].trim())
}

export function getLockFilePath(root = process.cwd()) {
  const gitDir = resolveGitDir(root)
  if (!gitDir) return null
  return path.join(gitDir, 'panacea-orchestrator.lock')
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err?.code === 'EPERM'
  }
}

export function checkOrchestratorLock(root = process.cwd(), currentPid = process.pid) {
  const lockPath = getLockFilePath(root)
  if (!lockPath) {
    return { ok: true, state: 'no_git_dir', stale: false, lock: null, path: null }
  }
  if (!fs.existsSync(lockPath)) {
    return { ok: true, state: 'unlocked', stale: false, lock: null, path: lockPath }
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(lockPath, 'utf8'))
    const acquiredMs = Date.parse(parsed.acquiredAtIso || '')
    const ttlMs = Number.isFinite(parsed.ttlMs) ? parsed.ttlMs : DEFAULT_TTL_MS
    const ageMs = Number.isFinite(acquiredMs) ? Math.max(0, Date.now() - acquiredMs) : Number.POSITIVE_INFINITY
    const pidAlive = isPidAlive(parsed.pid)
    const expired = ageMs > ttlMs
    const stale = !pidAlive || expired
    const ownedByPeer = pidAlive && !expired && parsed.pid !== currentPid
    return {
      ok: !ownedByPeer,
      state: stale ? 'stale' : parsed.pid === currentPid ? 'owned_by_self' : 'held_by_peer',
      stale,
      lock: parsed,
      path: lockPath,
    }
  } catch {
    return { ok: true, state: 'corrupt_stale', stale: true, lock: null, path: lockPath }
  }
}

export function acquireOrchestratorLock(
  root = process.cwd(),
  options = {},
) {
  const pid = options.pid ?? process.pid
  const owner = options.owner ?? 'omnicausalis-orchestrator'
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
  const status = checkOrchestratorLock(root, pid)
  if (!status.path) {
    return { ok: false, error: 'Missing .git directory for advisory lock.' }
  }
  if (!status.ok) {
    return {
      ok: false,
      error: `Active orchestrator lock held by PID ${status.lock?.pid} (${status.lock?.owner}) on ${status.lock?.branch}`,
      existing: status.lock,
    }
  }
  let branch = options.branch || ''
  if (!branch) {
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root, encoding: 'utf8' }).trim()
    } catch {
      branch = 'unknown'
    }
  }
  const payload = {
    pid,
    owner,
    branch,
    acquiredAtIso: new Date().toISOString(),
    ttlMs,
  }
  fs.writeFileSync(status.path, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  return { ok: true, lock: payload, path: status.path, recoveredStale: status.stale }
}

export function releaseOrchestratorLock(root = process.cwd(), pid = process.pid, force = false) {
  const status = checkOrchestratorLock(root, pid)
  if (!status.path || !fs.existsSync(status.path)) {
    return { ok: true, released: false, reason: 'not_locked' }
  }
  if (!force && status.lock && status.lock.pid !== pid && !status.stale) {
    return { ok: false, released: false, reason: `Lock belongs to live PID ${status.lock.pid}` }
  }
  fs.unlinkSync(status.path)
  return { ok: true, released: true }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const cmd = process.argv[2] || 'check'
  const root = process.cwd()
  if (cmd === 'acquire') {
    const res = acquireOrchestratorLock(root, { owner: process.env.PANACEA_LOCK_OWNER || 'omnicausalis-cli' })
    console.log(JSON.stringify(res, null, 2))
    process.exit(res.ok ? 0 : 1)
  } else if (cmd === 'release') {
    const res = releaseOrchestratorLock(root, process.pid, process.argv.includes('--force'))
    console.log(JSON.stringify(res, null, 2))
    process.exit(res.ok ? 0 : 1)
  } else {
    const res = checkOrchestratorLock(root)
    console.log(JSON.stringify(res, null, 2))
    process.exit(res.ok ? 0 : 1)
  }
}
