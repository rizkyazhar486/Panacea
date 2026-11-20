#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export function loadDatabaseUrl(root = ROOT) {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim()
  const envFile = path.join(root, '.env.local')
  if (!fs.existsSync(envFile)) return ''
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const idx = trimmed.indexOf('=')
    if (trimmed.slice(0, idx).trim() === 'DATABASE_URL') {
      return trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
    }
  }
  return ''
}

export function discoverMigrations(sqlDir = path.join(ROOT, 'sql')) {
  if (!fs.existsSync(sqlDir)) return []
  return fs
    .readdirSync(sqlDir)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort()
    .map((file) => {
      const version = file.slice(0, 3)
      const content = fs.readFileSync(path.join(sqlDir, file), 'utf8')
      const checksum = crypto.createHash('sha256').update(content).digest('hex')
      return { version, name: file, content, checksum }
    })
}

export function describePoolTarget(databaseUrl) {
  const u = new URL(databaseUrl)
  return {
    protocol: u.protocol.replace(':', ''),
    pooledEndpoint: u.hostname.includes('-pooler'),
    sslMode: u.searchParams.get('sslmode') || 'required',
    poolMax: 10,
    statementTimeoutMs: 15_000,
    connectionTimeoutMs: 10_000,
  }
}

async function run() {
  const dryRun = process.argv.includes('--dry-run')
  const migrations = discoverMigrations()
  if (migrations.length === 0) throw new Error('No SQL migrations found under sql/')

  const databaseUrl = loadDatabaseUrl()
  if (dryRun || !databaseUrl) {
    console.log(JSON.stringify({
      mode: dryRun ? 'dry-run' : 'missing-database-url',
      status: dryRun ? 'MIGRATIONS_VALIDATED' : 'BLOCKED_NO_DATABASE_URL',
      migrations: migrations.map((m) => ({ version: m.version, name: m.name, checksum: m.checksum })),
    }, null, 2))
    process.exit(dryRun ? 0 : 1)
  }

  const target = describePoolTarget(databaseUrl)
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: target.poolMax,
    idleTimeoutMillis: 15_000,
    connectionTimeoutMillis: target.connectionTimeoutMs,
  })

  try {
    const client = await pool.connect()
    const applied = []
    const skipped = []
    try {
      await client.query(`SET statement_timeout = ${target.statementTimeoutMs}`)
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.panacea_schema_migrations (
          version TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          checksum_sha256 TEXT NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      const existing = await client.query('SELECT version, checksum_sha256 FROM public.panacea_schema_migrations')
      const recorded = new Map(existing.rows.map((r) => [r.version, r.checksum_sha256]))

      for (const m of migrations) {
        const prevChecksum = recorded.get(m.version)
        if (prevChecksum) {
          if (prevChecksum !== m.checksum) {
            throw new Error(`Checksum mismatch on migration ${m.name}; refusing to alter history.`)
          }
          skipped.push(m.name)
          continue
        }
        await client.query('BEGIN')
        try {
          await client.query(m.content)
          await client.query(
            'INSERT INTO public.panacea_schema_migrations (version, name, checksum_sha256) VALUES ($1, $2, $3)',
            [m.version, m.name, m.checksum],
          )
          await client.query('COMMIT')
          applied.push(m.name)
        } catch (err) {
          await client.query('ROLLBACK')
          throw err
        }
      }
      const totalRes = await client.query('SELECT version, name, applied_at FROM public.panacea_schema_migrations ORDER BY version')
      console.log(JSON.stringify({ status: 'MIGRATIONS_APPLIED', target, applied, skipped, ledger: totalRes.rows }, null, 2))
    } finally {
      client.release()
    }
  } finally {
    await pool.end()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  run().catch((err) => {
    console.error(`migrate-neon FAILED: ${err instanceof Error ? err.message : 'unknown error'}`)
    process.exit(1)
  })
}
