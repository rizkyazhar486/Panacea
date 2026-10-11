import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateResultClosure } from '../../src/domains/clinical-operations/model/resultClosure.ts'

const NOW = '2026-10-10T12:00:00.000Z'
const person = (at, over = {}) => ({ at, actorId: 'dr-1', recordedBy: 'person', ...over })
const clinician = (at, over = {}) => person(at, { authorizedClinician: true, ...over })
const all = { review: true, explanation: true, 'follow-up': true }
const rec = (over = {}) => ({
  resultId: 'r-1', patientId: 'p-1',
  resultedAt: '2026-10-08T08:00:00.000Z', dueBy: '2026-10-09T08:00:00.000Z',
  required: all,
  review: clinician('2026-10-08T09:00:00.000Z'),
  explanation: person('2026-10-08T10:00:00.000Z'),
  followUp: { evidence: person('2026-10-08T11:00:00.000Z') },
  ...over,
})
const run = (results, over = {}) => evaluateResultClosure({
  targetPatientId: 'p-1', evaluatedAt: NOW, windowStart: '2026-10-01T00:00:00.000Z', windowEnd: '2026-10-10T23:59:59.000Z',
  validNotApplicableReasons: ['patient-deceased', 'transferred-out'], results, ...over,
})

test('menutup_hasil_bila_semua_langkah_wajib_dicatat_orang', () => {
  const r = run([rec()])
  assert.equal(r.items[0].state, 'closed'); assert.deepEqual(r.items[0].unmetSteps, [])
  assert.equal(r.dueCount, 1); assert.equal(r.closedCount, 1); assert.equal(r.closureRate, 1); assert.equal(r.unmeasuredReason, null)
})

test('menghitung_rasio_tutup_dan_menampilkan_yang_lewat_tempo', () => {
  const r = run([rec(), rec({ resultId: 'r-2', explanation: undefined })])
  assert.equal(r.dueCount, 2); assert.equal(r.closedCount, 1); assert.equal(r.closureRate, 0.5)
  assert.deepEqual(r.overdueIds, ['r-2']); assert.deepEqual(r.items[1].unmetSteps, ['explanation'])
})

test('catatan_atau_notifikasi_buatan_sistem_tidak_menutup_tugas', () => {
  const sys = run([rec({ explanation: person('2026-10-08T10:00:00.000Z', { recordedBy: 'system' }) })])
  assert.equal(sys.items[0].state, 'overdue'); assert.deepEqual(sys.items[0].unmetSteps, ['explanation']); assert.equal(sys.closureRate, 0)
  // pasangan: kondisi yang sama tetapi dicatat orang → tutup
  assert.equal(run([rec()]).items[0].state, 'closed')
  assert.deepEqual(run([rec({ followUp: { evidence: person('2026-10-08T11:00:00.000Z', { recordedBy: 'system' }) } })]).items[0].unmetSteps, ['follow-up'])
})

test('tinjauan_tanpa_klinisi_terotorisasi_tidak_menutup', () => {
  const r = run([rec({ review: person('2026-10-08T09:00:00.000Z', { authorizedClinician: false }) })])
  assert.deepEqual(r.items[0].unmetSteps, ['review'])
  assert.deepEqual(run([rec({ review: person('2026-10-08T09:00:00.000Z') })]).items[0].unmetSteps, ['review']) // flag hilang = tidak otorisasi
  assert.equal(run([rec({ review: clinician('2026-10-08T09:00:00.000Z') })]).items[0].state, 'closed')
})

test('pelaku_kosong_tidak_menutup_langkah', () => {
  assert.deepEqual(run([rec({ explanation: person('2026-10-08T10:00:00.000Z', { actorId: '   ' }) })]).items[0].unmetSteps, ['explanation'])
  assert.deepEqual(run([rec({ explanation: person('2026-10-08T10:00:00.000Z', { actorId: '' }) })]).items[0].unmetSteps, ['explanation'])
})

test('langkah_yang_tidak_diwajibkan_tidak_menahan_penutupan', () => {
  const r = run([rec({ required: { review: true, explanation: false, 'follow-up': false }, explanation: undefined, followUp: undefined })])
  assert.equal(r.items[0].state, 'closed')
  assert.deepEqual(run([rec({ required: all, explanation: undefined, followUp: undefined })]).items[0].unmetSteps, ['explanation', 'follow-up'])
  // tinjauan juga hanya menahan bila diwajibkan (pasangan: sama persis kecuali flag wajib)
  const noReview = run([rec({ required: { review: false, explanation: true, 'follow-up': true }, review: undefined })])
  assert.equal(noReview.items[0].state, 'closed')
  assert.deepEqual(run([rec({ review: undefined })]).items[0].unmetSteps, ['review'])
})

test('alasan_tidak_berlaku_hanya_sah_dari_daftar_yang_ditetapkan', () => {
  const ok = run([rec({ followUp: { notApplicableReason: 'patient-deceased' } })])
  assert.equal(ok.items[0].state, 'closed')
  const bad = run([rec({ followUp: { notApplicableReason: 'forgot' } })])
  assert.equal(bad.items[0].state, 'overdue'); assert.deepEqual(bad.items[0].unmetSteps, ['follow-up'])
  assert.deepEqual(run([rec({ followUp: { notApplicableReason: 'patient-deceased' } })], { validNotApplicableReasons: [] }).items[0].unmetSteps, ['follow-up'])
  assert.deepEqual(run([rec({ followUp: { notApplicableReason: '' } })]).items[0].unmetSteps, ['follow-up'])
})

test('tutup_terlambat_tetap_tutup_tetapi_terlihat', () => {
  const late = run([rec({ followUp: { evidence: person('2026-10-09T09:00:00.000Z') } })]) // dueBy 2026-10-09T08:00
  assert.equal(late.items[0].state, 'closed'); assert.equal(late.items[0].closedLate, true)
  assert.equal(run([rec()]).items[0].closedLate, false)
  // tepat pada batas tutup bukan terlambat
  assert.equal(run([rec({ followUp: { evidence: person('2026-10-09T08:00:00.000Z') } })]).items[0].closedLate, false)
})

test('hasil_belum_jatuh_tempo_tidak_masuk_penyebut', () => {
  const r = run([rec({ resultId: 'r-9', dueBy: '2026-10-11T08:00:00.000Z', explanation: undefined })])
  assert.equal(r.items[0].state, 'open-not-due'); assert.equal(r.dueCount, 0); assert.equal(r.closureRate, null)
  assert.equal(r.unmeasuredReason, 'no results due in the evaluation window')
  // jendela yang meluas melewati waktu evaluasi tetap tidak menghitung hasil yang belum jatuh tempo
  const wide = run([rec({ resultId: 'r-9', dueBy: '2026-10-11T08:00:00.000Z', explanation: undefined })], { windowEnd: '2026-10-20T00:00:00.000Z' })
  assert.equal(wide.dueCount, 0); assert.equal(wide.items[0].state, 'open-not-due'); assert.equal(wide.closureRate, null)
})

test('batas_jatuh_tempo_dan_jendela_dievaluasi_inklusif', () => {
  // jatuh tempo tepat saat evaluasi: sudah jatuh tempo
  assert.equal(run([rec({ dueBy: NOW, explanation: undefined })]).items[0].state, 'overdue')
  assert.equal(run([rec({ dueBy: '2026-10-10T12:00:00.001Z', explanation: undefined })]).items[0].state, 'open-not-due')
  // batas jendela: awal/akhir termasuk; ±1 ms di luar tidak
  const w = (due) => run([rec({ dueBy: due, resultedAt: '2026-09-01T00:00:00.000Z', review: clinician('2026-09-02T00:00:00.000Z'), explanation: person('2026-09-02T00:00:00.000Z'), followUp: { evidence: person('2026-09-02T00:00:00.000Z') } })], { windowStart: '2026-10-01T00:00:00.000Z', windowEnd: '2026-10-05T00:00:00.000Z' }).dueCount
  assert.equal(w('2026-10-01T00:00:00.000Z'), 1); assert.equal(w('2026-10-05T00:00:00.000Z'), 1)
  assert.equal(w('2026-09-30T23:59:59.999Z'), 0); assert.equal(w('2026-10-05T00:00:00.001Z'), 0)
})

test('penyebut_nol_tidak_terukur_bukan_nol_atau_seratus_persen', () => {
  const r = run([])
  assert.equal(r.closureRate, null); assert.equal(r.dueCount, 0); assert.notEqual(r.closureRate, 0); assert.notEqual(r.closureRate, 1)
})

test('menolak_hasil_pasien_lain_tanpa_menghitungnya', () => {
  const r = run([rec(), rec({ resultId: 'r-x', patientId: 'p-2' })])
  assert.deepEqual(r.invalidIds, ['r-x']); assert.deepEqual(r.items[1].invalidReasons, ['foreign-patient'])
  assert.equal(r.closureRate, null); assert.equal(r.unmeasuredReason, 'one or more result records are invalid')
  assert.equal(run([rec()]).closureRate, 1) // pasangan: tanpa rekaman asing terukur
})

test('id_ganda_membuat_semua_kemunculannya_tidak_sahih', () => {
  const r = run([rec(), rec()])
  assert.deepEqual(r.invalidIds, ['r-1', 'r-1']); assert.ok(r.items.every((i) => i.invalidReasons.includes('duplicate-id'))); assert.equal(r.closureRate, null)
})

test('bukti_dari_masa_depan_atau_sebelum_hasil_ada_tidak_sahih', () => {
  const future = run([rec({ explanation: person('2026-10-10T12:00:00.001Z') })])
  assert.deepEqual(future.items[0].invalidReasons, ['evidence-in-future']); assert.equal(future.items[0].state, 'invalid')
  assert.equal(run([rec({ explanation: person(NOW) })]).items[0].state, 'closed') // tepat saat evaluasi sah
  const before = run([rec({ review: clinician('2026-10-08T07:59:59.999Z') })])
  assert.deepEqual(before.items[0].invalidReasons, ['evidence-before-result'])
  assert.equal(run([rec({ review: clinician('2026-10-08T08:00:00.000Z') })]).items[0].state, 'closed') // tepat saat hasil sah
})

test('timestamp_rusak_dan_batas_tutup_sebelum_hasil_tidak_sahih', () => {
  assert.deepEqual(run([rec({ resultedAt: 'bukan-tanggal' })]).items[0].invalidReasons, ['invalid-timestamp'])
  assert.deepEqual(run([rec({ dueBy: '' })]).items[0].invalidReasons, ['invalid-timestamp'])
  assert.deepEqual(run([rec({ explanation: person('rusak') })]).items[0].invalidReasons, ['invalid-timestamp'])
  assert.deepEqual(run([rec({ dueBy: '2026-10-08T07:00:00.000Z' })]).items[0].invalidReasons, ['due-before-result'])
  assert.equal(run([rec({ dueBy: '2026-10-08T08:00:00.000Z' })]).items[0].state, 'closed') // sama dengan waktu hasil sah
})

test('masukan_evaluasi_tak_sahih_gagal_tertutup_tanpa_angka', () => {
  for (const over of [{ evaluatedAt: 'x' }, { windowStart: 'x' }, { windowEnd: 'x' }, { windowStart: '2026-10-11T00:00:00.000Z', windowEnd: '2026-10-01T00:00:00.000Z' }]) {
    const r = run([rec()], over)
    assert.equal(r.closureRate, null, JSON.stringify(over)); assert.equal(r.unmeasuredReason, 'evaluation inputs are invalid (timestamps or window)'); assert.equal(r.items[0].state, 'invalid')
  }
  assert.equal(run([rec()], { windowStart: '2026-10-01T00:00:00.000Z', windowEnd: '2026-10-01T00:00:00.000Z' }).items[0].state === 'invalid', false) // jendela satu titik sah
})

test('deterministik_dan_tidak_mengubah_masukan', () => {
  const input = [rec(), rec({ resultId: 'r-2', explanation: undefined })]
  const snapshot = JSON.stringify(input)
  const a = run(input), b = run(input)
  assert.deepEqual(a, b); assert.equal(JSON.stringify(input), snapshot)
})
