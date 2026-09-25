import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { putusanPengingatCek, PESAN_PENGINGAT_CEK } from '../src/pengingatCek.js'
import { stripServerOwnedSettings } from '../src/store.js'

// Jakarta (+420): 19:00 lokal = 12:00Z.
const t = Date.parse('2026-09-25T12:00:00Z')
const p = { notifCekHarian: true, cekHarianHHMM: '19:00', tzOffsetMin: 420 }
assert.equal(putusanPengingatCek(p, t, true, []).alasan, 'send')
assert.equal(putusanPengingatCek({ ...p, notifCekHarian: undefined }, t, true, []).alasan, 'off', 'bawaan harus mati (opt-in)')
assert.equal(putusanPengingatCek(p, t, false, []).alasan, 'no-plan', 'tanpa rencana aktif (izin dicabut) tidak boleh mengingatkan')
assert.equal(putusanPengingatCek(p, t, true, ['2026-09-25']).alasan, 'done-today', 'sudah mengisi hari ini tetap diingatkan')
assert.equal(putusanPengingatCek(p, t + 10 * 60e3, true, []).alasan, 'not-time')
assert.equal(putusanPengingatCek({ ...p, cekHarianLastFiredOn: '2026-09-25' }, t, true, []).alasan, 'already-today')
// Tanggal lokal, bukan UTC: 23:59 Jakarta tanggal 25 = 16:59Z; 00:30 Jakarta tanggal 26 = 17:30Z tanggal 25.
assert.equal(putusanPengingatCek({ ...p, cekHarianHHMM: '00:30' }, Date.parse('2026-09-25T17:30:00Z'), true, ['2026-09-25']).alasan, 'send', 'laporan kemarin dianggap hari ini — tanggal UTC dipakai')
assert.equal(putusanPengingatCek({ ...p, cekHarianHHMM: '24:00' }, t, true, []).alasan, 'no-target')
// Tanpa PHI di layar kunci.
assert.ok(!/@|dx|diagnos|hypertension|mmHg/i.test(JSON.stringify(PESAN_PENGINGAT_CEK)))
// Penjaga sekali sehari tidak boleh ditulis klien.
assert.ok(stripServerOwnedSettings({ cekHarianLastFiredOn: '2099-01-01' }).rejected.includes('cekHarianLastFiredOn'), 'klien dapat menulis penjaga sekali-sehari')
const idx = readFileSync('src/index.ts', 'utf8')
assert.match(idx, /putusanPengingatCek\(prefs, kini\.getTime\(\), aktif\.length > 0, sudah\)/, 'penjadwal tidak memakai putusanPengingatCek')
assert.match(idx, /izinBerlaku\(listLabShares\(\)\.find\(\(i\) => i\.id === x\.izinId\), x\.dokterEmail, kini\)\)\s*\n\s*const sudah/, 'rencana aktif tidak memeriksa izin')
console.log('pengingatCek: opt-in, izin aktif, belum mengisi, jam & tanggal lokal, sekali sehari, tanpa PHI')
