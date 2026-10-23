import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseRetentionPolicy, sweepRetention, type RetentionSnapshot } from '../../src/modules/privacy/domain/retention.js'
import { tulisAtomik } from '../../src/simpanAman.js'

const testPolicy = JSON.parse(readFileSync(new URL('../fixtures/privacy/retention-policy.test.json', import.meta.url), 'utf8'))
const unsetPolicy = JSON.parse(readFileSync(new URL('../../../governance/RETENTION_POLICY.json', import.meta.url), 'utf8'))
const now = 5000
const initial: RetentionSnapshot = {
  records: [
    { id: 'synthetic-before', createdAtMs: 3999, payload: 'synthetic-expired-payload' },
    { id: 'synthetic-boundary', createdAtMs: 4000, payload: 'synthetic-boundary-payload' },
    { id: 'synthetic-active', createdAtMs: 4001, payload: 'synthetic-active-payload' },
  ],
  audit: [
    { recordId: 'synthetic-before', atMs: 1999, action: 'created' },
    { recordId: 'synthetic-boundary', atMs: 2000, action: 'created' },
    { recordId: 'synthetic-active', atMs: 2001, action: 'created' },
  ],
}
const clone = (): RetentionSnapshot => structuredClone(initial)
assert.deepEqual(parseRetentionPolicy(testPolicy), { recordRetentionMs: 1000, auditRetentionMs: 3000 })
assert.deepEqual(parseRetentionPolicy({ ...testPolicy, recordRetentionMs: 1, auditRetentionMs: Number.MAX_SAFE_INTEGER }),
  { recordRetentionMs: 1, auditRetentionMs: Number.MAX_SAFE_INTEGER }, 'positive safe-integer period boundaries')
assert.deepEqual(unsetPolicy, { schemaVersion: 1, recordRetentionMs: null, auditRetentionMs: null }, 'production periods must remain unset')

const dir = mkdtempSync(join(tmpdir(), 'panacea-retention-synthetic-'))
const file = join(dir, 'synthetic.json')
const read = (): RetentionSnapshot => JSON.parse(readFileSync(file, 'utf8'))
const sweepFile = (policy: unknown, clock = now) => {
  const next = sweepRetention(read(), policy, clock)
  tulisAtomik(file, JSON.stringify(next))
}
try {
  writeFileSync(file, JSON.stringify(initial))
  assert.equal(read().records.length, 3, 'positive control: all seeded records are readable before sweep')
  sweepFile(testPolicy)
  // Baca ulang berkas, bukan salinan hasil fungsi dalam memori.
  assert.equal(read().records.find(row => row.id === 'synthetic-boundary'), undefined, 'expired synthetic record still readable after sweep')
  assert.deepEqual(read().records, [initial.records[2]], 'only the unexpired record remains readable')
  assert.deepEqual(read().audit, [
    initial.audit[2],
    { recordId: 'synthetic-before', atMs: now, action: 'expired' },
    { recordId: 'synthetic-boundary', atMs: now, action: 'expired' },
  ], 'audit retention has its own boundary and preserves deletion traces')
  const persisted = readFileSync(file, 'utf8')
  assert.equal(persisted.includes('synthetic-expired-payload'), false, 'expired payload must not enter deletion audit')
  assert.equal(persisted.includes('synthetic-boundary-payload'), false)
  sweepFile(testPolicy)
  assert.equal(readFileSync(file, 'utf8'), persisted, 'repeated sweep is idempotent, including audit')

  const cleanAudit = { ...initial.audit[0], atMs: now }
  assert.deepEqual(sweepRetention({ records: [], audit: [cleanAudit] }, testPolicy, now).audit, [cleanAudit])
  writeFileSync(file, JSON.stringify({ ...clone(), audit: [{ ...cleanAudit, payload: 'synthetic-sensitive' }] }))
  const unsupportedAudit = readFileSync(file, 'utf8')
  assert.throws(() => sweepFile(testPolicy), /^Error: invalid-retention-audit$/, 'unsupported audit payload must be rejected before any write')
  assert.equal(readFileSync(file, 'utf8'), unsupportedAudit, 'unsupported audit payload must not trigger a partial write')
  writeFileSync(file, persisted)

  // Mengganti angka berkas kebijakan mengubah perilaku tanpa mengubah kode sweep.
  const longer = { ...testPolicy, recordRetentionMs: 1001 }
  assert.deepEqual(sweepRetention(clone(), longer, now).records.map(row => row.id), ['synthetic-boundary', 'synthetic-active'])
  assert.deepEqual(sweepRetention({ records: [], audit: [] }, testPolicy, 0), { records: [], audit: [] })
  const zeroRecord = { id: 'synthetic-zero', createdAtMs: 0, payload: 'synthetic-zero-payload' }
  assert.deepEqual(sweepRetention({ records: [zeroRecord], audit: [] }, testPolicy, 0), { records: [zeroRecord], audit: [] })
  assert.deepEqual(sweepRetention({ records: [], audit: [{ recordId: 'synthetic-zero', atMs: 0, action: 'expired' }] }, testPolicy, 0).audit,
    [{ recordId: 'synthetic-zero', atMs: 0, action: 'expired' }], 'zero timestamp is a valid boundary')
  assert.deepEqual(sweepRetention(read(), testPolicy, now + 3000), { records: [], audit: [{ recordId: 'synthetic-active', atMs: 8000, action: 'expired' }] }, 'deletion audit expires at its test-policy boundary')

  for (const [bad, reason] of [
    [null, 'invalid-retention-policy'], [[], 'invalid-retention-policy'], ['policy', 'invalid-retention-policy'],
    [{ ...testPolicy, schemaVersion: 2 }, 'invalid-retention-policy'], [{ ...testPolicy, typo: 1 }, 'invalid-retention-policy'],
    [{ schemaVersion: 1 }, 'invalid-retention-policy'], [unsetPolicy, 'retention-policy-unset'],
    [{ ...testPolicy, recordRetentionMs: null }, 'retention-policy-unset'], [{ ...testPolicy, auditRetentionMs: null }, 'retention-policy-unset'],
    ...[0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1000', undefined].flatMap(period => [
      [{ ...testPolicy, recordRetentionMs: period }, 'invalid-retention-period'],
      [{ ...testPolicy, auditRetentionMs: period }, 'invalid-retention-period'],
    ]),
  ] as const) {
    assert.throws(() => sweepFile(bad), new RegExp(`^Error: ${reason}$`))
    assert.equal(readFileSync(file, 'utf8'), persisted, 'invalid/unset policy must not change persisted records or audit')
  }
  for (const clock of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '5000']) {
    assert.throws(() => sweepFile(testPolicy, clock as number), /^Error: invalid-retention-clock$/)
    assert.equal(readFileSync(file, 'utf8'), persisted, 'invalid clock must not write')
  }
  for (const snapshot of [null, {}, { records: null, audit: [] }, { records: [], audit: null }]) {
    assert.throws(() => sweepRetention(snapshot as RetentionSnapshot, testPolicy, now), /^Error: invalid-retention-snapshot$/)
  }
  for (const record of [
    null, { ...initial.records[0], id: '' }, { ...initial.records[0], id: ' ' }, { ...initial.records[0], id: 1 },
    ...[-1, 5001, 0.5, NaN, Infinity, '3999'].map(createdAtMs => ({ ...initial.records[0], createdAtMs })),
  ]) {
    const snapshot = { ...clone(), records: [record] } as RetentionSnapshot
    const before = structuredClone(snapshot)
    assert.throws(() => sweepRetention(snapshot, testPolicy, now), /^Error: invalid-retention-record$/)
    assert.deepEqual(snapshot, before, 'invalid record must not mutate input')
  }
  assert.throws(() => sweepRetention({ ...clone(), records: [initial.records[0], initial.records[0]] }, testPolicy, now), /^Error: invalid-retention-record$/)
  for (const event of [
    null, { ...initial.audit[0], recordId: '' }, { ...initial.audit[0], recordId: ' ' }, { ...initial.audit[0], recordId: 1 },
    { ...initial.audit[0], action: 'unsupported' },
    ...[-1, 5001, 0.5, NaN, Infinity, '1999'].map(atMs => ({ ...initial.audit[0], atMs })),
  ]) {
    const snapshot = { ...clone(), audit: [event] } as RetentionSnapshot
    const before = structuredClone(snapshot)
    assert.throws(() => sweepRetention(snapshot, testPolicy, now), /^Error: invalid-retention-audit$/)
    assert.deepEqual(snapshot, before, 'invalid audit must not mutate input')
  }
  const untouched = clone()
  assert.deepEqual(sweepRetention(untouched, testPolicy, now), sweepRetention(clone(), testPolicy, now), 'fixed clock is deterministic')
  assert.deepEqual(untouched, initial, 'successful sweep must not mutate input')
  console.log('retentionHarness: policy-file test values only; expired records unreadable after disk reload; audit retained, boundaries, idempotence and fail-closed no-write controls passed')
} finally {
  rmSync(dir, { recursive: true, force: true })
}
