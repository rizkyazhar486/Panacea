#!/usr/bin/env node
// Gerbang audit dependensi produksi. Gagal tertutup:
//   - advisory high/critical yang belum diterima secara eksplisit -> gagal;
//   - penerimaan (accepted) wajib memuat alasan, risk id, dan tanggal kedaluwarsa;
//   - keluaran `npm audit` yang rusak, kosong, atau berisi galat -> gagal, bukan lolos.
//
// Logika murni (evaluateAudit/validatePolicy) menerima `now` dari luar agar uji deterministik.
// Hanya pembungkus CLI di bawah yang membaca berkas dan jam.
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const SEVERITY_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 }
const GHSA = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const RISK_ID = /^risk\.[a-z0-9_.]+$/
const MIN_REASON_LENGTH = 20

function endOfDayUtc(date) {
  if (typeof date !== 'string' || !DATE.test(date)) return null
  const ms = Date.parse(`${date}T23:59:59.999Z`)
  if (Number.isNaN(ms)) return null
  // Date.parse menormalkan 2026-02-31 ke Maret; tolak bila tanggalnya bergeser.
  return new Date(ms).toISOString().slice(0, 10) === date ? ms : null
}

export function validatePolicy(policy) {
  const errors = []
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    return { ok: false, errors: ['policy must be a JSON object'] }
  }
  if (policy.schema_version !== 1) errors.push('policy.schema_version must be 1')
  const failOn = policy.fail_on
  if (!Array.isArray(failOn) || !failOn.every((s) => typeof s === 'string' && s in SEVERITY_RANK)) {
    errors.push('policy.fail_on must be a list of known severities')
  } else {
    // Kebijakan tidak boleh diam-diam melonggarkan ambang di bawah high.
    for (const required of ['high', 'critical']) {
      if (!failOn.includes(required)) errors.push(`policy.fail_on must include "${required}"`)
    }
  }
  if (!Array.isArray(policy.accepted)) {
    errors.push('policy.accepted must be a list')
  } else {
    policy.accepted.forEach((entry, i) => {
      const where = `policy.accepted[${i}]`
      if (!entry || typeof entry !== 'object') return errors.push(`${where} must be an object`)
      if (typeof entry.workspace !== 'string' || !entry.workspace) errors.push(`${where}.workspace is required`)
      if (typeof entry.id !== 'string' || !GHSA.test(entry.id)) errors.push(`${where}.id must be a GHSA id`)
      if (typeof entry.reason !== 'string' || entry.reason.trim().length < MIN_REASON_LENGTH) {
        errors.push(`${where}.reason must explain the acceptance (at least ${MIN_REASON_LENGTH} characters)`)
      }
      if (typeof entry.risk !== 'string' || !RISK_ID.test(entry.risk)) errors.push(`${where}.risk must be a risk register id (risk.*)`)
      if (endOfDayUtc(entry.expires) === null) errors.push(`${where}.expires must be a real YYYY-MM-DD date`)
    })
  }
  return { ok: errors.length === 0, errors }
}

function advisoryId(item) {
  const tail = typeof item.url === 'string' ? item.url.split('/').pop() : ''
  if (GHSA.test(tail)) return tail
  return item.source !== undefined ? `source:${item.source}` : 'unknown'
}

function unusable(reason) {
  return { ok: false, kind: 'unusable', failures: [], accepted: [], warnings: [], stale: [], errors: [reason] }
}

export function evaluateAudit({ audit, workspace, policy, now }) {
  const checked = validatePolicy(policy)
  if (!checked.ok) {
    return { ok: false, kind: 'policy', failures: [], accepted: [], warnings: [], stale: [], errors: checked.errors }
  }
  if (!audit || typeof audit !== 'object' || Array.isArray(audit)) return unusable('audit output is not a JSON object')
  if (audit.error) return unusable('npm audit returned an error instead of a report')
  const vulnerabilities = audit.vulnerabilities
  const summary = audit.metadata?.vulnerabilities
  if (!vulnerabilities || typeof vulnerabilities !== 'object' || Array.isArray(vulnerabilities)
    || !summary || typeof summary !== 'object' || Array.isArray(summary)) {
    return unusable('audit output has no vulnerabilities/metadata sections')
  }
  if (![summary.high, summary.critical].every((count) => Number.isSafeInteger(count) && count >= 0)) {
    return unusable('audit summary high/critical counts must be non-negative safe integers')
  }

  const advisories = new Map()
  for (const [name, entry] of Object.entries(vulnerabilities)) {
    // Missing/malformed `via` is not proof of an empty dependency audit.
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !Array.isArray(entry.via)) {
      return unusable(`vulnerability for ${name} must be an object with a via array`)
    }
    for (const item of entry.via) {
      // npm represents indirect dependency links as package names.
      if (typeof item === 'string' && item.trim()) continue
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return unusable(`advisory for ${name} must be an object or a non-empty dependency name`)
      }
      if (typeof item.severity !== 'string' || !Object.hasOwn(SEVERITY_RANK, item.severity)) {
        return unusable(`advisory for ${name} has an unknown severity`)
      }
      const pkg = item.name ?? name
      const id = advisoryId(item)
      advisories.set(`${pkg}|${id}`, { pkg, id, severity: item.severity, title: item.title ?? '', range: item.range ?? '' })
    }
  }

  const blocking = [...advisories.values()].filter((a) => policy.fail_on.includes(a.severity))
  // Ringkasan melaporkan high/critical tetapi tak satu pun bisa ditelusuri: skema berubah. Jangan lolos.
  if (summary.high + summary.critical > 0 && blocking.length === 0) {
    return unusable(`summary reports ${summary.high + summary.critical} high/critical packages but no advisory could be attributed`)
  }

  const nowMs = now instanceof Date ? now.getTime() : Number.NaN
  if (Number.isNaN(nowMs)) return unusable('evaluation time is invalid')
  const mine = policy.accepted.filter((e) => e.workspace === workspace)

  const failures = []
  const accepted = []
  for (const adv of blocking) {
    const match = mine.find((e) => e.id === adv.id)
    if (!match) failures.push({ ...adv, reason: 'no acceptance in policy' })
    else if (nowMs > endOfDayUtc(match.expires)) failures.push({ ...adv, reason: `acceptance expired on ${match.expires}` })
    else accepted.push({ ...adv, risk: match.risk, expires: match.expires })
  }

  const seen = new Set([...advisories.values()].map((a) => a.id))
  return {
    ok: failures.length === 0,
    kind: failures.length === 0 ? 'pass' : 'vulnerable',
    failures,
    accepted,
    warnings: [...advisories.values()].filter((a) => !policy.fail_on.includes(a.severity)),
    stale: mine.filter((e) => !seen.has(e.id)).map((e) => e.id),
    errors: [],
  }
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 2) out[argv[i].replace(/^--/, '')] = argv[i + 1]
  return out
}

export function main(argv, io = { log: console.log, error: console.error }) {
  const args = parseArgs(argv)
  if (!args.workspace || !args.file) {
    io.error('usage: dependency-audit-gate.mjs --workspace <name> --file <npm-audit.json> [--policy <file>] [--now YYYY-MM-DD]')
    return 2
  }
  let policy
  let audit
  try {
    policy = JSON.parse(readFileSync(args.policy ?? 'governance/dependency-audit-policy.json', 'utf8'))
  } catch (err) {
    io.error(`dependency-audit-gate: cannot read policy: ${err.message}`)
    return 2
  }
  try {
    audit = JSON.parse(readFileSync(args.file, 'utf8'))
  } catch (err) {
    io.error(`dependency-audit-gate: audit output is missing or not JSON: ${err.message}`)
    return 2
  }
  const now = args.now ? new Date(`${args.now}T12:00:00.000Z`) : new Date()
  const result = evaluateAudit({ audit, workspace: args.workspace, policy, now })

  const label = `dependency-audit-gate[${args.workspace}]`
  for (const w of result.warnings) io.log(`${label} warn ${w.severity} ${w.pkg} ${w.id} ${w.title}`)
  for (const a of result.accepted) io.log(`${label} accepted ${a.severity} ${a.pkg} ${a.id} until ${a.expires} (${a.risk})`)
  for (const id of result.stale) io.log(`${label} stale acceptance (advisory no longer present): ${id}`)
  if (result.kind === 'pass') {
    io.log(`${label} OK: no unaccepted high/critical advisories`)
    return 0
  }
  for (const f of result.failures) io.error(`${label} FAIL ${f.severity} ${f.pkg} ${f.id} ${f.title} [${f.reason}]`)
  for (const e of result.errors) io.error(`${label} ${result.kind.toUpperCase()}: ${e}`)
  return result.kind === 'vulnerable' ? 1 : 2
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2))
}
