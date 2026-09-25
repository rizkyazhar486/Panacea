import assert from 'node:assert/strict'
import { tutupKunjungan, terapkanSimpanRekam } from '../src/rekamKlinis.js'
const kini = new Date('2026-09-26T10:00:00Z')
const dokter = { id: 'd1', nama: 'Dr. Asli', klinisi: true }, pasien = { id: 'u1', nama: 'Budi', klinisi: false }
const draf = { id: 'r1', patientId: 'p1', physicalExam: { doctorVerified: true }, problems: [{ id: 'm1', title: 'Hypertension' }], plan: [{ id: 'x', text: 'Amlodipine', status: 'diverifikasi' }], primaryDiagnosis: { code: 'I10', title: 'HT', source: 'Dokter' } }
const tt = terapkanSimpanRekam(undefined, { ...draf, signedAt: 'intent' }, dokter, kini).rekam

assert.deepEqual(tutupKunjungan(tt, pasien, kini, 'r2'), { ok: false, alasan: 'not-clinician' }, 'pasien dapat menutup kunjungan')
assert.deepEqual(tutupKunjungan(draf, dokter, kini, 'r2'), { ok: false, alasan: 'not-signed' }, 'draf belum ditandatangani dibekukan sebagai kunjungan')
assert.deepEqual(tutupKunjungan(undefined, dokter, kini, 'r2'), { ok: false, alasan: 'no-record' })
const h = tutupKunjungan(tt, dokter, kini, 'r2')
assert.ok(h.ok)
if (h.ok) {
  assert.deepEqual([h.kunjungan.encounterId, h.kunjungan.signedById, h.kunjungan.closedById], ['r1', 'd1', 'd1'], 'kunjungan tertutup kehilangan tanda tangan/penutup')
  const b = h.rekamBaru
  assert.equal(b.id, 'r2'); assert.equal(b.previousEncounterId, 'r1')
  assert.equal(b.signedAt ?? b.signedById ?? b.signedBy, undefined, 'tanda tangan lama terbawa ke draf baru')
  assert.equal(b.primaryDiagnosis, undefined, 'diagnosis lama terbawa ke draf baru')
  assert.deepEqual(b.plan, [], 'rencana lama terbawa ke draf baru')
  assert.equal(b.physicalExam.doctorVerified, false, 'verifikasi fisik lama terbawa ke draf baru')
  assert.deepEqual(b.problems.map((p: any) => [p.title, p.carriedFrom]), [['Hypertension', 'r1']], 'daftar masalah tidak dibawa dengan asalnya')
  // Kunjungan tertutup tidak berbagi objek dengan draf baru.
  b.problems[0].title = 'ubah'; assert.equal(h.kunjungan.problems[0].title, 'Hypertension', 'kunjungan tertutup ikut berubah')
}
console.log('kunjunganKlinis: hanya klinisi menutup kunjungan bertanda tangan; draf baru hanya membawa daftar masalah beserta asalnya')
