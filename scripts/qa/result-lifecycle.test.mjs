import test from 'node:test'
import assert from 'node:assert/strict'
import { transitionResult, verifyResultAuditTrail, canReadResult } from '../../src/domains/clinical-operations/model/resultLifecycle.ts'

const T = 'ten-1'
const clin = { actorId: 'dr-1', role: 'clinician', tenantId: T, authorizedClinician: true }
const nurse = { actorId: 'n-1', role: 'nurse', tenantId: T }
const step = (current, target, actor, at, trail = []) =>
  transitionResult({ resultId: 'r-1', tenantId: T, current, target, actor, at, trail })

test('menerima_transisi_berurutan_dan_mencatat_audit', () => {
  const r = step('received', 'pending_review', nurse, '2026-10-10T08:00:00.000Z')
  assert.equal(r.ok, true); assert.equal(r.status, 'pending_review')
  assert.deepEqual(r.entry, { seq: 1, resultId: 'r-1', actorId: 'n-1', role: 'nurse', at: '2026-10-10T08:00:00.000Z', from: 'received', to: 'pending_review' })
  assert.ok(Object.isFrozen(r.entry))
})

test('menolak_lompat_mundur_dan_status_sama', () => {
  for (const [c, t] of [['received', 'reviewed'], ['pending_review', 'closed'], ['reviewed', 'pending_review'], ['closed', 'closed']]) {
    assert.deepEqual(step(c, t, clin, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'not-next-step' })
  }
})

test('menolak_status_tak_dikenal', () => {
  assert.deepEqual(step('received', 'archived', clin, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'unknown-status' })
  assert.deepEqual(step('bogus', 'pending_review', clin, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'unknown-status' })
})

test('tinjauan_hanya_klinisi_terotorisasi', () => {
  assert.deepEqual(step('pending_review', 'reviewed', nurse, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'role-not-permitted' })
  assert.deepEqual(step('pending_review', 'reviewed', { ...clin, authorizedClinician: false }, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'clinician-not-authorized' })
  assert.deepEqual(step('pending_review', 'reviewed', { ...clin, authorizedClinician: undefined }, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'clinician-not-authorized' })
  assert.equal(step('pending_review', 'reviewed', clin, '2026-10-10T08:00:00.000Z').ok, true) // pasangan
})

test('sistem_tidak_dapat_mencatat_komunikasi_atau_penutupan', () => {
  const sys = { actorId: 'bot', role: 'system', tenantId: T }
  assert.deepEqual(step('reviewed', 'communicated', sys, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'system-cannot-record' })
  assert.deepEqual(step('communicated', 'closed', sys, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'system-cannot-record' })
  assert.equal(step('received', 'pending_review', sys, '2026-10-10T08:00:00.000Z').ok, true) // intake otomatis sah
  assert.equal(step('communicated', 'closed', nurse, '2026-10-10T08:00:00.000Z').ok, true)
})

test('pasien_dan_peran_tak_berwenang_ditolak_menulis', () => {
  const pat = { actorId: 'p-1', role: 'patient', tenantId: T, patientId: 'p-1' }
  assert.deepEqual(step('reviewed', 'communicated', pat, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'role-not-permitted' })
  assert.deepEqual(step('received', 'pending_review', pat, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'role-not-permitted' })
})

test('menolak_tenant_lain', () => {
  assert.deepEqual(step('pending_review', 'reviewed', { ...clin, tenantId: 'ten-2' }, '2026-10-10T08:00:00.000Z'), { ok: false, reason: 'tenant-mismatch' })
})

test('menolak_waktu_tak_sah_dan_mundur_pada_batas', () => {
  for (const at of ['', 'kemarin', '2026-13-45T00:00:00Z', '2026-10-10']) {
    assert.deepEqual(step('received', 'pending_review', nurse, at), { ok: false, reason: 'invalid-timestamp' }, at)
  }
  const first = step('received', 'pending_review', nurse, '2026-10-10T08:00:00.000Z').entry
  assert.deepEqual(step('pending_review', 'reviewed', clin, '2026-10-10T07:59:59.999Z', [first]), { ok: false, reason: 'time-before-last-entry' })
  const same = step('pending_review', 'reviewed', clin, '2026-10-10T08:00:00.000Z', [first])
  assert.equal(same.ok, true); assert.equal(same.entry.seq, 2) // batas tepat sama sah
})

test('jejak_utuh_menghasilkan_status_akhir_dan_deterministik', () => {
  const trail = []
  let cur = 'received'
  for (const [t, a] of [['pending_review', nurse], ['reviewed', clin], ['communicated', nurse], ['closed', clin]]) {
    const r = step(cur, t, a, '2026-10-10T08:00:00.000Z', trail); assert.equal(r.ok, true); trail.push(r.entry); cur = r.status
  }
  assert.deepEqual(verifyResultAuditTrail('r-1', trail), { ok: true, status: 'closed' })
  assert.deepEqual(verifyResultAuditTrail('r-1', trail), verifyResultAuditTrail('r-1', trail))
  assert.deepEqual(verifyResultAuditTrail('r-1', []), { ok: true, status: 'received' })
})

test('mendeteksi_jejak_rusak', () => {
  const e = (seq, from, to, at = '2026-10-10T08:00:00.000Z', resultId = 'r-1') => ({ seq, resultId, actorId: 'a', role: 'nurse', at, from, to })
  assert.deepEqual(verifyResultAuditTrail('r-1', [e(2, 'received', 'pending_review')]), { ok: false, issues: ['seq-gap'] })
  assert.deepEqual(verifyResultAuditTrail('r-1', [e(1, 'pending_review', 'reviewed')]), { ok: false, issues: ['chain-broken'] })
  assert.deepEqual(verifyResultAuditTrail('r-1', [e(1, 'received', 'reviewed')]), { ok: false, issues: ['not-forward'] })
  assert.deepEqual(verifyResultAuditTrail('r-1', [e(1, 'received', 'pending_review', '2026-10-10T09:00:00.000Z'), e(2, 'pending_review', 'reviewed', '2026-10-10T08:00:00.000Z')]), { ok: false, issues: ['time-regression'] })
  assert.deepEqual(verifyResultAuditTrail('r-1', [e(1, 'received', 'pending_review', undefined, 'r-9')]), { ok: false, issues: ['wrong-result'] })
  assert.deepEqual(verifyResultAuditTrail('r-1', [e(1, 'received', 'archived')]), { ok: false, issues: ['unknown-status'] })
})

test('akses_baca_rbac_tenant_dan_pasien_sendiri', () => {
  const res = { tenantId: T, patientId: 'p-1' }
  assert.equal(canReadResult(clin, res), true)
  assert.equal(canReadResult({ ...clin, tenantId: 'ten-2' }, res), false)
  assert.equal(canReadResult({ actorId: 'p-1', role: 'patient', tenantId: T, patientId: 'p-1' }, res), true)
  assert.equal(canReadResult({ actorId: 'p-2', role: 'patient', tenantId: T, patientId: 'p-2' }, res), false)
  assert.equal(canReadResult({ actorId: 'p-1', role: 'patient', tenantId: T }, res), false)
  assert.equal(canReadResult({ actorId: 'p-1', role: 'patient', tenantId: 'ten-2', patientId: 'p-1' }, res), false)
  assert.equal(canReadResult({ actorId: 'bot', role: 'system', tenantId: T }, res), false)
  assert.equal(canReadResult({ actorId: 'x', role: 'visitor', tenantId: T }, res), false)
})
