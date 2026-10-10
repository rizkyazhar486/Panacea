// Validasi masukan jet lag: kosong/di luar rentang ditolak (bukan dibaca 0 / 07:00).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { periksaMasukanJetLag, rencanaJetLag, JETLAG_TZ, JETLAG_HARI_SIAP } from '../../src/lib/clinicalTrackers'

const sah = { asal: '7', tujuan: '1', bangun: '06:00', siap: '3' }
const ditolak = (m: Partial<typeof sah>) => {
  const r = periksaMasukanJetLag({ ...sah, ...m })
  assert.equal(r.ok, false)
  return r.ok ? [] : r.problems
}

// positif: masukan sah diteruskan apa adanya, rencana sama dengan pemanggilan langsung
const ok = periksaMasukanJetLag(sah)
assert.deepEqual(ok, { ok: true, masukan: { tzAsal: 7, tzTujuan: 1, jamBangunBiasa: '06:00', hariPersiapan: 3 } })
if (ok.ok) assert.deepEqual(rencanaJetLag(ok.masukan), rencanaJetLag({ tzAsal: 7, tzTujuan: 1, jamBangunBiasa: '06:00', hariPersiapan: 3 }))
assert.equal(periksaMasukanJetLag({ ...sah, asal: '-5', tujuan: '5.5' }).ok, true)

// negatif berpasangan: tiap aturan ditolak dengan alasan spesifik; pasangan sahnya (di atas) lolos
assert.match(ditolak({ asal: '' })[0], /Origin time zone is required/)
assert.match(ditolak({ tujuan: '  ' })[0], /Destination time zone is required/)
assert.match(ditolak({ asal: 'abc' })[0], /Origin time zone is required/)
assert.match(ditolak({ tujuan: 'Infinity' })[0], /Destination time zone is required/)
assert.match(ditolak({ bangun: '' })[0], /wake time is required/)
assert.match(ditolak({ bangun: '24:00' })[0], /wake time is required/)
assert.match(ditolak({ bangun: '07:60' })[0], /wake time is required/)
assert.match(ditolak({ siap: '' })[0], /whole number/)
assert.match(ditolak({ siap: '1.5' })[0], /whole number/)
assert.match(ditolak({ siap: '-1' })[0], /0–4/)
assert.match(ditolak({ siap: '5' })[0], /0–4/)

// batas: tepat di batas lolos, ±1 langkah di luar ditolak
for (const v of [JETLAG_TZ.min, JETLAG_TZ.max]) assert.equal(periksaMasukanJetLag({ ...sah, asal: String(v) }).ok, true)
assert.match(ditolak({ asal: String(JETLAG_TZ.min - 1) })[0], /between UTC-12 and UTC\+14/)
assert.match(ditolak({ tujuan: String(JETLAG_TZ.max + 1) })[0], /between UTC-12 and UTC\+14/)
for (const v of [JETLAG_HARI_SIAP.min, JETLAG_HARI_SIAP.max]) assert.equal(periksaMasukanJetLag({ ...sah, siap: String(v) }).ok, true)
assert.equal(periksaMasukanJetLag({ ...sah, bangun: '00:00' }).ok, true)
assert.equal(periksaMasukanJetLag({ ...sah, bangun: '23:59' }).ok, true)

// semua masalah dikumpulkan sekaligus (tidak berhenti di yang pertama)
assert.equal(ditolak({ asal: '', tujuan: '', bangun: '', siap: '' }).length, 4)

// determinisme
assert.deepEqual(periksaMasukanJetLag(sah), periksaMasukanJetLag(sah))

// regresi: halaman tidak lagi membaca kolom kosong sebagai 0
const halaman = readFileSync('src/pages/clinical/ClinicalTrackers.tsx', 'utf8')
assert.ok(!/tzAsal: Number\(asal\) \|\| 0/.test(halaman), 'pembacaan kosong→0 kembali')
assert.ok(/periksaMasukanJetLag\(/.test(halaman), 'halaman harus memakai validator')
console.log('jetlag-masukan: OK')
