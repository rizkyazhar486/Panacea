#!/usr/bin/env node
/**
 * PanaceaMed.id OS — 50-User Beta Cohort Commander Monitor.
 *
 * Usage:
 *   node scripts/ops/beta-cohort-report.mjs           # queries Neon via DATABASE_URL / .env.local
 *   node scripts/ops/beta-cohort-report.mjs --dry-run # validates structure offline without Neon
 *
 * Security / PHI Hygiene:
 * - Never prints DATABASE_URL, session secrets, emails, or raw PII/PHI.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const DRY_RUN = process.argv.includes('--dry-run')

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim()
  const envPath = join(ROOT, '.env.local')
  if (!existsSync(envPath)) return ''
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const m = t.match(/^DATABASE_URL\s*=\s*(.+)$/)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return ''
}

async function queryNeonSql(databaseUrl, query, params = []) {
  const hostname = new URL(databaseUrl).hostname
  const endpoint = `https://${hostname}/sql`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': databaseUrl,
    },
    body: JSON.stringify({ query, params }),
  })
  if (!res.ok) {
    throw new Error(`Neon HTTP query failed (HTTP ${res.status})`)
  }
  const payload = await res.json()
  return Array.isArray(payload?.rows) ? payload.rows : []
}

const FUNNEL_ORDER = [
  'landed',
  'onboarded',
  'opened_body_exposure',
  'completed_scan',
  'completed_sync',
  'completed_export',
]

async function main() {
  const dbUrl = DRY_RUN ? '' : loadDatabaseUrl()
  if (!dbUrl) {
    const drySummary = {
      mode: DRY_RUN ? 'dry-run' : 'dry-run-no-database-url',
      targetCohortSize: 50,
      uniqueBetaUsersOnboarded: 0,
      progressLabel: '0 / 50',
      funnelSteps: Object.fromEntries(FUNNEL_ORDER.map((s) => [s, { users: 0, conversionPct: 0 }])),
      averageRating1To5: null,
      latestNotes: [],
      hint: 'Set DATABASE_URL (owner role) to query live panacea_beta_feedback & panacea_beta_funnel_events rows.',
    }
    console.log(JSON.stringify(drySummary, null, 2))
    return
  }

  const usersRows = await queryNeonSql(
    dbUrl,
    `SELECT COUNT(DISTINCT profile_key)::int AS cnt
     FROM panacea_profiles
     WHERE profile_key LIKE 'beta_%'`,
  )
  const uniqueBetaUsers = Number(usersRows[0]?.cnt ?? 0)

  const funnelRows = await queryNeonSql(
    dbUrl,
    `SELECT step_name, COUNT(DISTINCT profile_key)::int AS users
     FROM panacea_beta_funnel_events
     WHERE profile_key LIKE 'beta_%'
     GROUP BY step_name`,
  )
  const funnelMap = new Map(funnelRows.map((r) => [String(r.step_name), Number(r.users ?? 0)]))
  const onboardedBase = Math.max(uniqueBetaUsers, funnelMap.get('onboarded') ?? 0, 1)
  const funnelSteps = Object.fromEntries(
    FUNNEL_ORDER.map((step) => {
      const cnt = funnelMap.get(step) ?? 0
      return [
        step,
        {
          users: cnt,
          conversionPct: Number(((cnt / onboardedBase) * 100).toFixed(1)),
        },
      ]
    }),
  )

  const avgRows = await queryNeonSql(
    dbUrl,
    `SELECT COUNT(*)::int AS total, ROUND(AVG(rating_1_to_5), 2)::float AS avg_rating
     FROM panacea_beta_feedback`,
  )
  const noteRows = await queryNeonSql(
    dbUrl,
    `SELECT feedback_id, route_hash, rating_1_to_5, category, LEFT(note, 200) AS note, viewport, created_at
     FROM panacea_beta_feedback
     ORDER BY created_at DESC
     LIMIT 10`,
  )

  const report = {
    mode: 'neon-live',
    targetCohortSize: 50,
    uniqueBetaUsersOnboarded: uniqueBetaUsers,
    progressLabel: `${uniqueBetaUsers} / 50`,
    funnelSteps,
    feedbackCount: Number(avgRows[0]?.total ?? 0),
    averageRating1To5: avgRows[0]?.avg_rating ?? null,
    latestNotes: noteRows,
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error(`beta-cohort-report failed: ${err?.message || 'Error'}`)
  process.exit(1)
})
