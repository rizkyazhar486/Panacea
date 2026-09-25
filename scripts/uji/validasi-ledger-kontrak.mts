// Kontrak server ↔ kernel: rantai yang disusun server harus lolos pemeriksaan
// kernel peramban (sidik identik), dan penilaian server diterima kernel.
import assert from 'node:assert/strict'
import { sambung, susunPenilaian, susunAdjudikasi, susunUsabilitas, sidik as sidikServer, kanonik as kanonikServer } from '../../server/src/validasiLedger.ts'
import { periksaRantai, susunLaporan, sidik as sidikKlien, kanonik as kanonikKlien, type Catatan } from '../../src/lib/validasiKlinis.ts'

const contoh = { b: [1, { z: null, a: 'x' }], a: true, c: undefined, 'ü': 2.5 }
assert.equal(kanonikServer(contoh), kanonikKlien(contoh), 'kanonik server ≠ kernel')
assert.equal(sidikServer(contoh), await sidikKlien(contoh), 'sidik server ≠ kernel — peramban tidak dapat memverifikasi rantai server')

const protokol = { id: 'p', versi: 1, judul: 'FIXTURE', alur: 'x', penilaiPerKasus: 2, titikAkhir: [{ metrik: 'correctness', definisi: 'd', ambang: { arah: 'min', nilai: 0.9 } }], etika: { butuhPersetujuanEtik: false, dataPasienNyata: false, catatan: 'synthetic' }, dibekukanPada: '2026-09-25T00:00:00Z' }
let buku = [sambung([], { jenis: 'protokol', data: protokol })]
buku = [...buku, sambung(buku, { jenis: 'kasus', data: { id: 'k1', protokolId: 'p', versiSistem: 'v', masukan: {}, keluaran: {}, jenisKeluaran: 'derived' } })]
const penilai = { id: 'u1', peran: 'physician' as const, kredensialRef: 'server-verified', kredensialTerverifikasi: true, cakupan: 'fixture', konflikKepentingan: 'none declared' }
const n = susunPenilaian(buku, 'p', { kasusId: 'k1', benar: true, bahaya: 'none', waktuTinjauMs: 30000, penilai: { id: 'PALSU' } }, penilai, new Date('2026-09-26T00:00:00Z'))
assert.equal(n.penilai.id, 'u1', 'identitas penilai diambil dari payload')
buku = [...buku, sambung(buku, { jenis: 'penilaian', data: n })]
assert.deepEqual(await periksaRantai(buku as unknown as Catatan[]), { utuh: true }, 'kernel menolak rantai server')
const r = await susunLaporan(buku as unknown as Catatan[], 'p')
assert.equal(r.metrik.penilaian, 1)
assert.throws(() => susunPenilaian(buku, 'p', { kasusId: 'k1', benar: false, bahaya: 'none', waktuTinjauMs: 1 }, penilai, new Date()), /already assessed/)
assert.throws(() => susunPenilaian(buku, 'p', { kasusId: 'k1', benar: true, bahaya: 'none', waktuTinjauMs: 1 }, { ...penilai, id: 'u2', kredensialTerverifikasi: false }, new Date()), /verified/)
assert.throws(() => susunPenilaian(buku, 'p', { kasusId: 'k1', benar: true, bahaya: 'none', waktuTinjauMs: 1, override: { dilakukan: true } }, { ...penilai, id: 'u3' }, new Date()), /reason/)
// Ketidaksepakatan → adjudikasi oleh klinisi lain; SUS; kernel menerima rantai dan menghitungnya.
const pB = { ...penilai, id: 'u2' }, pC = { ...penilai, id: 'u3' }
buku = [...buku, sambung(buku, { jenis: 'penilaian', data: susunPenilaian(buku, 'p', { kasusId: 'k1', benar: false, bahaya: 'minor', waktuTinjauMs: 20000 }, pB, new Date('2026-09-26T01:00:00Z')) })]
assert.throws(() => susunAdjudikasi(buku, { kasusId: 'k1', keputusanBenar: true, alasan: 'x' }, pB, new Date()), /must not be one of the case reviewers/)
assert.throws(() => susunAdjudikasi(buku, { kasusId: 'k1', keputusanBenar: true, alasan: '' }, pC, new Date()), /reason/)
buku = [...buku, sambung(buku, { jenis: 'adjudikasi', data: susunAdjudikasi(buku, { kasusId: 'k1', keputusanBenar: true, alasan: 'fixture' }, pC, new Date('2026-09-26T02:00:00Z')) })]
buku = [...buku, sambung(buku, { jenis: 'usabilitas', data: susunUsabilitas(buku, 'p', { jawaban: [4, 2, 4, 2, 4, 2, 4, 2, 4, 2] }, 'u1', new Date('2026-09-26T03:00:00Z')) })]
assert.throws(() => susunUsabilitas(buku, 'p', { jawaban: Array(10).fill(3) }, 'u1', new Date()), /one usability response/)
assert.deepEqual(await periksaRantai(buku as unknown as Catatan[]), { utuh: true })
const r2 = await susunLaporan(buku as unknown as Catatan[], 'p')
assert.deepEqual(r2.metrik.ketidaksepakatanBelumDiadjudikasi, [], 'adjudikasi server tidak dikenali kernel')
assert.equal(r2.metrik.sus.median, 75)
assert.equal(r2.status, 'endpoints-evaluable')
console.log('validasi-ledger-kontrak: sidik server = kernel, rantai server lolos pemeriksaan peramban, identitas dari server')
