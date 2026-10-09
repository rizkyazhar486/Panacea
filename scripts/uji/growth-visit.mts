import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseWhoVisit, validateWhoGrowthInputs } from '../../src/domains/clinical-calculators/index.ts'

// Positif: kunjungan sah, termasuk lahir (usia "0" diketik) dan batas atas.
assert.deepEqual(parseWhoVisit('12', '9.6', '75.7'), { ok: true, data: { ageMo: 12, weightKg: 9.6, heightCm: 75.7 } })
assert.deepEqual(parseWhoVisit('0', '3.2', '50'), { ok: true, data: { ageMo: 0, weightKg: 3.2, heightCm: 50 } })
assert.deepEqual(parseWhoVisit('60', '60', '150'), { ok: true, data: { ageMo: 60, weightKg: 60, heightCm: 150 } })
// Regresi: usia KOSONG tidak lagi dibaca 0 bulan (dulu mencatat kunjungan lahir tanpa ada yang mengetik usia).
const kosong = parseWhoVisit('', '9.6', '75.7')
assert.deepEqual(kosong, { ok: false, reason: 'Age must be 0–60 months' })
assert.deepEqual(parseWhoVisit('   ', '9.6', '75.7'), kosong) // pasangan: hanya spasi sama dengan kosong
// Tiap kolom kosong/di luar rentang ditolak dengan alasan bernama; tidak ada data.
assert.deepEqual(parseWhoVisit('12', '', '75.7'), { ok: false, reason: 'Weight must be 0.5–60 kg' })
assert.deepEqual(parseWhoVisit('12', '9.6', ''), { ok: false, reason: 'Length/height must be 30–150 cm' })
assert.deepEqual(parseWhoVisit('600', '9.6', '75.7'), { ok: false, reason: 'Age must be 0–60 months' })
assert.deepEqual(parseWhoVisit('-1', '9.6', '75.7'), { ok: false, reason: 'Age must be 0–60 months' })
assert.deepEqual(parseWhoVisit('12', '0', '75.7'), { ok: false, reason: 'Weight must be 0.5–60 kg' })
assert.deepEqual(parseWhoVisit('12', '9.6', '1500'), { ok: false, reason: 'Length/height must be 30–150 cm' })
for (const bad of ['abc', 'Infinity', 'NaN', '1e999']) assert.equal(parseWhoVisit(bad, '9.6', '75.7').ok, false, bad)
// Batas: ±1 langkah di luar ditolak.
assert.equal(parseWhoVisit('60.01', '9.6', '75.7').ok, false); assert.equal(parseWhoVisit('12', '0.49', '75.7').ok, false); assert.equal(parseWhoVisit('12', '9.6', '29.99').ok, false)
// Konsisten dengan validator inti.
assert.equal(parseWhoVisit('12', '9.6', '75.7').ok, validateWhoGrowthInputs(12, 9.6, 75.7).ok)
assert.deepEqual(parseWhoVisit('12', '9.6', '75.7'), parseWhoVisit('12', '9.6', '75.7'))

const page = readFileSync(new URL('../../src/pages/ChildGrowthTracker.tsx', import.meta.url), 'utf8')
assert.ok(/parseWhoVisit\(ageText, weightText, heightText\)/.test(page), 'halaman tidak memakai parseWhoVisit')
assert.ok(!/\)\s*\|\|\s*0/.test(page), '`|| 0` kembali')
assert.ok(/if \(!parsed\.ok\) \{ setVisitError\(parsed\.reason\); return \}/.test(page), 'kunjungan tidak ditolak saat tidak sah')
assert.ok(/role="alert"[^>]*>\{visitError\}/.test(page), 'alasan penolakan tidak ditampilkan')
console.log('growth-visit: usia kosong ≠ 0 bulan, rentang 0–60 bln / 0,5–60 kg / 30–150 cm, penolakan bernama tanpa efek samping')
