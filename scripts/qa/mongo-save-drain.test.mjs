import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { createHash } from 'node:crypto'
import ts from 'typescript'
import { dokumenInti, simpanIrisan, muatIrisan, VERSI_IRISAN } from '../../server/src/irisanPenyimpanan.ts'

// Execute the production scheduling functions, replacing only disk, clock and
// Mongo I/O boundaries. No application module or real patient database is loaded.
function harness({ mongo = true } = {}) {
  const source = ts.createSourceFile('store.ts', readFileSync(new URL('../../server/src/store.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
  const names = new Set(['save', 'flushSimpan', 'simpanSekarang', 'simpanMongo', 'flushStore', 'antrikanSimpanMongo'])
  const variables = new Set(['saveTimer', 'simpanTertunda', 'mongoSaveTail', 'irisanAktif', 'sidikIntiTertulis'])
  const code = source.statements.filter(node => ts.isFunctionDeclaration(node) ? names.has(node.name?.text)
    : ts.isVariableStatement(node) && node.declarationList.declarations.some(d => variables.has(d.name.getText(source))))
    .map(node => node.getText(source)).join('\n')
  const timers = new Map(), columns = new Map()
  let serial = 0, hold, started, active = 0, maximum = 0, writes = 0
  const context = vm.createContext({ exports: {}, Promise, Buffer, console, createHash, clearTimeout: id => timers.delete(id),
    setTimeout: fn => { const id = ++serial; timers.set(id, fn); return id }, queueMicrotask,
    db: { clinical: { hasilLab: {}, rujukanKlinis: {} } }, DB_PATH: 'synthetic', statistikSimpan: { serialisasi: 0 },
    isiConnect: () => ({}), tulisAtomik: () => {}, catatBerhasil: () => {}, catatGagal: () => {},
    BATAS_DOKUMEN_MONGO: 16 * 1024 * 1024, dokumenInti, VERSI_IRISAN,
    mongoCol: mongo ? { async updateOne() {} } : null,
    mongoDb: { collection(name) {
      if (!columns.has(name)) columns.set(name, new Map())
      const rows = columns.get(name)
      return { async bulkWrite(ops) { for (const op of ops) rows.set(op.updateOne.filter._id, structuredClone(op.updateOne.update.$set)) },
        async deleteMany(filter) { for (const key of rows.keys()) if (!filter._id.$nin.includes(key)) rows.delete(key) },
        find() { return { async toArray() { return [...rows].map(([id, row]) => ({ _id: id, ...structuredClone(row) })) } } } }
    } },
    async simpanIrisan(database, state) {
      writes++; active++; maximum = Math.max(maximum, active)
      const snapshot = structuredClone(state)
      const wait = hold; hold = undefined
      started?.(); started = undefined
      try { if (wait) await wait; await simpanIrisan(database, snapshot) } finally { active-- }
    },
  })
  vm.runInContext(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context)
  return { context, columns, get active() { return active }, get maximum() { return maximum }, get writes() { return writes },
    async suspend() { let release; hold = new Promise(resolve => { release = resolve }); const began = new Promise(resolve => { started = resolve }); return { release, began } },
    save() { vm.runInContext('save(); flushSimpan()', context) },
    fire() { for (const [id, fn] of [...timers]) { timers.delete(id); fn() } },
    flush() { return context.exports.flushStore() },
    async reload() { return muatIrisan(context.mongoDb) },
  }
}
const tick = () => new Promise(resolve => setImmediate(resolve))

test('shutdown drain waits for an already active Mongo save', async () => {
  const h = harness(), paused = await h.suspend()
  h.save(); h.fire(); await paused.began
  let drained = false
  const flush = h.flush().then(() => { drained = true })
  await tick()
  assert.equal(drained, false, 'SIGTERM must not exit before the active write')
  paused.release(); await flush
  assert.equal(h.active, 0)
})

test('serialized saves cannot let an older snapshot delete newer lab/referral records', async () => {
  const h = harness(), paused = await h.suspend()
  h.save(); h.fire(); await paused.began
  h.context.db.clinical.hasilLab['synthetic-result'] = { id: 'synthetic-result', patientId: 'synthetic-patient' }
  h.context.db.clinical.rujukanKlinis['synthetic-referral'] = { id: 'synthetic-referral', patientId: 'synthetic-patient' }
  h.save(); h.fire(); await tick()
  const draining = h.flush()
  paused.release(); await draining
  assert.equal(h.maximum, 1, 'all Mongo writes must be single flight')
  const loaded = await h.reload()
  assert.equal(Object.keys(loaded.data.clinical.hasilLab).length, 1)
  assert.equal(Object.keys(loaded.data.clinical.rujukanKlinis).length, 1)
})

test('drain includes a mutation arriving while the active save is awaited', async () => {
  const h = harness(), paused = await h.suspend()
  h.save(); h.fire(); await paused.began
  const draining = h.flush()
  h.context.db.clinical.hasilLab['during-drain'] = { id: 'during-drain' }
  h.save()
  paused.release(); await draining
  assert.equal(h.maximum, 1)
  assert.equal(Object.keys((await h.reload()).data.clinical.hasilLab).length, 1)
})

test('queued debounce is flushed immediately and file-only mode still drains', async () => {
  const h = harness()
  h.context.db.clinical.hasilLab.queued = { id: 'queued' }
  h.save(); await h.flush()
  assert.equal(Object.keys((await h.reload()).data.clinical.hasilLab).length, 1)
  const file = harness({ mongo: false })
  vm.runInContext('save()', file.context)
  await file.flush()
  assert.equal(file.context.statistikSimpan.serialisasi, 1)
  assert.equal(file.active, 0)
})

test('rapid requests coalesce and simultaneous drain callers await the same active write', async () => {
  const h = harness(), paused = await h.suspend()
  h.save(); h.save(); h.save(); h.fire(); await paused.began
  let completed = 0
  const drains = [h.flush(), h.flush()].map(p => p.then(() => { completed++ }))
  await tick(); assert.equal(completed, 0)
  paused.release(); await Promise.all(drains)
  assert.equal(h.maximum, 1)
  assert.equal(completed, 2)
  assert.equal(h.writes, 1, 'rapid requests retain the existing debounce coalescing')
})

test('save failure remains observable and does not prevent a later queued recovery', async () => {
  const h = harness()
  let failures = 0, writes = 0
  h.context.catatGagal = () => { failures++ }
  h.context.console = { error() {} }
  const persist = h.context.simpanIrisan
  h.context.simpanIrisan = async (...args) => {
    if (++writes === 1) throw new Error('synthetic unavailable Mongo')
    return persist(...args)
  }
  h.save(); await h.flush()
  assert.equal(failures, 1)
  h.context.db.clinical.hasilLab.recovered = { id: 'recovered' }
  h.save(); await h.flush()
  assert.equal(failures, 1)
  assert.equal((await h.reload()).data.clinical.hasilLab.recovered.id, 'recovered')
})

test('unchanged core document is not re-sent, a changed or previously failed one is', async () => {
  const h = harness()
  let sent = 0, failNext = false
  h.context.mongoCol = { async updateOne() { if (failNext) { failNext = false; throw new Error('synthetic unavailable Mongo') } sent++ } }
  h.context.console = { error() {} }
  h.context.db.sintetisInti = { n: 1 }
  h.save(); await h.flush()
  assert.equal(sent, 1, 'first save writes the core document')
  h.save(); await h.flush()
  assert.equal(sent, 1, 'identical core document is not sent again')
  h.context.db.sintetisInti = { n: 2 }
  h.save(); await h.flush()
  assert.equal(sent, 2, 'a changed core document is sent')
  h.context.db.sintetisInti = { n: 3 }
  failNext = true
  h.save(); await h.flush()
  assert.equal(sent, 2, 'failed write is not counted as sent')
  h.save(); await h.flush()
  assert.equal(sent, 3, 'after a failed write the same document is sent again')
})
