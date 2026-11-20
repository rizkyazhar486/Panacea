import assert from 'node:assert/strict'
import { initialsOf, sanitizeDisplayName, sanitizeUsername } from '../../src/domains/identity/profileEdit.ts'

const ok = (r: ReturnType<typeof sanitizeDisplayName>) => { assert.equal(r.ok, true); return (r as { value: string }).value }
const bad = (r: ReturnType<typeof sanitizeDisplayName>) => { assert.equal(r.ok, false); return (r as { reason: string }).reason }

// nama: positif
assert.equal(ok(sanitizeDisplayName('  Ani   Pratiwi  ')), 'Ani Pratiwi', 'spasi dirapikan')
assert.equal(ok(sanitizeDisplayName('dr. Budi Santoso, Sp.PD')), 'dr. Budi Santoso, Sp.PD')
assert.equal(ok(sanitizeDisplayName('李小龍')), '李小龍', 'aksara non-Latin sah')
assert.equal(ok(sanitizeDisplayName('Ani\u0000\u0007 P')), 'Ani P', 'karakter kontrol dibuang')
// nama: batas (2 sah, 1 tidak; 60 sah, 61 tidak) — dihitung per code point
assert.equal(ok(sanitizeDisplayName('Al')), 'Al')
assert.match(bad(sanitizeDisplayName('A')), /at least 2/)
assert.equal(ok(sanitizeDisplayName('a'.repeat(60))).length, 60)
assert.match(bad(sanitizeDisplayName('a'.repeat(61))), /at most 60/)
assert.equal(ok(sanitizeDisplayName('😀'.repeat(60))).length, 120, '60 emoji = 60 code point, sah')
assert.match(bad(sanitizeDisplayName('😀'.repeat(61))), /at most 60/)
// nama: negatif
for (const v of ['', '   ', '\u0000\u0001', undefined, null, 42, {}]) assert.ok(bad(sanitizeDisplayName(v)).length > 0, String(v))

// username: positif
assert.equal(ok(sanitizeUsername('@Ani.Pratiwi_01')), 'ani.pratiwi_01', 'huruf kecil, @ dibuang')
assert.equal(ok(sanitizeUsername('@@abc')), 'abc')
assert.equal(ok(sanitizeUsername('a_b')), 'a_b')
// username: batas
assert.match(bad(sanitizeUsername('ab')), /at least 3/)
assert.equal(ok(sanitizeUsername('a'.repeat(30))).length, 30)
assert.match(bad(sanitizeUsername('a'.repeat(31))), /at most 30/)
// username: negatif (tiap aturan punya pasangan sah yang hanya beda pada aturan itu)
assert.match(bad(sanitizeUsername('ani pratiwi')), /letters, numbers/)
assert.match(bad(sanitizeUsername('ani-pratiwi')), /letters, numbers/)
assert.match(bad(sanitizeUsername('ani😀x')), /letters, numbers/)
assert.match(bad(sanitizeUsername('.ani')), /cannot start, end or repeat/)
assert.match(bad(sanitizeUsername('ani.')), /cannot start, end or repeat/)
assert.match(bad(sanitizeUsername('an..i')), /cannot start, end or repeat/)
assert.equal(ok(sanitizeUsername('an.i')), 'an.i')
for (const v of ['', '@', '   ', undefined, null, 7]) assert.ok(bad(sanitizeUsername(v)).length > 0, String(v))

// inisial
assert.equal(initialsOf('Ani Pratiwi'), 'AP')
assert.equal(initialsOf('  budi  '), 'B')
assert.equal(initialsOf('dr. Rizky Muhammad Azrissal'), 'DR')
assert.equal(initialsOf('李小龍'), '李')
assert.equal(initialsOf(''), '?')
assert.equal(initialsOf(undefined as unknown as string), '?')
assert.deepEqual(sanitizeDisplayName('Ani'), sanitizeDisplayName('Ani'))
console.log('profile-edit-rules: OK')
