#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describePoolTarget, loadDatabaseUrl, loadPg } from './migrate-neon.mjs'

const qIdent = (s) => `"${String(s).replace(/"/g, '""')}"`

function canonicalRowsDigest(rows) {
  const normalized = rows.map((r) => {
    const out = {}
    for (const k of Object.keys(r).sort()) {
      const v = r[k]
      out[k] = v instanceof Date ? v.toISOString() : v
    }
    return out
  })
  normalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex')
}

async function run() {
  const databaseUrl = loadDatabaseUrl()
  if (!databaseUrl) throw new Error('DATABASE_URL not available in env or .env.local')
  const target = describePoolTarget(databaseUrl)
  const pg = loadPg()
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 4,
    idleTimeoutMillis: 15_000,
    connectionTimeoutMillis: 10_000,
  })

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'panacea-neon-restore-'))
  const isoSchema = `panacea_restore_verify_${Date.now()}`

  try {
    const client = await pool.connect()
    try {
      // 1. Check role & pool limits
      const roleRes = await client.query(
        `SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'panacea_rls_app'`,
      )
      if (roleRes.rows.length !== 1 || roleRes.rows[0].rolbypassrls !== false || roleRes.rows[0].rolsuper !== false) {
        throw new Error('Role panacea_rls_app missing or has superuser/bypassrls privilege')
      }
      const maxConnRes = await client.query('SHOW max_connections')
      const rlsTablesRes = await client.query(`
        SELECT c.relname AS tbl, c.relrowsecurity AS rls_on, c.relforcerowsecurity AS rls_forced
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'panacea_%'
          AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname IN ('profile_key','owner_profile_key') AND NOT a.attisdropped)
        ORDER BY 1
      `)
      const unforced = rlsTablesRes.rows.filter((r) => !r.rls_on || !r.rls_forced)
      if (unforced.length > 0) {
        throw new Error(`Tables missing ENABLE/FORCE RLS: ${unforced.map((r) => r.tbl).join(', ')}`)
      }

      // 2. Live cross-user RLS enforcement probe (inside rolled-back transaction)
      await client.query('BEGIN')
      try {
        const aKey = `rls_probe_a_${Date.now()}`
        const bKey = `rls_probe_b_${Date.now()}`
        await client.query(
          `INSERT INTO public.panacea_profiles (profile_key, username, full_name, role) VALUES ($1, $1, 'Probe A', 'patient'), ($2, $2, 'Probe B', 'patient')`,
          [aKey, bKey],
        )
        await client.query(
          `INSERT INTO public.panacea_privacy_consents (consent_id, profile_key, purpose, policy_version, granted) VALUES ($1, $2, 'analytics', 'v1', true), ($3, $4, 'analytics', 'v1', true)`,
          [`c_${aKey}`, aKey, `c_${bKey}`, bKey],
        )

        await client.query('SET LOCAL ROLE panacea_rls_app')
        const emptyRes = await client.query(
          `SELECT count(*)::int AS n FROM public.panacea_privacy_consents WHERE profile_key IN ($1, $2)`,
          [aKey, bKey],
        )
        if (emptyRes.rows[0].n !== 0) throw new Error('Fail-closed RLS failed: saw rows without tenant context')

        await client.query(`SELECT set_config('app.current_profile_key', $1, true)`, [aKey])
        const readARes = await client.query(
          `SELECT count(*)::int AS n FROM public.panacea_privacy_consents WHERE profile_key IN ($1, $2)`,
          [aKey, bKey],
        )
        if (readARes.rows[0].n !== 1) throw new Error(`Expected 1 own row under tenant A, got ${readARes.rows[0].n}`)

        const crossUpd = await client.query(
          `UPDATE public.panacea_privacy_consents SET granted = false WHERE profile_key = $1`,
          [bKey],
        )
        if (crossUpd.rowCount !== 0) throw new Error('Cross-tenant UPDATE leaked across RLS')

        let crossInsertBlocked = false
        try {
          await client.query(
            `INSERT INTO public.panacea_privacy_consents (consent_id, profile_key, purpose, policy_version, granted) VALUES ($1, $2, 'cross', 'v1', true)`,
            [`x_${bKey}`, bKey],
          )
        } catch (err) {
          crossInsertBlocked = err?.code === '42501'
        }
        if (!crossInsertBlocked) throw new Error('Cross-tenant INSERT was not blocked with SQLSTATE 42501')
      } finally {
        await client.query('ROLLBACK')
      }

      // 3. Logical backup to temp dir -> isolated schema restore + SHA-256 verification
      const tablesRes = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name LIKE 'panacea_%'
        ORDER BY CASE table_name WHEN 'panacea_profiles' THEN 0 ELSE 1 END, table_name
      `)
      const backupManifest = []
      for (const { table_name: tbl } of tablesRes.rows) {
        const colsRes = await client.query(
          `SELECT column_name, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
          [tbl],
        )
        const rowsRes = await client.query(`SELECT * FROM public.${qIdent(tbl)}`)
        const digest = canonicalRowsDigest(rowsRes.rows)
        const file = path.join(tempDir, `${tbl}.json`)
        fs.writeFileSync(file, JSON.stringify({ table: tbl, columns: colsRes.rows, rows: rowsRes.rows }))
        backupManifest.push({ table: tbl, rows: rowsRes.rows.length, digest, file, columns: colsRes.rows })
      }

      const t0 = Date.now()
      await client.query(`CREATE SCHEMA ${qIdent(isoSchema)}`)
      try {
        for (const item of backupManifest) {
          await client.query(`CREATE TABLE ${qIdent(isoSchema)}.${qIdent(item.table)} (LIKE public.${qIdent(item.table)} INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES)`)
          const data = JSON.parse(fs.readFileSync(item.file, 'utf8'))
          if (data.rows.length > 0) {
            const colNames = item.columns.map((c) => qIdent(c.column_name)).join(', ')
            const placeholders = item.columns.map((_, idx) => `$${idx + 1}`).join(', ')
            const sql = `INSERT INTO ${qIdent(isoSchema)}.${qIdent(item.table)} (${colNames}) VALUES (${placeholders})`
            for (const row of data.rows) {
              const vals = item.columns.map((c) => {
                const v = row[c.column_name]
                if (v === null || v === undefined) return null
                if (c.udt_name === 'jsonb' || c.udt_name === 'json') return JSON.stringify(v)
                return v
              })
              await client.query(sql, vals)
            }
          }
        }
        const rtoMs = Date.now() - t0

        // Verify 100% row count + SHA-256 parity in isolated schema
        const restoredManifest = []
        for (const item of backupManifest) {
          const rRows = await client.query(`SELECT * FROM ${qIdent(isoSchema)}.${qIdent(item.table)}`)
          const rDigest = canonicalRowsDigest(rRows.rows)
          if (rRows.rows.length !== item.rows || rDigest !== item.digest) {
            throw new Error(`Restore checksum mismatch on ${item.table}: src=${item.rows}/${item.digest} vs dst=${rRows.rows.length}/${rDigest}`)
          }
          restoredManifest.push({ table: item.table, rows: rRows.rows.length, digestMatch: true })
        }

        console.log(JSON.stringify({
          status: 'NEON_RLS_AND_RESTORE_VERIFIED',
          target,
          neonMaxConnections: maxConnRes.rows[0]?.max_connections,
          rlsForcedTableCount: rlsTablesRes.rows.length,
          rlsRoleVerified: roleRes.rows[0],
          crossUserRlsProbe: { emptyContextRows: 0, ownTenantRows: 1, crossTenantUpdateRows: 0, crossTenantInsertSqlstate: '42501', cleanedUpByRollback: true },
          isolatedRestoreProof: {
            isolatedSchema: isoSchema,
            rtoMs,
            tableCount: restoredManifest.length,
            totalRowsRestored: restoredManifest.reduce((s, r) => s + r.rows, 0),
            allDigestsMatched: true,
          },
        }, null, 2))
      } finally {
        await client.query(`DROP SCHEMA IF EXISTS ${qIdent(isoSchema)} CASCADE`)
      }
    } finally {
      client.release()
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
    await pool.end()
  }
}

run().catch((err) => {
  console.error(`verify-neon-rls-and-restore FAILED: ${err instanceof Error ? err.message : 'unknown error'}`)
  process.exit(1)
})
