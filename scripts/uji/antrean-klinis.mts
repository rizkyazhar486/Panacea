import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { kirimAtauAntre, kurasAntrean, bacaAntrean, bacaGalat, antrekan, type OperasiKlinis } from '../../src/lib/antreanKlinis.ts'

const toko = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } }
const op = (jenis: OperasiKlinis['jenis'], pid: string, n: string): OperasiKlinis => ({ opId: n, jenis, patientId: pid, payload: { n }, dibuat: 'x' })
const putus = async () => { throw new TypeError('Failed to fetch') }
const tolak = async () => { throw new Error('no access to this patient record') }

{ const s = toko(); assert.equal(await kirimAtauAntre(s, op('record', 'p1', 'a'), putus), 'diantre'); assert.equal(bacaAntrean(s).length, 1) }
{ const s = toko(); assert.equal(await kirimAtauAntre(s, op('record', 'p1', 'a'), tolak), 'ditolak'); assert.equal(bacaAntrean(s).length, 0, 'penolakan server diantre')
  assert.match(bacaGalat(s)?.pesan ?? '', /no access/, 'penolakan server tidak dicatat untuk ditampilkan') }
// Upsert rekam untuk pasien sama menggantikan versi antre lama; tambah vital tidak.
{ const s = toko(); antrekan(s, op('record', 'p1', 'r1')); antrekan(s, op('record', 'p1', 'r2')); antrekan(s, op('vital', 'p1', 'v1')); antrekan(s, op('vital', 'p1', 'v2'))
  assert.deepEqual(bacaAntrean(s).map((o) => o.opId), ['r2', 'v1', 'v2']) }
// Kuras: berhenti saat offline; online mengirim semua, penolakan dibuang & dicatat.
{ const s = toko(); antrekan(s, op('vital', 'p1', 'v1')); antrekan(s, op('record', 'p2', 'r1'))
  assert.deepEqual(await kurasAntrean(s, putus), { terkirim: 0, ditolak: 0, sisa: 2 })
  assert.deepEqual(await kurasAntrean(s, async (o) => { if (o.patientId === 'p2') throw new Error('refused') }), { terkirim: 1, ditolak: 1, sisa: 0 }) }

// Balasan canonical server harus dapat direkonsiliasi tanpa mengubah semantik transport.
{ const s = toko(); let canonical = ''; const operasi = op('record', 'p1', 'r1')
  assert.equal(await kirimAtauAntre(s, operasi, async () => ({ record: { patientId: 'p1', signedBy: 'Server Doctor' } }), (_op, hasil) => {
    canonical = String((hasil as { record?: { signedBy?: string } }).record?.signedBy ?? '')
  }), 'terkirim')
  assert.equal(canonical, 'Server Doctor', 'balasan canonical server tidak diteruskan setelah kirim langsung') }
{ const s = toko(); antrekan(s, op('record', 'p1', 'r1')); const seen: string[] = []
  assert.deepEqual(await kurasAntrean(s, async () => ({ record: { patientId: 'p1', signedBy: 'Server Doctor' } }), (_op, hasil) => {
    seen.push(String((hasil as { record?: { signedBy?: string } }).record?.signedBy ?? ''))
  }), { terkirim: 1, ditolak: 0, sisa: 0 })
  assert.deepEqual(seen, ['Server Doctor'], 'balasan canonical server hilang saat antrean offline dikuras') }

// Tidak ada tulisan klinis yang ditelan diam-diam.
const store = readFileSync('src/lib/store.tsx', 'utf8')
for (const f of ['addPatientRemote', 'addVitalRemote', 'addSupportiveRemote', 'saveRecordRemote', 'saveEducationRemote']) {
  assert.doesNotMatch(store, new RegExp(`api\\.${f}\\([^)]*\\)\\.catch\\(\\(\\) => \\{\\}\\)`), `${f} kembali ditelan diam-diam`)
}
assert.match(store, /window\.addEventListener\('online', on\)[\s\S]{0,80}kurasSinkronKlinis|kurasSinkronKlinis\(\)\n    const on = \(\) => void kurasSinkronKlinis\(\)/, 'antrean klinis tidak dikuras saat muat/online')
for (const hal of ['src/pages/EMR.tsx', 'src/pages/Dashboard.tsx']) assert.match(readFileSync(hal, 'utf8'), /<StatusSinkronKlinis \/>/, `${hal} tidak menampilkan status sinkron klinis`)
const api = readFileSync('src/lib/api.ts', 'utf8')
const emr = readFileSync('src/pages/EMR.tsx', 'utf8')
assert.match(api, /saveRecordRemote:[\\s\\S]{0,180}record:\\s*EMRRecord/, 'API belum mengetik balasan record canonical server')
assert.match(store, /sinkronKlinis\('record',[\\s\\S]{0,180}terimaBalasanKlinis/, 'saveRecord tidak merekonsiliasi balasan canonical server')
assert.match(store, /record\.patientId !== op\.patientId/, 'balasan canonical server tidak dibatasi ke pasien operasi yang sama')
assert.match(emr, /Certified by \{draft\.signedBy\}/, 'UI tanda tangan masih menampilkan nama lokal, bukan signer canonical')
assert.doesNotMatch(emr, /Certified by \{state\.settings\.doctorName\}/, 'UI kembali percaya nama penandatangan dari setting lokal')
console.log('antrean-klinis: jaringan→antre, penolakan→galat tampil, upsert menggantikan, kuras online, tanpa .catch(() => {}) klinis')
