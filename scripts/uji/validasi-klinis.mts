// Semua penilai & penilaian di sini adalah FIKSTUR UJI, bukan data manusia.
import assert from 'node:assert/strict'
import { tambahCatatan, periksaRantai, susunLaporan, sidik, proporsi, kappaCohen, type Catatan, type Protokol, type Penilai, type Penilaian } from '../../src/lib/validasiKlinis.ts'

const protokol: Protokol = {
  id: 'lab-trend-review', versi: 1, judul: 'FIXTURE protocol', alur: 'longitudinal.lab_to_trajectory', penilaiPerKasus: 2,
  titikAkhir: [
    { metrik: 'correctness', definisi: 'Trend status matches reviewer judgement', ambang: { arah: 'min', nilai: 0.9 } },
    { metrik: 'harmful', definisi: 'Output could plausibly cause moderate/severe harm', ambang: { arah: 'maks', nilai: 0.01 } },
  ],
  etika: { butuhPersetujuanEtik: true, dataPasienNyata: false, catatan: 'synthetic cases only' },
  dibekukanPada: '2026-09-25T00:00:00Z',
}
const penilai = (id: string, ok = true): Penilai => ({ id, peran: 'physician', kredensialRef: `fixture-${id}`, kredensialTerverifikasi: ok, cakupan: 'internal medicine', konflikKepentingan: 'none' })

let b: Catatan[] = []
b = await tambahCatatan(b, { jenis: 'protokol', data: protokol })
const ps = await sidik(protokol)

// Tanpa penilaian manusia: semua metrik null, status 'no-human-data'.
let r = await susunLaporan(b, protokol.id)
assert.equal(r.status, 'no-human-data')
assert.ok(r.titikAkhir.every((t) => t.nilai === null && t.terpenuhi === null), 'metrik diisi tanpa penilaian manusia')
assert.match(r.pernyataan, /not clinical validation/)

for (const id of ['c1', 'c2', 'c3', 'c4']) b = await tambahCatatan(b, { jenis: 'kasus', data: { id, protokolId: protokol.id, versiSistem: 'labTrend@test', masukan: { id }, keluaran: { status: 'watch' }, jenisKeluaran: 'derived' } })
const nilai = (kasusId: string, p: Penilai, benar: boolean, extra: Partial<Penilaian> = {}): Penilaian => ({
  kasusId, protokolSidik: ps, penilai: p, waktu: '2026-09-26T00:00:00Z', benar, klaimTakDidukung: 0, omisi: [], bahaya: 'none',
  override: { dilakukan: false }, waktuTinjauMs: 60000, buta: true, ...extra,
})
// Aturan integritas.
await assert.rejects(tambahCatatan(b, { jenis: 'penilaian', data: nilai('c1', penilai('X', false), true) }), /verified credentials/)
await assert.rejects(tambahCatatan(b, { jenis: 'penilaian', data: nilai('cZ', penilai('A'), true) }), /unknown case/)
await assert.rejects(tambahCatatan(b, { jenis: 'penilaian', data: { ...nilai('c1', penilai('A'), true), protokolSidik: 'f'.repeat(64) } }), /current frozen protocol/)
await assert.rejects(tambahCatatan(b, { jenis: 'penilaian', data: nilai('c1', penilai('A'), false, { override: { dilakukan: true } }) }), /override needs a reason/)
await assert.rejects(tambahCatatan(b, { jenis: 'protokol', data: { ...protokol, judul: 'rewritten' } }), /cannot be rewritten/)
await assert.rejects(tambahCatatan(b, { jenis: 'protokol', data: { ...protokol, id: 'real', etika: { butuhPersetujuanEtik: true, dataPasienNyata: true, catatan: '' } } }), /approval reference/)

const A = penilai('A'), B = penilai('B')
for (const [k, a, bb] of [['c1', true, true], ['c2', true, false], ['c3', false, false], ['c4', true, true]] as const) {
  b = await tambahCatatan(b, { jenis: 'penilaian', data: nilai(k, A, a, k === 'c3' ? { bahaya: 'moderate', omisi: ['missed recheck'], override: { dilakukan: true, alasan: 'wrong trend' } } : {}) })
  b = await tambahCatatan(b, { jenis: 'penilaian', data: nilai(k, B, bb, { waktuTinjauMs: 120000 }) })
}
await assert.rejects(tambahCatatan(b, { jenis: 'penilaian', data: nilai('c1', A, false) }), /adjudication, not rewrites/)
r = await susunLaporan(b, protokol.id)
assert.equal(r.status, 'in-progress', 'ketidaksepakatan c2 belum diadjudikasi')
assert.deepEqual(r.metrik.ketidaksepakatanBelumDiadjudikasi, ['c2'])
assert.equal(r.metrik.correctness.pembilang, 5); assert.equal(r.metrik.correctness.penyebut, 8)
assert.equal(r.metrik.harmful.pembilang, 1); assert.equal(r.metrik.override.pembilang, 1); assert.equal(r.metrik.omission.pembilang, 1)
assert.equal(r.metrik.medianWaktuTinjauMs, 90000)
// Kappa: pasangan (T,T),(T,F),(F,F),(T,T): po=0.75, pA=0.75, pB=0.5, pe=0.5 → κ=0.5
assert.ok(Math.abs((r.metrik.kappa.kappa ?? NaN) - 0.5) < 1e-12, `kappa ${r.metrik.kappa.kappa}`)
b = await tambahCatatan(b, { jenis: 'adjudikasi', data: { kasusId: 'c2', adjudikator: penilai('C'), waktu: '2026-09-27T00:00:00Z', keputusanBenar: true, alasan: 'fixture' } })
b = await tambahCatatan(b, { jenis: 'keselamatan', data: { id: 's1', waktu: '2026-09-27T00:00:00Z', jenis: 'near-miss', tingkat: 'minor', kasusId: 'c3', deskripsi: 'fixture', pelapor: 'A' } })
r = await susunLaporan(b, protokol.id)
assert.equal(r.status, 'endpoints-evaluable')
assert.equal(r.metrik.kejadianKeselamatan.nearMiss, 1)
assert.equal(r.titikAkhir[0].terpenuhi, false, '5/8 benar tidak memenuhi ambang 0.9')

// Rantai: perubahan, penghapusan, penyisipan terdeteksi.
assert.deepEqual(r.rantai, { utuh: true })
const ubah = structuredClone(b); (ubah[5].isi.data as Penilaian).benar = !(ubah[5].isi.data as Penilaian).benar
assert.equal((await periksaRantai(ubah)).utuh, false, 'penilaian yang diubah diam-diam tidak terdeteksi')
assert.equal((await periksaRantai([...b.slice(0, 4), ...b.slice(5)])).utuh, false, 'catatan yang dihapus tidak terdeteksi')

// Statistik.
assert.deepEqual(proporsi(0, 0), { pembilang: 0, penyebut: 0, nilai: null, ik95: null })
const w = proporsi(8, 10).ik95!; assert.ok(Math.abs(w[0] - 0.4902) < 1e-3 && Math.abs(w[1] - 0.9433) < 1e-3, `Wilson 8/10 ${w}`)
assert.equal(kappaCohen([]).kappa, null)
console.log('validasi-klinis: tanpa data manusia → null, integritas penilai/protokol, κ=0.5, Wilson, adjudikasi, rantai hash mendeteksi ubah/hapus')
