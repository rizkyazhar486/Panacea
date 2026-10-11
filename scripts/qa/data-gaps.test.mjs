import test from 'node:test'
import assert from 'node:assert/strict'
import { DATA_GAPS, validateGaps, GAP_STATUS_LABEL } from '../../src/domains/body-exposure/engine/dataGaps.ts'

const ok = { id: 'x', kind: 'motion', label: 'L', status: 'no_source', reason: 'r', unblock: 'u' }

test('daftar_celah_bawaan_sah_dan_mencakup_yang_diaudit', () => {
  assert.deepEqual(validateGaps(DATA_GAPS), [])
  for (const id of ['heartbeat', 'pregnancy', 'older_adult', 'fetal_skeleton_skin', 'hand_bones_individual', 'clinical_review']) assert.ok(DATA_GAPS.some((g) => g.id === id), id)
  for (const g of DATA_GAPS) assert.ok(GAP_STATUS_LABEL[g.status], g.id)
})

test('celah_tanpa_alasan_atau_jalan_keluar_ditolak_dengan_nama_bidang', () => {
  for (const k of ['label', 'reason', 'unblock']) assert.deepEqual(validateGaps([{ ...ok, [k]: '  ' }]), [`x: ${k} missing`])
  assert.deepEqual(validateGaps([{ ...ok, reason: undefined }]), ['x: reason missing'])
})

test('kelas_atau_status_tidak_dikenal_dan_id_ganda_ditolak', () => {
  assert.deepEqual(validateGaps([{ ...ok, kind: 'surgery' }]), ['x: unknown kind'])
  assert.deepEqual(validateGaps([{ ...ok, status: 'done' }]), ['x: unknown status'])
  assert.deepEqual(validateGaps([ok, ok]), ['x: duplicate id'])
  assert.deepEqual(validateGaps([{ ...ok, id: '' }]), ['gap without id'])
})

test('celah_valid_tunggal_diterima_dan_tidak_ada_pengganti_dewasa', () => {
  assert.deepEqual(validateGaps([ok]), [])
  const older = DATA_GAPS.find((g) => g.id === 'older_adult')
  assert.match(older.reason, /never rescaled/)
  assert.equal(DATA_GAPS.find((g) => g.id === 'clinical_review').status, 'blocked_review')
})
