import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SALAT_LEAD_DEFAULT_MIN, salatLeadMinutes } from '../src/modules/prayer/domain/leadMinutes.ts'

// Positif: nilai sah dipakai apa adanya.
assert.equal(salatLeadMinutes(10), 10)
assert.equal(salatLeadMinutes(0), 0, '0 = tepat waktu, keputusan eksplisit, bukan "kosong"')

// Negatif: tak terbaca → bawaan 5, bukan NaN (NaN membuat pengingat terkirim di menit yang salah).
for (const buruk of [undefined, null, '', ' ', 'abc', '10', NaN, Infinity, -Infinity, {}, [], true]) {
  assert.equal(salatLeadMinutes(buruk), SALAT_LEAD_DEFAULT_MIN, `masukan ${String(buruk)} harus jatuh ke bawaan`)
}

// Batas berpasangan: 60/61 dan 0/-1.
assert.equal(salatLeadMinutes(60), 60)
assert.equal(salatLeadMinutes(61), 60)
assert.equal(salatLeadMinutes(0), 0)
assert.equal(salatLeadMinutes(-1), 0)
assert.equal(salatLeadMinutes(2.5), 3, 'pecahan dibulatkan agar judul notifikasi tidak "2.5 menit"')

// Determinisme.
assert.equal(salatLeadMinutes(7), salatLeadMinutes(7))

// Regresi: salat.ts memakai fungsi ini, bukan pola `Number(...) ?? 5` yang mati.
const src = readFileSync('src/domains/lifestyle/salat.ts', 'utf8')
assert.match(src, /salatLeadMinutes\(prefs\.salatLeadMin\)/)
assert.doesNotMatch(src, /Number\(prefs\.salatLeadMin\)\s*\?\?/)
console.log('salatLead.uji ok')
