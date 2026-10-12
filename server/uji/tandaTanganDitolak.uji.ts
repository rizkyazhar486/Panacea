// Alpha A6: percobaan non-klinisi menandatangani harus dikenali (untuk audit), tanpa menandai simpanan biasa.
// Fungsi murni; fixture sintetis. Ini bukan tinjauan klinis.
import assert from 'node:assert/strict'
import { tandaTanganDitolak, terapkanSimpanRekam } from '../src/rekamKlinis.ts'

const pasien = { id: 'u-pasien', nama: 'Synthetic Patient', klinisi: false }
const dokter = { id: 'u-dokter', nama: 'Synthetic Doctor', klinisi: true }
const cap = { signedAt: '2026-01-02T00:00:00.000Z', signedBy: 'Synthetic Doctor', signedById: 'u-dokter' }
const dasar = { id: 'r1', patientId: 'p1', anamnesis: { keluhanUtama: 'Synthetic' }, physicalExam: { general: 'Synthetic' } }
const bertanda = { ...dasar, ...cap, physicalExam: { general: 'Synthetic', doctorVerified: true, verifiedBy: 'Synthetic Doctor', verifiedById: 'u-dokter' } }

// Positif: klaim baru dari non-klinisi dicatat sebagai ditolak
assert.equal(tandaTanganDitolak(undefined, { ...dasar, signedAt: 'x' }, pasien), true, 'signedAt dari pasien pada rekam baru')
assert.equal(tandaTanganDitolak(undefined, { ...dasar, signedById: 'forged' }, pasien), true, 'hanya signedById')
assert.equal(tandaTanganDitolak(undefined, { ...dasar, signedBy: 'Forged' }, pasien), true, 'hanya signedBy')
assert.equal(tandaTanganDitolak(undefined, { ...dasar, physicalExam: { doctorVerified: true } }, pasien), true, 'verifikasi pemeriksaan dari pasien')
assert.equal(tandaTanganDitolak(dasar, { ...dasar, ...cap }, pasien), true, 'cap pada rekam lama yang belum bertanda')
assert.equal(tandaTanganDitolak(bertanda, { ...bertanda, signedById: 'forged' }, pasien), true, 'cap diubah dari yang tersimpan')
assert.equal(tandaTanganDitolak(bertanda, { ...bertanda, physicalExam: { ...bertanda.physicalExam, verifiedById: 'forged' } }, pasien), true, 'verifikasi diubah')

// Negatif berpasangan: kondisi yang dibedakan ada pada satu hal saja
assert.equal(tandaTanganDitolak(undefined, { ...dasar }, pasien), false, 'simpanan pasien tanpa klaim')
assert.equal(tandaTanganDitolak(bertanda, { ...bertanda }, pasien), false, 'membawa kembali cap yang identik bukan percobaan baru')
assert.equal(tandaTanganDitolak(undefined, { ...dasar, physicalExam: { doctorVerified: false } }, pasien), false, 'doctorVerified=false bukan klaim')
assert.equal(tandaTanganDitolak(undefined, { ...dasar, ...cap }, dokter), false, 'klinisi boleh menandatangani; bukan penolakan')
assert.equal(tandaTanganDitolak(undefined, { ...dasar, physicalExam: { doctorVerified: true } }, dokter), false)
for (const v of [undefined, null, 'x', 1, []]) assert.equal(tandaTanganDitolak(undefined, v, pasien), false, `masukan ${JSON.stringify(v)} tidak melempar`)

// Tidak mengubah masukan (murni) dan deterministik
const salinan = structuredClone({ ...dasar, ...cap })
tandaTanganDitolak(undefined, salinan, pasien)
assert.deepEqual(salinan, { ...dasar, ...cap })
assert.equal(tandaTanganDitolak(undefined, { ...dasar, ...cap }, pasien), tandaTanganDitolak(undefined, { ...dasar, ...cap }, pasien))

// Konsistensi dengan perilaku server: setiap kasus "ditolak" memang membuang cap, dan tidak ada cap untuk non-klinisi
const hasil = terapkanSimpanRekam(undefined, { ...dasar, ...cap }, pasien, new Date('2026-02-01T00:00:00Z')).rekam
assert.equal(hasil.signedAt, undefined); assert.equal(hasil.signedById, undefined)
console.log('tandaTanganDitolak: ok')
