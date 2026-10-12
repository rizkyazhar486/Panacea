import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { tzOffsetMenit, waktuLokalPengguna } from '../src/shared/userLocalTime.js'

const NOW = Date.UTC(2026, 9, 12, 20, 30, 0) // 2026-10-12 20:30 UTC (injeksi, bukan jam nyata)

// Positif: Jakarta +420 melewati tengah malam ke hari berikutnya
assert.equal(tzOffsetMenit({ tzOffsetMin: 420 }), 420)
assert.equal(waktuLokalPengguna({ tzOffsetMin: 420 }, NOW).toISOString(), '2026-10-13T03:30:00.000Z')
assert.equal(waktuLokalPengguna({ tzOffsetMin: -300 }, NOW).toISOString(), '2026-10-12T15:30:00.000Z')

// Batas berpasangan: tepat di batas diterima, satu menit di luar → UTC (0)
assert.equal(tzOffsetMenit({ tzOffsetMin: 840 }), 840)
assert.equal(tzOffsetMenit({ tzOffsetMin: 841 }), 0)
assert.equal(tzOffsetMenit({ tzOffsetMin: -720 }), -720)
assert.equal(tzOffsetMenit({ tzOffsetMin: -721 }), 0)
assert.equal(tzOffsetMenit({ tzOffsetMin: 0 }), 0)

// Negatif: bukan bilangan bulat terbatas → 0, dan TIDAK melempar saat diformat (regresi RangeError)
for (const bad of [1e12, -1e12, 1e308, Infinity, -Infinity, NaN, 330.5, '420', null, undefined, {}, [], true]) {
  assert.equal(tzOffsetMenit({ tzOffsetMin: bad }), 0, String(bad))
  assert.equal(waktuLokalPengguna({ tzOffsetMin: bad }, NOW).toISOString(), '2026-10-12T20:30:00.000Z', String(bad))
}
assert.equal(tzOffsetMenit({}), 0, 'setelan tanpa offset')

// Determinisme
assert.equal(waktuLokalPengguna({ tzOffsetMin: 420 }, NOW).getTime(), waktuLokalPengguna({ tzOffsetMin: 420 }, NOW).getTime())

// Regresi struktural: pemeriksa pengingat memakai helper bersama, bukan `Number(prefs.tzOffsetMin)` mentah
for (const f of ['src/aturanNotif.ts', 'src/healthAlerts.ts', 'src/pengingatCek.ts']) {
  assert.doesNotMatch(readFileSync(f, 'utf8'), /Number\(prefs\.tzOffsetMin\)/, `${f} must use shared userLocalTime`)
}
console.log('userLocalTime ok')
