// ENG-E4-03: harness retensi diparameterkan berkas kebijakan. Semua angka di sini sintetis; kebijakan produksi (governance/RETENTION_POLICY.json) tetap unset sampai EXT-E4-A.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyRetention, DAY_MS, MAX_DAYS, planRetention, validatePolicy } from '../src/modules/retention/domain/retentionPolicy.js'
import type { AuditRecord, RetentionStore, StoredRecord } from '../src/modules/retention/domain/retentionPolicy.js'

const NOW = new Date('2026-10-24T00:00:00.000Z')
const ago = (days: number, extraMs = 0) => new Date(NOW.getTime() - days * DAY_MS - extraMs).toISOString()
const policy = (over: Record<string, unknown> = {}) => ({ schemaVersion: 1, status: 'test', rules: { 'synthetic-notes': { maxAgeDays: 30 }, 'synthetic-logs': { maxAgeDays: 7 } }, audit: { maxAgeDays: null }, ...over })

function memoryStore(data: Record<string, StoredRecord[]>, audit: AuditRecord[] = []) {
  const calls: string[] = []
  const store: RetentionStore = {
    list: (c) => [...(data[c] ?? [])],
    remove: (c, id) => { calls.push(`remove:${c}:${id}`); data[c] = (data[c] ?? []).filter((r) => r.id !== id) },
    listAudit: () => [...audit],
    appendAudit: (r) => { calls.push(`audit:${r.entry.recordId}`); audit.push(r) },
    removeAudit: (id) => { calls.push(`auditRemove:${id}`); audit.splice(audit.findIndex((a) => a.id === id), 1) },
  }
  return { store, data, audit, calls }
}
const fresh = () => memoryStore({
  'synthetic-notes': [{ id: 'n-old', createdAt: ago(31) }, { id: 'n-edge', createdAt: ago(30) }, { id: 'n-new', createdAt: ago(1) }, { id: 'n-nodate', createdAt: undefined }, { id: 'n-bad', createdAt: 'not-a-date' }],
  'synthetic-logs': [{ id: 'l-old', createdAt: ago(8) }, { id: 'l-new', createdAt: ago(2) }],
  'untouched-people': [{ id: 'p-ancient', createdAt: ago(9999) }],
})

// positif: yang lebih tua dari batas dihapus, yang di batas atau lebih muda disimpan
{
  const m = fresh()
  const r = applyRetention(m.store, policy(), NOW)
  assert.ok(r.ok)
  assert.equal(r.deleted, 2)
  assert.deepEqual(m.data['synthetic-notes'].map((x) => x.id).sort(), ['n-bad', 'n-edge', 'n-new', 'n-nodate'])
  assert.deepEqual(m.data['synthetic-logs'].map((x) => x.id), ['l-new'])
}

// batas: tepat 30 hari disimpan, 1 ms lebih tua dihapus (pasangan hanya beda 1 ms)
{
  const m = memoryStore({ 'synthetic-notes': [{ id: 'exact', createdAt: ago(30) }, { id: 'over', createdAt: ago(30, 1) }] })
  const r = applyRetention(m.store, policy(), NOW)
  assert.ok(r.ok)
  assert.deepEqual(m.data['synthetic-notes'].map((x) => x.id), ['exact'])
}

// tidak menyentuh koleksi tanpa aturan
{
  const m = fresh()
  applyRetention(m.store, policy(), NOW)
  assert.equal(m.data['untouched-people'].length, 1)
}

// umur tidak dapat dibuktikan: tidak dihapus, dilaporkan
{
  const m = fresh()
  const r = applyRetention(m.store, policy(), NOW)
  assert.ok(r.ok)
  assert.deepEqual(r.plan.unknownAge.map((u) => u.recordId).sort(), ['n-bad', 'n-nodate'])
}

// jejak audit: setiap penghapusan punya satu entri, ditulis SEBELUM rekaman dihapus, tanpa isi rekaman
{
  const m = fresh()
  applyRetention(m.store, policy(), NOW)
  assert.equal(m.audit.length, 2)
  assert.deepEqual(m.audit.map((a) => a.entry.recordId).sort(), ['l-old', 'n-old'])
  const e = m.audit.find((a) => a.entry.recordId === 'n-old')!.entry
  assert.deepEqual(e, { at: NOW.toISOString(), action: 'retention.delete', collection: 'synthetic-notes', recordId: 'n-old', ageDays: 31, ruleDays: 30 })
  assert.ok(m.calls.indexOf('audit:n-old') < m.calls.indexOf('remove:synthetic-notes:n-old'))
}

// audit tidak ikut terhapus bila audit.maxAgeDays null; dipangkas hanya bila lebih tua dari batas audit
{
  const old: AuditRecord = { id: 'a-old', createdAt: ago(400), entry: { at: ago(400), action: 'retention.delete', collection: 'synthetic-notes', recordId: 'x', ageDays: 1, ruleDays: 1 } }
  const keep = memoryStore({}, [old])
  const r1 = applyRetention(keep.store, policy(), NOW)
  assert.ok(r1.ok && r1.auditPruned === 0)
  assert.equal(keep.audit.length, 1, 'audit null tidak boleh dipangkas')
  const prune = memoryStore({}, [{ ...old }, { ...old, id: 'a-edge', createdAt: ago(365) }, { ...old, id: 'a-new', createdAt: ago(10) }])
  const r2 = applyRetention(prune.store, policy({ audit: { maxAgeDays: 365 } }), NOW)
  assert.ok(r2.ok)
  assert.deepEqual(prune.audit.map((a) => a.id).sort(), ['a-edge', 'a-new'])
}

// kontrol negatif: rekaman kedaluwarsa yang masih terbaca setelah sapuan HARUS menggagalkan harness
{
  const m = fresh()
  const brokenStore: RetentionStore = { ...m.store, remove: () => { /* penghapusan gagal diam-diam */ } }
  applyRetention(brokenStore, policy(), NOW)
  const stillReadable = m.store.list('synthetic-notes').some((r) => r.id === 'n-old')
  assert.equal(stillReadable, true, 'pemeriksa harus melihat rekaman yang tidak terhapus')
  const harnessVerdict = (store: RetentionStore) => !store.list('synthetic-notes').some((r) => r.id === 'n-old')
  assert.equal(harnessVerdict(brokenStore), false, 'kontrol negatif: sapuan rusak harus dinilai gagal')
  const good = fresh()
  applyRetention(good.store, policy(), NOW)
  assert.equal(harnessVerdict(good.store), true)
}

// kebijakan tidak sah: ditolak, tidak ada efek samping
const bad: Array<[string, unknown, string]> = [
  ['bukan objek', null, 'policy-not-object'],
  ['array', [], 'policy-not-object'],
  ['versi salah', policy({ schemaVersion: 2 }), 'schema-version-invalid'],
  ['status salah', policy({ status: 'live' }), 'status-invalid'],
  ['hari nol', policy({ rules: { 'synthetic-notes': { maxAgeDays: 0 } } }), 'days-invalid:synthetic-notes'],
  ['hari negatif', policy({ rules: { 'synthetic-notes': { maxAgeDays: -1 } } }), 'days-invalid:synthetic-notes'],
  ['hari pecahan', policy({ rules: { 'synthetic-notes': { maxAgeDays: 1.5 } } }), 'days-invalid:synthetic-notes'],
  ['hari NaN', policy({ rules: { 'synthetic-notes': { maxAgeDays: NaN } } }), 'days-invalid:synthetic-notes'],
  ['hari Infinity', policy({ rules: { 'synthetic-notes': { maxAgeDays: Infinity } } }), 'days-invalid:synthetic-notes'],
  ['hari teks', policy({ rules: { 'synthetic-notes': { maxAgeDays: '30' } } }), 'days-invalid:synthetic-notes'],
  ['hari di atas maksimum', policy({ rules: { 'synthetic-notes': { maxAgeDays: MAX_DAYS + 1 } } }), 'days-invalid:synthetic-notes'],
  ['nama koleksi liar', policy({ rules: { '../etc': { maxAgeDays: 5 } } }), 'collection-name-invalid:../etc'],
  ['aturan punya bidang asing', policy({ rules: { 'synthetic-notes': { maxAgeDays: 5, force: true } } }), 'rule-invalid:synthetic-notes'],
  ['bidang asing', policy({ extra: 1 }), 'unknown-field:extra'],
  ['audit tanpa nilai', policy({ audit: {} }), 'audit-days-invalid'],
  ['unset dengan nilai', policy({ status: 'unset' }), 'unset-with-values'],
  ['approved tanpa penyetuju', policy({ status: 'approved' }), 'approved-without-approver'],
  ['approved tanpa tanggal', policy({ status: 'approved', approvedBy: 'owner' }), 'approved-without-date'],
  ['approved tanpa rujukan', policy({ status: 'approved', approvedBy: 'owner', approvedAt: '2026-10-24' }), 'approved-without-decision-ref'],
  ['bidang persetujuan pada status test', policy({ approvedBy: 'owner' }), 'approval-fields-without-approved-status'],
]
for (const [name, p, code] of bad) {
  const m = fresh()
  const before = JSON.stringify(m.data)
  const r = applyRetention(m.store, p, NOW)
  assert.equal(r.ok, false, name)
  assert.ok(!r.ok && r.errors.includes(code), `${name}: ${JSON.stringify(r)}`)
  assert.equal(JSON.stringify(m.data), before, `${name}: data tidak boleh berubah`)
  assert.deepEqual(m.calls, [], `${name}: tidak ada tulis/hapus`)
}

// pasangan sah: hanya satu syarat dipenuhi -> diterima
assert.equal(validatePolicy(policy({ status: 'approved', approvedBy: 'owner', approvedAt: '2026-10-24', decisionRef: 'EXT-E4-A' })).ok, true)
assert.equal(validatePolicy(policy({ rules: { 'synthetic-notes': { maxAgeDays: MAX_DAYS } } })).ok, true)
assert.equal(validatePolicy(policy({ rules: { 'synthetic-notes': { maxAgeDays: 1 } } })).ok, true)

// waktu tidak sah ditolak
for (const now of [new Date('x'), 'now' as unknown as Date]) {
  const m = fresh()
  const r = planRetention({ policy: policy(), data: { 'synthetic-notes': m.data['synthetic-notes'] }, audit: [], now })
  assert.deepEqual(r, { ok: false, errors: ['now-invalid'] })
}

// nilai null pada koleksi beraturan: tidak ada yang dihapus, dilaporkan sebagai belum ditetapkan
{
  const m = fresh()
  const r = applyRetention(m.store, policy({ rules: { 'synthetic-notes': { maxAgeDays: null }, 'synthetic-logs': { maxAgeDays: 7 } } }), NOW)
  assert.ok(r.ok)
  assert.deepEqual(r.plan.unsetCollections, ['synthetic-notes'])
  assert.equal(m.data['synthetic-notes'].length, 5)
}

// deterministik: dua kali jalan hasil identik
{
  const a = applyRetention(fresh().store, policy(), NOW), b = applyRetention(fresh().store, policy(), NOW)
  assert.deepEqual(a, b)
}

// kebijakan produksi: sah, unset, tidak menghapus apa pun
{
  const prod = JSON.parse(readFileSync(new URL('../../governance/RETENTION_POLICY.json', import.meta.url), 'utf8'))
  const v = validatePolicy(prod)
  assert.ok(v.ok)
  assert.equal(prod.status, 'unset')
  const m = fresh()
  const r = applyRetention(m.store, prod, NOW)
  assert.ok(r.ok && r.deleted === 0 && m.audit.length === 0)
  // pasangan: berkas produksi yang diisi angka tanpa persetujuan ditolak
  assert.equal(validatePolicy({ ...prod, rules: { 'synthetic-notes': { maxAgeDays: 30 } } }).ok, false)
}
console.log('retention.uji: ok')
