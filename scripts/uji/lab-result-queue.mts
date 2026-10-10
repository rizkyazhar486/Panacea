import assert from 'node:assert/strict'
import { parseLabResults, buildQueue, buildAdvance, formatValue, nextStatus, MAX_NOTE, RESULT_STATUSES } from '../../src/domains/lab-results/index.ts'

const rec = (o: Record<string, unknown> = {}, item: Record<string, unknown> = {}) => ({
  id: 'lr1', tenantId: 'praktik', patientId: 'p1', status: 'pending_review', trail: [],
  item: { name: 'HbA1c', value: 6.1, unit: '%', collectedAt: '2026-10-01T00:00:00Z', ...item },
  provenance: { source: 'lab-intake', recordedBy: 'u', recordedAt: '2026-10-01T02:00:00Z' }, ...o,
})
const ok = (raw: unknown) => { const r = parseLabResults(raw); assert.ok(r.ok); return r.ok ? r.records : [] }
const bad = (raw: unknown) => { const r = parseLabResults(raw); assert.equal(r.ok, false); return r }

// positif: parse menyalin hanya bidang kontrak (tenant/trail tidak bocor ke view-model)
const [a] = ok({ results: [rec()] })
assert.deepEqual(a, { id: 'lr1', patientId: 'p1', status: 'pending_review', source: 'lab-intake', recordedAt: '2026-10-01T02:00:00Z', item: { name: 'HbA1c', collectedAt: '2026-10-01T00:00:00Z', value: 6.1, unit: '%' } })
assert.deepEqual(ok({ results: [] }), [])
assert.equal(ok({ results: [rec({}, { value: undefined, valueText: 'Positive' })] })[0].item.valueText, 'Positive')

// negatif berpasangan: tiap aturan menolak, kasus tepat sebelahnya diterima
assert.equal(bad(null).reason, 'not-a-list'); assert.equal(bad({}).reason, 'not-a-list'); assert.equal(bad({ results: 'x' }).reason, 'not-a-list'); assert.equal(bad([rec()]).reason, 'not-a-list')
const rej = (o: Record<string, unknown>, item: Record<string, unknown> = {}) => { const r = bad({ results: [rec(), rec({ id: 'lr2', ...o }, item)] }); assert.equal(r.ok === false && r.reason, 'invalid-record'); assert.equal(r.ok === false && r.index, 1) }
rej({ status: 'approved' }); rej({ status: undefined }); rej({ id: '' }); rej({ patientId: '  ' })
rej({}, { name: '' }); rej({}, { value: undefined }); rej({}, { value: NaN }); rej({}, { value: Infinity }); rej({}, { value: undefined, valueText: ' ' })
rej({}, { collectedAt: 'bukan-tanggal' }); rej({ provenance: { source: 'ai', recordedAt: '2026-10-01T02:00:00Z' } }); rej({ provenance: { source: 'lab-intake', recordedAt: 'x' } }); rej({ item: null }); rej({ provenance: null })
assert.equal(ok({ results: [rec({}, { value: 0 })] })[0].item.value, 0) // nol adalah nilai sah, bukan "kosong"
for (const s of RESULT_STATUSES) assert.equal(ok({ results: [rec({ status: s })] })[0].status, s)

// antrean: urutan, umur, batas, determinisme
const now = new Date('2026-10-01T05:00:00Z')
const rows = buildQueue(ok({ results: [rec({ id: 'c', status: 'closed' }), rec({ id: 'b', status: 'received' }), rec({ id: 'a2', status: 'pending_review', provenance: { source: 'manual-entry', recordedAt: '2026-10-01T03:00:00Z' } }), rec({ id: 'a1', status: 'pending_review' })] }), now)
assert.deepEqual(rows.map((r) => r.id), ['a1', 'a2', 'b', 'c'])
assert.equal(rows[0].ageHours, 3); assert.equal(rows[0].needsReview, true); assert.equal(rows[2].needsReview, false)
assert.equal(buildQueue(ok({ results: [rec()] }), new Date('2026-10-01T02:00:00Z'))[0].ageHours, 0) // batas: tepat saat dicatat
assert.equal(buildQueue(ok({ results: [rec()] }), new Date('2026-10-01T01:59:59Z'))[0].ageHours, null) // jam rekam di masa depan: tak ditebak
assert.deepEqual(buildQueue(ok({ results: [rec()] }), now), buildQueue(ok({ results: [rec()] }), now))
const input = ok({ results: [rec({ id: 'x', status: 'closed' }), rec()] }); const before = JSON.stringify(input); buildQueue(input, now); assert.equal(JSON.stringify(input), before)

// langkah berikutnya mengikuti rantai server
assert.deepEqual(RESULT_STATUSES.map(nextStatus), ['pending_review', 'reviewed', 'communicated', 'closed', null])

// advance: expectedStatus selalu ikut; komunikasi hanya untuk communicated
assert.deepEqual(buildAdvance({ status: 'pending_review' }), { ok: true, request: { to: 'reviewed', expectedStatus: 'pending_review' } })
assert.deepEqual(buildAdvance({ status: 'reviewed' }, { channel: 'phone', note: '  Dihubungi  ' }), { ok: true, request: { to: 'communicated', expectedStatus: 'reviewed', communication: { channel: 'phone', note: 'Dihubungi' } } })
assert.deepEqual(buildAdvance({ status: 'closed' }), { ok: false, reason: 'no-next-step' })
assert.deepEqual(buildAdvance({ status: 'reviewed' }), { ok: false, reason: 'communication-required' })
assert.deepEqual(buildAdvance({ status: 'reviewed' }, { channel: 'sms', note: 'x' }), { ok: false, reason: 'invalid-channel' })
assert.deepEqual(buildAdvance({ status: 'reviewed' }, { channel: 'letter', note: '   ' }), { ok: false, reason: 'note-required' })
assert.equal(buildAdvance({ status: 'reviewed' }, { channel: 'letter', note: 'a'.repeat(MAX_NOTE) }).ok, true) // batas atas
assert.deepEqual(buildAdvance({ status: 'reviewed' }, { channel: 'letter', note: 'a'.repeat(MAX_NOTE + 1) }), { ok: false, reason: 'note-too-long' })
// komunikasi diabaikan pada langkah lain (tidak ikut terkirim)
assert.equal('communication' in (buildAdvance({ status: 'communicated' }, { channel: 'phone', note: 'x' }) as { request: object }).request, false)

assert.equal(formatValue({ name: 'a', value: 6.1, unit: '%', collectedAt: 'x' }), '6.1 %'); assert.equal(formatValue({ name: 'a', valueText: 'Positive', unit: '%', collectedAt: 'x' }), 'Positive'); assert.equal(formatValue({ name: 'a', value: 0, collectedAt: 'x' }), '0')
console.log('lab-result-queue: OK')
