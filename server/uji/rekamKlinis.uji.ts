import assert from 'node:assert/strict'
import { terapkanSimpanRekam } from '../src/rekamKlinis.js'
const kini = new Date('2026-09-26T10:00:00Z')
const pasien = { id: 'u1', nama: 'Budi', klinisi: false }, dokter = { id: 'd1', nama: 'Dr. Asli', klinisi: true }
const dasar = { id: 'r1', patientId: 'self-budi', physicalExam: { doctorVerified: false }, plan: [] }

// 1. Pasien memalsukan tanda tangan & verifikasi & diagnosis dokter → dibuang.
const palsu = terapkanSimpanRekam(undefined, { ...dasar, signedBy: 'Dr. Palsu', signedAt: '2026-01-01T00:00:00Z', physicalExam: { doctorVerified: true, verifiedBy: 'Dr. Palsu' }, primaryDiagnosis: { code: 'I10', title: 'HT', source: 'Dokter' } }, pasien, kini).rekam
assert.equal(palsu.signedBy, undefined, 'pasien dapat memalsukan tanda tangan dokter')
assert.equal(palsu.physicalExam.doctorVerified, false, 'pasien dapat memalsukan verifikasi pemeriksaan fisik')
assert.equal(palsu.primaryDiagnosis.source, 'AI', 'pasien dapat menandai diagnosis sebagai bersumber dokter')

// 2. Dokter menandatangani: nama & waktu dari server, bukan klien.
const tt = terapkanSimpanRekam(dasar, { ...dasar, signedBy: 'Dr. Lain', signedAt: '2020-01-01T00:00:00Z', physicalExam: { doctorVerified: true, verifiedBy: 'Dr. Lain' } }, dokter, kini).rekam
assert.deepEqual([tt.signedBy, tt.signedById, tt.signedAt], ['Dr. Asli', 'd1', kini.toISOString()], 'identitas/waktu tanda tangan dari klien')
assert.deepEqual([tt.physicalExam.verifiedBy, tt.physicalExam.verifiedById], ['Dr. Asli', 'd1'])

// 3. Rekam bertanda tangan ditimpa (mis. draf chatbot pasien) → versi bertanda tangan diarsipkan.
const draf = terapkanSimpanRekam(tt, { ...dasar, anamnesis: { keluhan: 'baru' } }, pasien, kini)
assert.ok(draf.arsip && draf.arsip.signedBy === 'Dr. Asli', 'versi bertanda tangan hilang saat ditimpa')
assert.equal(draf.rekam.signedBy, undefined)
// Pasien TIDAK boleh mengubah isi klinis sambil mempertahankan cap tanda tangan lama.
const ubahIsi = terapkanSimpanRekam(tt, { ...tt, anamnesis: { keluhan: 'diubah pasien setelah ditandatangani' } }, pasien, kini)
assert.equal(ubahIsi.rekam.signedBy, undefined, 'isi yang diubah pasien masih terlihat ditandatangani dokter')
assert.equal(ubahIsi.rekam.signedById, undefined, 'identitas penanda tangan lama melekat pada isi baru')
assert.equal(ubahIsi.rekam.signedAt, undefined, 'waktu tanda tangan lama melekat pada isi baru')
assert.ok(ubahIsi.arsip?.signedBy === 'Dr. Asli', 'versi klinis bertanda tangan lama harus tetap diarsipkan')

// Temuan pemeriksaan fisik yang diubah pasien juga harus kehilangan cap verifikasi dokter.
const ubahFisik = terapkanSimpanRekam(tt, { ...tt, physicalExam: { ...tt.physicalExam, general: 'diubah pasien' } }, pasien, kini).rekam
assert.equal(ubahFisik.physicalExam.doctorVerified, false, 'temuan fisik baru masih terlihat diverifikasi dokter')
assert.equal(ubahFisik.physicalExam.verifiedBy, undefined, 'nama verifikator lama melekat pada temuan fisik baru')
assert.equal(ubahFisik.physicalExam.verifiedById, undefined, 'id verifikator lama melekat pada temuan fisik baru')

// Pasien menyimpan ulang rekam bertanda tangan untuk consent pasien saja → tanda tangan klinis tetap.
const setuju = terapkanSimpanRekam(tt, { ...tt, surgery: { consent: { given: true } } }, pasien, kini)
assert.equal(setuju.rekam.signedBy, 'Dr. Asli'); assert.ok(setuju.arsip, 'perubahan pada rekam bertanda tangan tidak diarsipkan')
// Dokter juga tidak boleh mengubah isi lalu menyimpan dengan cap lama. Harus re-sign.
const editDokterTanpaResign = terapkanSimpanRekam(tt, { ...tt, anamnesis: { keluhan: 'diubah dokter tanpa re-sign' } }, dokter, kini)
assert.equal(editDokterTanpaResign.rekam.signedBy, undefined, 'edit dokter tanpa re-sign masih membawa cap lama')
assert.equal(editDokterTanpaResign.rekam.signedById, undefined)
assert.equal(editDokterTanpaResign.rekam.signedAt, undefined)
assert.ok(editDokterTanpaResign.arsip?.signedBy === 'Dr. Asli')

// Re-sign eksplisit (signedAt klien berubah) mencap ulang server dan memverifikasi ulang fisik.
const kiniResign = new Date('2026-09-26T11:00:00Z')
const resign = terapkanSimpanRekam(tt, {
  ...tt,
  anamnesis: { keluhan: 'diubah dokter dan di-sign ulang' },
  physicalExam: { ...tt.physicalExam, general: 'temuan baru', doctorVerified: true },
  signedAt: '2099-01-01T00:00:00Z',
}, dokter, kiniResign).rekam
assert.deepEqual([resign.signedBy, resign.signedById, resign.signedAt], ['Dr. Asli', 'd1', kiniResign.toISOString()])
assert.deepEqual([resign.physicalExam.verifiedBy, resign.physicalExam.verifiedById], ['Dr. Asli', 'd1'])

// Simpan identik tidak mengarsipkan.
assert.equal(terapkanSimpanRekam(tt, tt, dokter, kini).arsip, undefined)
console.log('rekamKlinis: tanda tangan tidak dapat dipalsukan, dicap server, versi bertanda tangan diarsipkan')
