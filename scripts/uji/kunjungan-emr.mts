// Model kunjungan AI-EMR: kernel diuji di server/uji/kunjunganKlinis.uji.ts; gerbang
// ini menjaga sambungannya: rute, cakupan akses, proyeksi longitudinal dan UI.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const baca = (p: string) => readFileSync(p, 'utf8')
const idx = baca('server/src/index.ts')
assert.match(idx, /app\.post\('\/api\/clinical\/encounter\/close', requireAuth[\s\S]{0,300}bolehPasien\(actor, patientId\)/, 'penutupan kunjungan tanpa pemeriksaan akses pasien')
assert.match(idx, /tutupKunjungan\(getRecord\(patientId\), \{ id: actor\.id, nama: actor\.name, klinisi: klinisiAtauPemilik\(actor, isOwner\(actor\)\) \}/, 'peran penutup diambil dari klien')
assert.match(idx, /addAudit\(actor, 'emr\.encounter_closed', patientId\)/, 'penutupan kunjungan tidak diaudit')
assert.match(baca('server/src/aksesKlinis.ts'), /encounters: pilih\(c\.encounters \?\? \{\}\)/, 'kunjungan pasien lain bocor lewat \/api\/clinical')
assert.match(baca('src/lib/useLongitudinalState.ts'), /Object\.values\(server\.encounters\)\.flat\(\), \.\.\.Object\.values\(server\.records\)/, 'kunjungan tertutup hilang dari status longitudinal')
const ui = baca('src/components/KunjunganEmr.tsx')
assert.match(ui, /return klinisi && !dirty && Boolean\(r\.signedAt && r\.signedById\)/, 'tombol tutup aktif untuk rekam belum bertanda tangan server')
assert.match(ui, /terapkanRekamServer\(r\.record\)/, 'draf baru dari server tidak diterapkan')
assert.match(baca('src/pages/EMR.tsx'), /<KunjunganEmr record=\{draft\} dirty=\{dirty\}/)
assert.match(baca('server/package.json'), /uji\/kunjunganKlinis\.uji\.ts/, 'uji kernel kunjungan tidak dijalankan')
console.log('kunjungan-emr: rute berakses & diaudit, kunjungan tercakup per pasien, tetap di status longitudinal, UI hanya menutup rekam bertanda tangan server')
