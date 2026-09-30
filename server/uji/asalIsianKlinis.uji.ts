import assert from 'node:assert/strict'
import { terapkanSimpanRekam } from '../src/rekamKlinis.js'
const t1 = new Date('2026-09-26T10:00:00Z'), t2 = new Date('2026-09-26T11:00:00Z')
const dokter = { id: 'd1', nama: 'Dr', klinisi: true }, pasien = { id: 'u1', nama: 'Budi', klinisi: false }
const dasar = { id: 'r1', patientId: 'p1', anamnesis: {}, physicalExam: { doctorVerified: false }, problems: [], plan: [] }

// 1. Intake pasien/AI: kolom terisi dicap 'AI', cap klien palsu ('Dokter') diabaikan.
const a = terapkanSimpanRekam(undefined, { ...dasar, anamnesis: { keluhanUtama: 'nyeri dada' }, asalIsian: { 'anamnesis.keluhanUtama': { asal: 'Dokter', olehId: 'palsu' } } }, pasien, t1).rekam
assert.deepEqual(a.asalIsian['anamnesis.keluhanUtama'], { asal: 'AI', pada: t1.toISOString() }, 'isian pasien/AI tercatat sebagai tulisan dokter')

// 2. Dokter mengubah kolom -> 'Dokter' + olehId dari server; kolom lain mempertahankan cap lama.
const b = terapkanSimpanRekam(a, { ...a, anamnesis: { ...a.anamnesis, rps: 'sejak 2 jam' } }, dokter, t2).rekam
assert.deepEqual(b.asalIsian['anamnesis.rps'], { asal: 'Dokter', olehId: 'd1', pada: t2.toISOString() }, 'tulisan dokter tidak dicap server')
assert.deepEqual(b.asalIsian['anamnesis.keluhanUtama'], a.asalIsian['anamnesis.keluhanUtama'], 'kolom tak berubah kehilangan capnya')

// 3. Chatbot di sesi dokter menyatakan 'AI' -> tetap 'AI' (penurunan, bukan eskalasi).
const c = terapkanSimpanRekam(b, { ...b, physicalExam: { ...b.physicalExam, perSystem: '• [AI SUGGESTION] auskultasi' }, asalIsian: { ...b.asalIsian, 'physicalExam.perSystem': { asal: 'AI' } } }, dokter, t2).rekam
assert.equal(c.asalIsian['physicalExam.perSystem'].asal, 'AI', 'saran AI di sesi dokter tercatat sebagai tulisan dokter')

// 4. Pasien menimpa kolom tulisan dokter -> kembali 'AI'.
const d = terapkanSimpanRekam(c, { ...c, anamnesis: { ...c.anamnesis, rps: 'diubah pasien' } }, pasien, t2).rekam
assert.equal(d.asalIsian['anamnesis.rps'].asal, 'AI', 'isian yang diubah pasien tetap terlihat sebagai tulisan dokter')

// 5. Cap asal basi dari klien tidak membatalkan tanda tangan sah (metadata, bukan isi).
const tt = terapkanSimpanRekam(c, { ...c, signedAt: 'intent' }, dokter, t2).rekam
const basi = terapkanSimpanRekam(tt, { ...tt, asalIsian: {} }, dokter, t2).rekam
assert.equal(basi.signedById, 'd1', 'salinan cap asal yang basi membatalkan tanda tangan')
assert.deepEqual(basi.asalIsian, tt.asalIsian, 'cap asal hilang karena salinan klien kosong')
console.log('asalIsianKlinis: asal per kolom anamnesis/pemeriksaan dicap server; deklarasi AI dihormati; cap palsu diabaikan')
