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
// Pasien menyimpan ulang rekam bertanda tangan tanpa mengubah tanda tangan (mis. persetujuan) → tanda tangan tetap.
const setuju = terapkanSimpanRekam(tt, { ...tt, surgery: { consent: { given: true } } }, pasien, kini)
assert.equal(setuju.rekam.signedBy, 'Dr. Asli'); assert.ok(setuju.arsip, 'perubahan pada rekam bertanda tangan tidak diarsipkan')
// Simpan identik tidak mengarsipkan.
assert.equal(terapkanSimpanRekam(tt, tt, dokter, kini).arsip, undefined)
console.log('rekamKlinis: tanda tangan tidak dapat dipalsukan, dicap server, versi bertanda tangan diarsipkan')
