import { createHash } from 'node:crypto'
import pg from 'pg'

export interface PgQueryable {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>
}

export interface PgClientLike extends PgQueryable {
  release(err?: Error | boolean): void
}

export interface PgPoolLike extends PgQueryable {
  connect(): Promise<PgClientLike>
  end(): Promise<void>
}

export interface PostgresWriteStats {
  slicesWritten: number
  slicesSkipped: number
  bytesWritten: number
  transactions: number
  accountRowsSynced: number
}

const SLICE_PRIORITY_KEYS = [
  'users',
  'wallets',
  'healthProfiles',
  'settings',
  'privacyConsents',
  'rolloutConfig',
  'audit',
  'clinical',
] as const

const PRIORITY_SET = new Set<string>(SLICE_PRIORITY_KEYS)

export function validatePgSchemaName(raw = process.env.PANACEA_PG_SCHEMA || 'public'): string {
  const name = raw.trim()
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(name)) {
    throw new Error(`Invalid PANACEA_PG_SCHEMA: must match ^[a-z][a-z0-9_]{0,62}$`)
  }
  return name
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

export function partitionStateSlices(snapshot: Record<string, unknown>): Map<string, string> {
  const out = new Map<string, string>()
  for (const key of SLICE_PRIORITY_KEYS) {
    if (key in snapshot && snapshot[key] !== undefined) {
      out.set(key, JSON.stringify(snapshot[key]))
    }
  }
  const core: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(snapshot)) {
    if (!PRIORITY_SET.has(k) && v !== undefined) core[k] = v
  }
  out.set('core', JSON.stringify(core))
  return out
}

export function mergeStateSlices(rows: { slice_key: string; payload_json: unknown }[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  const coreRow = rows.find((r) => r.slice_key === 'core')
  if (coreRow && coreRow.payload_json && typeof coreRow.payload_json === 'object' && !Array.isArray(coreRow.payload_json)) {
    Object.assign(merged, coreRow.payload_json as Record<string, unknown>)
  }
  for (const row of rows) {
    if (row.slice_key !== 'core' && PRIORITY_SET.has(row.slice_key)) {
      merged[row.slice_key] = row.payload_json
    }
  }
  return merged
}

export function createPostgresStore(options: {
  connectionString?: string
  schema?: string
  pool?: PgPoolLike
} = {}) {
  const schema = validatePgSchemaName(options.schema)
  const poolMax = Math.max(2, Math.min(30, Number(process.env.PG_POOL_MAX) || 10))
  const pool: PgPoolLike = options.pool ?? new pg.Pool({
    connectionString: options.connectionString,
    max: poolMax,
    idleTimeoutMillis: 15_000,
    connectionTimeoutMillis: 10_000,
  })

  const stateTbl = `"${schema}"."panacea_kv_state"`
  const accountsTbl = `"${schema}"."panacea_app_accounts"`
  const sliceHashes = new Map<string, string>()
  const writeStats: PostgresWriteStats = {
    slicesWritten: 0,
    slicesSkipped: 0,
    bytesWritten: 0,
    transactions: 0,
    accountRowsSynced: 0,
  }

  async function ensureSchema(): Promise<void> {
    if (schema !== 'public') await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${stateTbl} (
        slice_key TEXT PRIMARY KEY,
        payload_json JSONB NOT NULL,
        sha256 TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${accountsTbl} (
        user_id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  }

  async function loadState(): Promise<Record<string, unknown> | null> {
    const res = await pool.query(`SELECT slice_key, payload_json, sha256 FROM ${stateTbl}`)
    if (!res.rows.length) return null
    const parsedRows = res.rows.map((r) => ({
      slice_key: String(r.slice_key),
      payload_json: r.payload_json,
      sha256: String(r.sha256 || ''),
    }))
    const merged = mergeStateSlices(parsedRows)
    sliceHashes.clear()
    for (const [k, jsonText] of partitionStateSlices(merged)) {
      sliceHashes.set(k, sha256(jsonText))
    }
    return merged
  }

  async function saveState(snapshot: Record<string, unknown>): Promise<boolean> {
    const slices = partitionStateSlices(snapshot)
    const dirty: { key: string; json: string; hash: string }[] = []
    let skipped = 0
    for (const [key, json] of slices) {
      const hash = sha256(json)
      if (sliceHashes.get(key) === hash) {
        skipped++
      } else {
        dirty.push({ key, json, hash })
      }
    }
    writeStats.slicesSkipped += skipped
    if (!dirty.length) return false

    const usersDirty = dirty.some((d) => d.key === 'users')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('SET LOCAL statement_timeout = 15000')
      await client.query(
        `INSERT INTO ${stateTbl} (slice_key, payload_json, sha256, updated_at)
         SELECT k, p, h, NOW() FROM UNNEST($1::text[], $2::jsonb[], $3::text[]) AS t(k, p, h)
         ON CONFLICT (slice_key) DO UPDATE SET payload_json = EXCLUDED.payload_json, sha256 = EXCLUDED.sha256, updated_at = NOW()`,
        [dirty.map((d) => d.key), dirty.map((d) => d.json), dirty.map((d) => d.hash)],
      )

      let accountsSynced = 0
      if (usersDirty && Array.isArray(snapshot.users)) {
        const users = snapshot.users as { id?: unknown; email?: unknown; name?: unknown; role?: unknown; createdAt?: unknown }[]
        const ids = users.map((u) => String(u.id ?? ''))
        await client.query(`DELETE FROM ${accountsTbl} WHERE NOT (user_id = ANY($1::text[]))`, [ids])
        if (users.length > 0) {
          await client.query(
            `INSERT INTO ${accountsTbl} (user_id, email, name, role, created_at, updated_at)
             SELECT i, e, n, r, c, NOW() FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[], $5::timestamptz[]) AS u(i, e, n, r, c)
             ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role, updated_at = NOW()`,
            [
              ids,
              users.map((u) => String(u.email ?? '').toLowerCase()),
              users.map((u) => String(u.name ?? '')),
              users.map((u) => String(u.role ?? 'pasien')),
              users.map((u) => String(u.createdAt || new Date().toISOString())),
            ],
          )
          accountsSynced = users.length
        }
      }

      await client.query('COMMIT')
      for (const d of dirty) {
        sliceHashes.set(d.key, d.hash)
        writeStats.bytesWritten += Buffer.byteLength(d.json)
      }
      writeStats.slicesWritten += dirty.length
      writeStats.transactions += 1
      writeStats.accountRowsSynced += accountsSynced
      return true
    } catch (err) {
      try { await client.query('ROLLBACK') } catch { /* ignore rollback err */ }
      for (const d of dirty) sliceHashes.delete(d.key)
      throw err
    } finally {
      client.release()
    }
  }

  return {
    schema,
    ensureSchema,
    loadState,
    saveState,
    stats: (): PostgresWriteStats => ({ ...writeStats }),
    close: () => pool.end(),
  }
}

export type PostgresStore = ReturnType<typeof createPostgresStore>
