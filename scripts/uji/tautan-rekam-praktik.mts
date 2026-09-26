// Tautan pasien praktik ↔ akun: kernel diuji di server/uji/tautanPasien.uji.ts.
// Gerbang ini menjaga sambungannya: akses, kerahasiaan kode, audit, dan UI.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const baca = (p: string) => readFileSync(p, 'utf8')
const idx = baca('server/src/index.ts')
assert.match(idx, /bolehAksesPasien\(u, patientId, isOwner\(u\), findUserBySelfPatientId, \(pid\) => tertautKe\(u, pid, getTautan\(\)\)\)/, 'tautan tidak ikut dalam pemeriksaan akses')
assert.match(idx, /const \{ kodeTaut: _k, \.\.\.tanpaKode \} = c/, 'hash kode tautan dikirim ke klien')
assert.match(idx, /tanpaKode : saringKlinis\(c,/)
for (const a of ['emr.link_code_issued', 'emr.linked', 'emr.link_failed', 'emr.unlinked']) assert.ok(idx.includes(`'${a}'`), `peristiwa ${a} tidak diaudit`)
assert.match(idx, /if \(t\.userId !== u\.id && !klinisiAtauPemilik\(u, isOwner\(u\)\)\) return res\.status\(403\)/, 'pihak lain dapat mencabut tautan')
assert.match(idx, /app\.get\('\/api\/clinical\/patient\/:patientId\/link-status', requireAuth, \(req, res\) => \{\s*const actor = .*\n\s*if \(!klinisiAtauPemilik\(actor, isOwner\(actor\)\)\) return res\.status\(403\)/, 'status tautan sisi dokter tidak dijaga peran klinisi')
assert.match(idx, /res\.json\(statusTautanPasien\(String\(req\.params\.patientId\), getTautan\(\)\)\)/, 'status tautan tidak membaca tautan sebenarnya')
assert.match(baca('server/package.json'), /"uji": [^\n]*uji\/tautanPasien\.uji\.ts/, 'uji kernel tautan tidak dijalankan')
assert.match(baca('src/pages/PusatTubuh.tsx'), /<TebusKodeTaut \/>/, 'pasien tidak punya tempat menebus kode')
assert.match(baca('src/pages/EMR.tsx'), /<TerbitkanKodeTaut patientId=\{activePatient\.id\} \/>/, 'dokter tidak punya tempat menerbitkan kode')
const taut = baca('src/components/TautanRekamPraktik.tsx')
assert.match(taut, /api\.linkStatus\(patientId\)/, 'dokter tidak melihat status tautan pasien praktiknya')
assert.match(taut, /status\?\.linked[\s\S]{0,300}onClick=\{cabut\}/, 'dokter tidak punya tombol cabut tautan saat sudah tertaut')
assert.match(taut, /api\.unlink\(patientId\)/, 'tombol cabut sisi dokter tidak memanggil unlink')
console.log('tautan-rekam-praktik: akses lewat tautan eksplisit, hash kode tidak keluar server, semua peristiwa diaudit, dokter melihat & mencabut status tautan, UI dokter & pasien terpasang')
