// Unit tests for Neon Postgres store adapter (no network required; real transaction/SHA-256/rollback logic).
import assert from 'node:assert/strict'
import { createPostgresStore, validatePgSchemaName, type PgPoolLike } from '../src/postgresStore.js'
import { hydrateRolloutConfig, resetRolloutConfigFromEnv } from '../src/modules/rollout/rolloutGuard.js'

assert.throws(() => validatePgSchemaName('public; DROP TABLE x'), /Invalid PANACEA_PG_SCHEMA/)
assert.equal(validatePgSchemaName('panacea_stage_01'), 'panacea_stage_01')

function makeMockPool(opts: { failNextCommit?: boolean } = {}): {
  pool: PgPoolLike
  kv: Map<string, { payload_json: unknown; sha256: string }>
  accounts: Map<string, { email: string; name: string; role: string }>
  rollbacks: number
} {
  const kv = new Map<string, { payload_json: unknown; sha256: string }>()
  const accounts = new Map<string, { email: string; name: string; role: string }>()
  let txKv: Map<string, { payload_json: unknown; sha256: string }> | null = null
  let txAcc: Map<string, { email: string; name: string; role: string }> | null = null
  const mock = {
    rollbacks: 0,
    pool: {
      async query(text: string, params: unknown[] = []) {
        if (text.startsWith('SELECT slice_key')) {
          return { rows: [...kv.entries()].map(([slice_key, v]) => ({ slice_key, payload_json: v.payload_json, sha256: v.sha256 })) }
        }
        if (text === 'BEGIN') {
          txKv = new Map(kv); txAcc = new Map(accounts); return { rows: [] }
        }
        if (text === 'COMMIT') {
          if (opts.failNextCommit) { opts.failNextCommit = false; throw new Error('simulated_commit_fail') }
          kv.clear(); for (const [k, v] of txKv!) kv.set(k, v)
          accounts.clear(); for (const [k, v] of txAcc!) accounts.set(k, v)
          txKv = null; txAcc = null; return { rows: [] }
        }
        if (text === 'ROLLBACK') {
          txKv = null; txAcc = null; mock.rollbacks++; return { rows: [] }
        }
        if (text.includes('panacea_kv_state') && params.length === 3) {
          const [keys, payloads, hashes] = params as [string[], string[], string[]]
          for (let i = 0; i < keys.length; i++) txKv!.set(keys[i]!, { payload_json: JSON.parse(payloads[i]!), sha256: hashes[i]! })
        } else if (text.includes('DELETE FROM') && params.length === 1) {
          const keep = new Set(params[0] as string[])
          for (const id of [...txAcc!.keys()]) if (!keep.has(id)) txAcc!.delete(id)
        } else if (text.includes('panacea_app_accounts') && params.length === 5) {
          const [ids, emails, names, roles] = params as [string[], string[], string[], string[]]
          for (let i = 0; i < ids.length; i++) txAcc!.set(ids[i]!, { email: emails[i]!, name: names[i]!, role: roles[i]! })
        }
        return { rows: [] }
      },
      async connect() { return { query: mock.pool.query, release() {} } },
      async end() {},
    },
  }
  return { pool: mock.pool, kv, accounts, get rollbacks() { return mock.rollbacks } }
}

const m = makeMockPool()
const store = createPostgresStore({ schema: 'panacea_unit', pool: m.pool })
await store.ensureSchema()

const snap1: Record<string, unknown> = {
  users: [{ id: 'u1', email: 'a@x.test', name: 'Alice', role: 'pasien', createdAt: '2026-11-20T00:00:00.000Z' }],
  wallets: { u1: 25 },
  settings: { u1: { lang: 'id' } },
  rolloutConfig: { stage: 'stage-200', maxAccounts: 200, signupKillSwitch: true, readOnlyMode: false, updatedAt: '2026-11-20T00:00:00.000Z' },
}
assert.equal(await store.saveState(snap1), true)
assert.equal(store.stats().transactions, 1)
assert.equal(m.accounts.get('u1')?.email, 'a@x.test')

// Unchanged state skips all DB writes cleanly
assert.equal(await store.saveState(snap1), false)
assert.equal(store.stats().transactions, 1)

// Mutating one slice writes only 1 slice
snap1.wallets = { u1: 50 }
const writtenBefore = store.stats().slicesWritten
assert.equal(await store.saveState(snap1), true)
assert.equal(store.stats().slicesWritten - writtenBefore, 1)

// Transaction failure rolls back cleanly and clears hash so next retry succeeds
const mFail = makeMockPool({ failNextCommit: true })
const storeFail = createPostgresStore({ schema: 'panacea_unit', pool: mFail.pool })
await assert.rejects(() => storeFail.saveState(snap1), /simulated_commit_fail/)
assert.equal(mFail.rollbacks, 1)
assert.equal(mFail.kv.size, 0)
assert.equal(await storeFail.saveState(snap1), true)
assert.equal(mFail.accounts.size, 1)

// Load + hydrate rollout across simulated restart + deletion prunes account row
const loaded = await store.loadState()
assert.ok(loaded)
const hydrated = hydrateRolloutConfig(loaded!.rolloutConfig)
assert.equal(hydrated.stage, 'stage-200')
assert.equal(hydrated.signupKillSwitch, true)
resetRolloutConfigFromEnv()

snap1.users = []
assert.equal(await store.saveState(snap1), true)
assert.equal(m.accounts.size, 0)
console.log('postgresStoreUnit: schema guard, SHA-256 skip, rollback recovery, hydration & pruning passed')
