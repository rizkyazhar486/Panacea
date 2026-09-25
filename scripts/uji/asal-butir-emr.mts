import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { labelAsalMasalah, labelAsalRencana } from '../../src/lib/asalButirEmr.ts'
assert.equal(labelAsalMasalah({}), 'AI draft', 'masalah tanpa asal (data lama) tampil sebagai tulisan dokter')
assert.equal(labelAsalMasalah({ source: 'Dokter' }), 'doctor-written')
assert.equal(labelAsalMasalah({ source: 'AI', carriedFrom: 'r1' }), 'AI draft · carried from previous visit')
assert.equal(labelAsalRencana({ source: 'AI', status: 'usulan' }), 'AI suggestion · not verified')
assert.equal(labelAsalRencana({ source: 'Dokter', status: 'diverifikasi' }), 'verified · verifier not recorded', 'verifikasi tanpa cap server tampil sebagai terverifikasi dokter')
assert.equal(labelAsalRencana({ source: 'AI', status: 'diverifikasi', verifiedById: 'd1' }), 'doctor-verified')
const emr = readFileSync('src/pages/EMR.tsx', 'utf8')
assert.match(emr, /data-asal-masalah>\{labelAsalMasalah\(pr\)\}/, 'asal masalah tidak tampil di EMR')
assert.match(emr, /data-asal-rencana>\{labelAsalRencana\(pi\)\}/, 'asal rencana tidak tampil di EMR')
assert.match(readFileSync('server/package.json', 'utf8'), /"uji": [^\n]*uji\/asalButirKlinis\.uji\.ts/, 'uji asal per butir di server tidak dijalankan')
console.log('asal-butir-emr: asal per butir tampil, fail closed untuk data lama dan verifikasi tanpa cap server')
