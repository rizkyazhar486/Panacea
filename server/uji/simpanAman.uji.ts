import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { tulisAtomik, amankanBerkasRusak, catatBerhasil, catatGagal, penyimpananSehat, status, AMBANG_PERINGATAN } from '../src/simpanAman.js'

const dir = mkdtempSync(join(tmpdir(), 'simpan-'))
const f = join(dir, 'data.json')
tulisAtomik(f, '{"a":1}')
assert.equal(readFileSync(f, 'utf8'), '{"a":1}')
assert.deepEqual(readdirSync(dir), ['data.json'], 'berkas sementara tertinggal')

// Berkas rusak dipindahkan, tidak dihapus/ditimpa.
writeFileSync(f, '{"users":[{"email":"x"')
const ke = amankanBerkasRusak(f, new Date('2026-09-25T00:00:00Z'))
assert.ok(ke && existsSync(ke) && !existsSync(f), 'berkas rusak tidak diamankan')
assert.equal(readFileSync(ke!, 'utf8'), '{"users":[{"email":"x"')

// Kegagalan dan ukuran tampak.
catatBerhasil(100); assert.equal(penyimpananSehat(), true)
catatGagal(new Error('network')); catatGagal(new Error('network'))
assert.equal(status.gagalBeruntun, 2); assert.equal(penyimpananSehat(), false, 'kegagalan simpan tidak tampak')
catatBerhasil(100); assert.equal(status.gagalBeruntun, 0)
catatBerhasil(AMBANG_PERINGATAN); assert.equal(penyimpananSehat(), false, 'dokumen mendekati 16 MB tidak tampak')
catatBerhasil(100)

// store.ts: tidak lagi menelan kegagalan MongoDB, dan berkas rusak diamankan saat muat.
const store = readFileSync('src/store.ts', 'utf8')
assert.ok(!/updateOne\([^)]*\)[^\n]*\.catch\(\(\) => \{\}\)/.test(store), 'simpan MongoDB kembali menelan galat')
assert.match(store, /catch \(e\) \{\s*\/\/[^\n]*\n\s*const ke = amankanBerkasRusak\(DB_PATH\)/, 'muat berkas rusak tidak mengamankan berkas')
assert.match(store, /tulisAtomik\(DB_PATH, teks\)/, 'simpan berkas tidak atomik')
console.log('simpanAman: tulis atomik, berkas rusak diamankan, kegagalan & ukuran tampak')
