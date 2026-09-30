import assert from 'node:assert/strict'
import { terapkanSimpanRekam } from '../src/rekamKlinis.js'
const kini = new Date('2026-09-26T10:00:00Z'), nanti = new Date('2026-09-27T10:00:00Z')
const dokter = { id: 'd1', nama: 'Dr. Asli', klinisi: true }, pasien = { id: 'u1', nama: 'Budi', klinisi: false }
const dasar = { id: 'r1', patientId: 'p1', physicalExam: { doctorVerified: false } }
const rencana = (x: any) => ({ id: 'x1', category: 'Definitif', text: 'Amlodipine 5 mg', source: 'Dokter', status: 'diverifikasi', verifiedById: 'palsu', ...x })

// 1. Non-klinisi (mis. sesi chatbot pasien) tidak dapat membuat butir terverifikasi/bersumber dokter.
const p = terapkanSimpanRekam(undefined, { ...dasar, plan: [rencana({})], problems: [{ id: 'm1', title: 'HT', source: 'Dokter' }] }, pasien, kini).rekam
assert.deepEqual([p.plan[0].source, p.plan[0].status, p.plan[0].verifiedById], ['AI', 'usulan', undefined], 'non-klinisi membuat rencana terverifikasi dokter')
assert.equal(p.problems[0].source, 'AI', 'non-klinisi menandai masalah bersumber dokter')

// 2. Klinisi memverifikasi: identitas & waktu dari server, bukan klien.
const d = terapkanSimpanRekam(p, { ...p, plan: [{ ...p.plan[0], status: 'diverifikasi', verifiedById: 'palsu' }] }, dokter, kini).rekam
assert.deepEqual([d.plan[0].status, d.plan[0].verifiedById, d.plan[0].verifiedAt], ['diverifikasi', 'd1', kini.toISOString()], 'verifikasi rencana tidak dicap server')
assert.equal(d.plan[0].source, 'AI', 'asal usulan AI hilang saat dokter hanya memverifikasi tanpa mengubah teks')

// 3. Butir yang tidak berubah mempertahankan cap aslinya; pasien menyimpan ulang tidak menghapusnya.
const ulang = terapkanSimpanRekam(d, structuredClone(d), pasien, nanti).rekam
assert.deepEqual([ulang.plan[0].status, ulang.plan[0].verifiedById, ulang.plan[0].verifiedAt], ['diverifikasi', 'd1', kini.toISOString()], 'simpan ulang tanpa perubahan menghapus verifikasi')

// 4. Pasien mengubah teks rencana terverifikasi -> kembali menjadi usulan AI.
const ubah = terapkanSimpanRekam(d, { ...d, plan: [{ ...d.plan[0], text: 'Amlodipine 10 mg' }] }, pasien, nanti).rekam
assert.deepEqual([ubah.plan[0].source, ubah.plan[0].status, ubah.plan[0].verifiedById], ['AI', 'usulan', undefined], 'teks yang diubah pasien tetap terlihat diverifikasi dokter')

// 5. Klinisi mengubah teks -> butir menjadi tulisan dokter dan verifikasinya dicap ulang.
const tulis = terapkanSimpanRekam(d, { ...d, plan: [{ ...d.plan[0], text: 'Amlodipine 10 mg' }], problems: [{ ...d.problems[0], title: 'Hypertension stage 2' }] }, dokter, nanti).rekam
assert.deepEqual([tulis.plan[0].source, tulis.plan[0].verifiedAt, tulis.problems[0].source], ['Dokter', nanti.toISOString(), 'Dokter'], 'perubahan klinisi tidak dicatat sebagai tulisan dokter')
// 6. Sesi dokter menyimpan draf pipeline AI: asal 'AI' yang dinyatakan klien dipertahankan.
const draf = terapkanSimpanRekam(undefined, { ...dasar, plan: [rencana({ id: 'x9', source: 'AI', status: 'usulan', verifiedById: undefined })], problems: [{ id: 'm9', title: 'CKD?', source: 'AI' }] }, dokter, kini).rekam
assert.deepEqual([draf.plan[0].source, draf.problems[0].source], ['AI', 'AI'], 'draf AI yang disimpan dari sesi dokter dilabeli tulisan dokter')
// 7. Isi sama, hanya label asal diubah klien -> tidak ada eskalasi ke tulisan dokter.
const label = terapkanSimpanRekam(draf, { ...draf, problems: [{ ...draf.problems[0], source: 'Dokter' }] }, pasien, nanti).rekam
assert.equal(label.problems[0].source, 'AI', 'mengganti label asal saja mengeskalasi masalah AI menjadi tulisan dokter')
const labelD = terapkanSimpanRekam(draf, { ...draf, problems: [{ ...draf.problems[0], source: 'Dokter' }] }, dokter, nanti).rekam
assert.equal(labelD.problems[0].source, 'AI', 'klinisi mengeskalasi masalah AI tanpa mengubah isinya')
console.log('asalButirKlinis: asal & verifikasi per butir dicap server dari penulis terautentikasi')
