// Local/CI synthetic Mongo only. Writer and reader are separate application processes.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { MongoClient } from 'mongodb'
import { verifyTrail } from '../src/modules/labResults/domain/lifecycle.js'
import { resultLifecycle, referralLifecycle } from '../src/modules/labResults/domain/definitions.js'

const uri = process.env.PANACEA_TEST_MONGO_URI
assert.ok(uri && /^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(uri), 'explicit loopback-only synthetic Mongo URI required')
const phase = process.argv[2]
if (phase) {
  assert.ok(phase === 'write' || phase === 'read', 'known synthetic fixture phase required')
  assert.ok(process.env.MONGODB_URI === uri, 'store URI must match isolated fixture URI')
  assert.ok(/^panacea_test_[a-f0-9]{32}$/.test(process.env.MONGODB_DB ?? ''), 'random synthetic database required')
  const dataFile = process.env.PANACEA_DATA_FILE ?? ''
  assert.ok(basename(dataFile) === `${phase}.json`
    && dirname(dirname(dataFile)) === tmpdir()
    && basename(dirname(dataFile)).startsWith('panacea-mongo-restart-'), 'isolated temporary fixture file required')
  const store = await import('../src/store.js')
  await store.initStore()
  assert.equal(store.modePenyimpanan(), 'mongo', 'file fallback cannot pass Mongo acceptance')
  if (phase === 'write') {
    const service = await import('../src/modules/labResults/service/labResultsService.js')
    const ctx = { hasil: store.repoHasilLab(), rujukan: store.repoRujukan(),
      newId: (prefix: string) => `${prefix}-${randomUUID()}`, now: () => new Date('2026-10-10T08:00:00Z') }
    const actor = { actorId: 'synthetic-doctor', role: 'clinician' as const,
      tenantId: service.TENANT_PRAKTIK, authorizedClinician: true }
    const result = service.terimaHasil(ctx, actor, { patientId: 'synthetic-patient', source: 'lab-intake',
      item: { name: 'Synthetic lab fixture', value: 4.2, unit: 'fixture', collectedAt: '2026-10-09' } })
    const referral = service.buatRujukan(ctx, actor, { patientId: 'synthetic-patient', kind: 'lab', reason: 'Synthetic restart fixture', toFacility: 'Synthetic facility' })
    assert.ok(result.ok); assert.ok(referral.ok)
    assert.equal(service.majukanHasil(ctx, actor, result.value.id, { to: 'pending_review' }).ok, true)
    assert.equal(service.majukanRujukan(ctx, actor, referral.value.id, { to: 'accepted' }).ok, true)
    await store.flushStore()
    process.stdout.write('SYNTHETIC_WRITE_OK\n')
  } else {
    assert.equal(phase, 'read')
    const result = store.repoHasilLab().all(), referral = store.repoRujukan().all()
    assert.equal(result.length, 1); assert.equal(referral.length, 1)
    assert.equal(result[0].patientId, 'synthetic-patient')
    assert.equal(result[0].item.value, 4.2)
    assert.equal(result[0].status, 'pending_review')
    assert.equal(result[0].provenance.recordedBy, 'synthetic-doctor')
    assert.equal(result[0].trail.length, 1)
    assert.equal(verifyTrail(resultLifecycle, result[0].id, result[0].trail).ok, true)
    assert.equal(referral[0].patientId, 'synthetic-patient')
    assert.equal(referral[0].trail.length, 1)
    assert.equal(referral[0].status, 'accepted')
    assert.equal(verifyTrail(referralLifecycle, referral[0].id, referral[0].trail).ok, true)
    await store.flushStore()
    process.stdout.write('SYNTHETIC_RELOAD_OK\n')
  }
  process.exit(0) // Mongo connection remains open by design in the production store.
} else {
  const directory = mkdtempSync(join(tmpdir(), 'panacea-mongo-restart-'))
  const database = `panacea_test_${randomUUID().replaceAll('-', '')}`
  const client = new MongoClient(uri)
  try {
    const isolatedEnv = { ...process.env, MONGODB_URI: uri, MONGODB_DB: database,
      PANACEA_DATA_FILE: join(directory, 'write.json') }
    for (const [phaseName, overrides, expected] of [
      ['write', { MONGODB_URI: 'mongodb://untrusted.invalid:27017' }, 'store URI must match'],
      ['write', { MONGODB_DB: 'panaceamed' }, 'random synthetic database'],
      ['write', { PANACEA_DATA_FILE: join(directory, 'production.json') }, 'isolated temporary'],
      ['unknown', {}, 'known synthetic'],
    ] as const) {
      const rejected = spawnSync(process.execPath, ['--import', 'tsx', fileURLToPath(import.meta.url), phaseName], {
        env: { ...isolatedEnv, ...overrides }, encoding: 'utf8', timeout: 10_000,
      })
      assert.ok(rejected.status !== 0 && rejected.stderr.includes(expected), 'unsafe direct fixture phase must be rejected')
    }
    await client.connect()
    for (const command of ['write', 'read']) {
      const result = spawnSync(process.execPath, ['--import', 'tsx', fileURLToPath(import.meta.url), command], {
        env: { ...process.env, MONGODB_URI: uri, MONGODB_DB: database, PANACEA_DATA_FILE: join(directory, `${command}.json`) },
        encoding: 'utf8', timeout: 30_000,
      })
      assert.equal(result.status, 0, `${command} failed: ${result.stderr}\n${result.stdout}`)
      assert.ok(result.stdout.includes(command === 'write' ? 'SYNTHETIC_WRITE_OK' : 'SYNTHETIC_RELOAD_OK'))
    }
    console.log('mongoRestart: real Mongo, separate application processes, no file fallback; passed')
  } finally {
    await client.db(database).dropDatabase()
    await client.close()
    rmSync(directory, { recursive: true, force: true })
  }
}
