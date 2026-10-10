import test from 'node:test'
import assert from 'node:assert/strict'
import { STRUCTURE_REVIEW_CHECKLIST, requiredCheckIds, reviewReadiness, buildReviewRecord, recordApproves, MAX_NOTES } from '../../src/domains/body-exposure/engine/structureReview.ts'

const NOW = '2026-10-10T12:00:00Z'
const allChecks = (method) => Object.fromEntries(requiredCheckIds(method).map((id) => [id, true]))
const input = (over = {}) => ({ body_id: 'B', structure_id: 'B.SKELETAL.RIB_5.L', asset_version: 'body_v013|model_segmented', method: 'model_segmented', decision: 'confirmed', checks: allChecks('model_segmented'), reviewer_id: 'dr-001', notes: '', ...over })
const ctx = (over = {}) => ({ authorizedReviewers: ['dr-001'], currentAssetVersion: 'body_v013|model_segmented', nowIso: NOW, ...over })

test('daftar_periksa_mengikuti_metode', () => {
  assert.ok(requiredCheckIds('model_segmented').includes('method_check'))
  assert.ok(!requiredCheckIds('manual_segmentation').includes('method_check'))
  assert.ok(requiredCheckIds('reference_stand_in').includes('stand_in'))
  assert.ok(!requiredCheckIds('model_segmented').includes('stand_in'))
  assert.equal(new Set(STRUCTURE_REVIEW_CHECKLIST.map((c) => c.id)).size, STRUCTURE_REVIEW_CHECKLIST.length)  // id unik
})

test('kesiapan_menyebut_butir_yang_belum', () => {
  const r = reviewReadiness({ identity: true }, 'manual_segmentation')
  assert.equal(r.complete, false); assert.ok(r.missing.includes('laterality') && !r.missing.includes('identity'))
  assert.equal(reviewReadiness(allChecks('manual_segmentation'), 'manual_segmentation').complete, true)
  assert.equal(reviewReadiness({ ...allChecks('manual_segmentation'), laterality: 'yes' }, 'manual_segmentation').complete, false)  // hanya true yang dihitung
})

test('catatan_confirmed_butuh_semua_butir_wajib', () => {
  const ok = buildReviewRecord(input(), NOW)
  assert.equal(ok.ok, true); assert.equal(ok.record.reviewed_at, '2026-10-10T12:00:00.000Z')
  const checks = allChecks('model_segmented'); delete checks.method_check
  const bad = buildReviewRecord(input({ checks }), NOW)
  assert.equal(bad.ok, false); assert.match(bad.error, /method_check/)
  // pasangan: keputusan "corrections_needed" boleh tanpa butir lengkap (hanya kondisi itu yang berbeda)
  assert.equal(buildReviewRecord(input({ checks, decision: 'corrections_needed' }), NOW).ok, true)
})

test('masukan_tidak_sah_ditolak_dengan_alasan', () => {
  for (const [over, re] of [[{ reviewer_id: '  ' }, /reviewer_id/], [{ asset_version: '' }, /asset_version/], [{ structure_id: '' }, /structure_id/], [{ method: 'x' }, /method/], [{ decision: 'approve' }, /decision/], [{ notes: 'x'.repeat(MAX_NOTES + 1) }, /notes/], [{ notes: 5 }, /notes/]]) {
    const r = buildReviewRecord(input(over), NOW); assert.equal(r.ok, false); assert.match(r.error, re)
  }
  assert.equal(buildReviewRecord(input(), 'not a date').ok, false)
  assert.equal(buildReviewRecord(input({ notes: 'x'.repeat(MAX_NOTES) }), NOW).ok, true)  // batas atas
})

test('persetujuan_hanya_bila_semua_syarat_terpenuhi', () => {
  const rec = buildReviewRecord(input(), NOW).record
  assert.equal(recordApproves(rec, ctx()).approved, true)
  // setiap syarat dilanggar satu per satu: ditolak, dan alasannya menyebut syarat itu
  assert.match(recordApproves(rec, ctx({ authorizedReviewers: [] })).reason, /authorised/)
  assert.match(recordApproves(rec, ctx({ authorizedReviewers: ['dr-002'] })).reason, /authorised/)
  assert.match(recordApproves(rec, ctx({ currentAssetVersion: 'body_v014|model_segmented' })).reason, /different asset version/)
  assert.match(recordApproves({ ...rec, decision: 'corrections_needed' }, ctx()).reason, /not "confirmed"/)
  assert.match(recordApproves({ ...rec, decision: 'cannot_assess' }, ctx()).reason, /not "confirmed"/)
  assert.match(recordApproves({ ...rec, reviewer_id: '' }, ctx()).reason, /not identified/)
  assert.match(recordApproves({ ...rec, checks: { identity: true } }, ctx()).reason, /incomplete/)
  assert.match(recordApproves({ ...rec, reviewed_at: '2026-10-11T00:00:00Z' }, ctx()).reason, /future/)
  assert.match(recordApproves({ ...rec, reviewed_at: 'soon' }, ctx()).reason, /invalid review time/)
  assert.match(recordApproves(rec, ctx({ nowIso: 'x' })).reason, /invalid review time/)
  assert.match(recordApproves({ ...rec, schema: 2 }, ctx()).reason, /schema/)
  assert.match(recordApproves({ ...rec, method: 'telepathy' }, ctx()).reason, /unknown method/)
})

test('masukan_bukan_objek_gagal_tertutup', () => {
  for (const v of [null, undefined, 'confirmed', 42, []]) assert.equal(recordApproves(v, ctx()).approved, false)
})

test('batas_waktu_tepat_sekarang_diterima', () => {
  const rec = buildReviewRecord(input(), NOW).record
  assert.equal(recordApproves(rec, ctx({ nowIso: rec.reviewed_at })).approved, true)  // sama dengan sekarang: boleh
  assert.equal(recordApproves(rec, ctx({ nowIso: '2026-10-10T11:59:59Z' })).approved, false)  // sedetik sebelum: masa depan
})
