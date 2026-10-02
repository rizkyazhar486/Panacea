// Simpan digabung per tick: beberapa mutasi dalam satu handler = satu serialisasi; tetap tertulis.
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const dir = mkdtempSync(join(tmpdir(), 'simpan-gabung-'))
process.env.PANACEA_DATA_FILE = join(dir, 'data.json')
const st = await import('../src/store.js')
await st.initStore()
const awal = st.statistikSimpan.serialisasi
st.saveSettings('u1', { a: 1 }); st.saveSettings('u2', { b: 2 }); st.saveSettings('u3', { c: 3 })
assert.equal(st.statistikSimpan.serialisasi, awal, 'belum diserialisasi di tengah handler')
await Promise.resolve()
assert.equal(st.statistikSimpan.serialisasi, awal + 1, 'tiga mutasi dalam satu tick = satu serialisasi')
const isi = JSON.parse(readFileSync(process.env.PANACEA_DATA_FILE!, 'utf8'))
assert.ok(JSON.stringify(isi).includes('"c":3'), 'mutasi terakhir ikut tertulis')
st.saveSettings('u4', { d: 4 }); st.flushSimpan()
assert.ok(readFileSync(process.env.PANACEA_DATA_FILE!, 'utf8').includes('"d": 4') || readFileSync(process.env.PANACEA_DATA_FILE!, 'utf8').includes('"d":4'), 'flushSimpan menulis seketika')
await Promise.resolve(); assert.equal(st.statistikSimpan.serialisasi, awal + 2, 'flush tidak memicu tulisan ganda')
console.log('simpanGabung: lulus')
