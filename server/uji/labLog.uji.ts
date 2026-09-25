import assert from 'node:assert/strict'
import { validasiLogLab, validasiCapWaktu, terimaTulisan, MAKS_BUTIR_PER_JENIS } from '../src/labLog.js'

const kini = new Date('2026-09-25T06:00:00Z')
const ok = { gdp: [{ id: 'gdp-1', tanggal: '2026-09-20', nilai: 92 }, { id: 'gdp-0', tanggal: '2026-01-02', nilai: 88 }] }
// Butir sah diterima dan diurutkan menurut tanggal ambil darah.
assert.deepEqual(validasiLogLab(ok, kini).gdp.map((b) => b.id), ['gdp-0', 'gdp-1'])
// Bidang tambahan dibuang, bukan disimpan.
assert.deepEqual(Object.keys(validasiLogLab({ gdp: [{ id: 'a', tanggal: '2026-09-20', nilai: 1, catatanRahasia: 'x' }] }, kini).gdp[0]).sort(), ['id', 'nilai', 'tanggal'])
// Tolak: bukan objek, tanggal masa depan, nilai ≤0/NaN, id berbahaya, terlalu banyak.
for (const buruk of [
  null, [], 'x',
  { gdp: [{ id: 'a', tanggal: '2026-09-30', nilai: 1 }] },
  { gdp: [{ id: 'a', tanggal: '2026-09-20', nilai: 0 }] },
  { gdp: [{ id: 'a', tanggal: '2026-09-20', nilai: Number.NaN }] },
  { gdp: [{ id: 'a', tanggal: '2026-09-20', nilai: '90' }] },
  JSON.parse('{"__proto__":[{"id":"a","tanggal":"2026-09-20","nilai":1}]}'), { constructor: [] }, { 'GDP!': [] },
  { gdp: [{ id: '../x', tanggal: '2026-09-20', nilai: 1 }] },
  { gdp: Array.from({ length: MAKS_BUTIR_PER_JENIS + 1 }, (_, i) => ({ id: `a${i}`, tanggal: '2026-09-20', nilai: 1 })) },
]) assert.throws(() => validasiLogLab(buruk, kini), `masukan buruk diterima: ${JSON.stringify(buruk)?.slice(0, 80)}`)
// Toleransi zona waktu satu hari.
assert.doesNotThrow(() => validasiLogLab({ gdp: [{ id: 'a', tanggal: '2026-09-26', nilai: 1 }] }, kini))
// Cap waktu.
assert.throws(() => validasiCapWaktu('2026-09-25T07:00:00Z', kini))
assert.throws(() => validasiCapWaktu('kemarin', kini))
// Yang terakhir menang; tulisan lama tidak menimpa (penghapusan tidak dihidupkan lagi).
const lama = { log: {}, diperbaruiPada: '2026-09-25T05:00:00.000Z' }
const baru = { log: ok, diperbaruiPada: '2026-09-25T05:30:00.000Z' }
assert.equal(terimaTulisan(baru, lama).diterima, false)
assert.equal(terimaTulisan(lama, baru).diterima, true)
assert.equal(terimaTulisan(undefined, lama).diterima, true)
console.log('labLog: validasi batas kepercayaan, toleransi zona waktu, dan yang-terakhir-menang lulus')
