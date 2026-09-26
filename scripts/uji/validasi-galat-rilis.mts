// Klasifikasi galat (negatif palsu berbahaya) + gerbang rilis klaim klinis per versi.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { tambahCatatan, susunLaporan, sidik, gerbangRilisKlinis, JENIS_GALAT, type Catatan, type IsiCatatan, type Penilai, type Protokol, type Penilaian } from '../../src/lib/validasiKlinis.ts'
import { JENIS_GALAT as GALAT_SERVER, susunPenilaian } from '../../server/src/validasiLedger.ts'

assert.deepEqual([...GALAT_SERVER], [...JENIS_GALAT], 'daftar kelas galat server dan klien berbeda')

const protokol: Protokol = {
  id: 'uji', versi: 1, judul: 'uji', alur: 'lab trend', penilaiPerKasus: 2, dibekukanPada: '2026-09-26T00:00:00Z',
  titikAkhir: [{ metrik: 'correctness', definisi: 'x', ambang: { arah: 'min', nilai: 0.5 } }, { metrik: 'dangerous-false-negative', definisi: 'missed critical', ambang: { arah: 'maks', nilai: 0 } }],
  etika: { butuhPersetujuanEtik: false, dataPasienNyata: false, catatan: 'synthetic cases' },
}
const dr = (id: string, verif = true): Penilai => ({ id, peran: 'physician', kredensialRef: `str:${id}`, kredensialTerverifikasi: verif, cakupan: 'internal medicine', konflikKepentingan: 'none' })
let SIDIK = ''
const nilai = (kasusId: string, p: Penilai, benar: boolean, galat: Penilaian['galat'] = []): Penilaian => ({ kasusId, protokolSidik: SIDIK, penilai: p, waktu: '2026-09-26T01:00:00Z', benar, klaimTakDidukung: 0, omisi: [], bahaya: 'none', override: { dilakukan: false }, waktuTinjauMs: 60000, buta: true, galat })
async function buku(isi: IsiCatatan[]) { let b: Catatan[] = []; for (const x of isi) b = await tambahCatatan(b, x); return b }
const kasus = (id: string, versi = 'lab-trend@v1') => ({ jenis: 'kasus' as const, data: { id, protokolId: 'uji', versiSistem: versi, masukan: {}, keluaran: {}, jenisKeluaran: 'rule-output' as const } })

SIDIK = await sidik(protokol)
// 1. Tanpa penilaian manusia: hanya 'technically-works'.
let b = await buku([{ jenis: 'protokol', data: protokol }, kasus('k1'), kasus('k2')])
assert.equal(gerbangRilisKlinis(await susunLaporan(b, 'uji'), b, 'lab-trend@v1').klaim, 'technically-works')

// 2. Semua benar, dua penilai terverifikasi per kasus: 'clinically-validated'.
const ok = [nilai('k1', dr('a'), true), nilai('k1', dr('b'), true), nilai('k2', dr('a'), true), nilai('k2', dr('b'), true)]
b = await buku([{ jenis: 'protokol', data: protokol }, kasus('k1'), kasus('k2'), ...ok.map((d) => ({ jenis: 'penilaian' as const, data: d }))])
let g = gerbangRilisKlinis(await susunLaporan(b, 'uji'), b, 'lab-trend@v1')
assert.deepEqual(g, { klaim: 'clinically-validated', alasan: [] })
// Klaim tidak berpindah ke versi lain secara otomatis.
assert.equal(gerbangRilisKlinis(await susunLaporan(b, 'uji'), b, 'lab-trend@v2').klaim, 'clinically-reviewed', 'klaim validasi berpindah ke versi sistem lain')

// 3. Satu negatif palsu berbahaya: turun ke 'clinically-reviewed' dengan alasan eksplisit.
const fn = [nilai('k1', dr('a'), true), nilai('k1', dr('b'), true), nilai('k2', dr('a'), false, ['missed-critical-finding']), nilai('k2', dr('b'), false, ['missed-finding'])]
b = await buku([{ jenis: 'protokol', data: protokol }, kasus('k1'), kasus('k2'), ...fn.map((d) => ({ jenis: 'penilaian' as const, data: d }))])
let lap = await susunLaporan(b, 'uji')
assert.equal(lap.metrik.dangerousFalseNegative.pembilang, 1)
assert.equal(lap.metrik.rincianGalat['missed-finding'], 1)
g = gerbangRilisKlinis(lap, b, 'lab-trend@v1')
assert.equal(g.klaim, 'clinically-reviewed', 'negatif palsu berbahaya tetap diberi klaim tervalidasi')
assert.ok(g.alasan.some((a) => /dangerous false negative/.test(a)), 'alasan negatif palsu berbahaya tidak disebut')

// 4. Catatan penilai tak terverifikasi yang disisipkan langsung (melewati tambahCatatan,
//    mis. impor yang dimanipulasi): dikecualikan dari titik akhir DAN rantai dilaporkan putus.
b = await buku([{ jenis: 'protokol', data: protokol }, kasus('k1'), { jenis: 'penilaian', data: nilai('k1', dr('a'), true) }])
const sisip: Catatan = { urutan: b.length, isi: { jenis: 'penilaian', data: nilai('k1', dr('x', false), false, ['other']) }, sidikSebelum: b[b.length - 1].sidik, sidik: 'f'.repeat(64) }
lap = await susunLaporan([...b, sisip], 'uji')
assert.deepEqual([lap.metrik.penilaian, lap.metrik.dikecualikanTakTerverifikasi, lap.metrik.correctness.nilai], [1, 1, 1], 'penilai tak terverifikasi memengaruhi titik akhir')
assert.equal(lap.rantai.utuh, false, 'catatan sisipan tidak memutus rantai hash')
assert.ok(gerbangRilisKlinis(lap, [...b, sisip], 'lab-trend@v1').alasan.some((a) => /hash chain is broken/.test(a)))

// 5. Data pasien nyata tanpa nomor persetujuan etik: tidak boleh 'clinically-validated'.
const etis = { ...protokol, etika: { ...protokol.etika, dataPasienNyata: true } }
SIDIK = await sidik(etis)
b = await buku([{ jenis: 'protokol', data: etis }, kasus('k1'), kasus('k2'), ...ok.map((d) => ({ jenis: 'penilaian' as const, data: { ...d, protokolSidik: SIDIK } }))])
g = gerbangRilisKlinis(await susunLaporan(b, 'uji'), b, 'lab-trend@v1')
assert.ok(g.klaim !== 'clinically-validated' && g.alasan.some((a) => /ethics approval/.test(a)), 'data pasien nyata tanpa persetujuan etik diberi klaim tervalidasi')

// 6. Server: kelas galat wajib konsisten dengan keputusan benar/salah.
const bukuServer: any[] = [{ isi: { jenis: 'protokol', data: protokol } }, { isi: { jenis: 'kasus', data: kasus('k1').data } }]
const idP = { ...dr('a') } as any
const dasar = { kasusId: 'k1', bahaya: 'none', waktuTinjauMs: 1000 }
assert.throws(() => susunPenilaian(bukuServer, 'uji', { ...dasar, benar: false }, idP, new Date()), /classify the error/)
assert.throws(() => susunPenilaian(bukuServer, 'uji', { ...dasar, benar: true, galat: ['false-alarm'] }, idP, new Date()), /cannot carry/)
assert.throws(() => susunPenilaian(bukuServer, 'uji', { ...dasar, benar: false, galat: ['made-up'] }, idP, new Date()), /unknown error class/)
assert.deepEqual(susunPenilaian(bukuServer, 'uji', { ...dasar, benar: false, galat: ['missed-critical-finding', 'missed-critical-finding'] }, idP, new Date()).galat, ['missed-critical-finding'])

// 7. UI menampilkan klaim rilis & negatif palsu berbahaya.
const ui = readFileSync('src/components/StudiValidasiKlinis.tsx', 'utf8')
assert.match(ui, /data-klaim-rilis=\{rilis\.klaim\}/, 'klaim rilis tidak ditampilkan')
assert.match(ui, /data-galat-berbahaya/)
assert.match(ui, /if \(f\.benar === false && !f\.galat\.length\)/)
console.log('validasi-galat-rilis: negatif palsu berbahaya dihitung & memblokir klaim, klaim per versi, penilai tak terverifikasi dikecualikan, etika ditegakkan, server & klien sepakat')
