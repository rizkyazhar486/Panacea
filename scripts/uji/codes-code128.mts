// Code 128 encoder (src/domains/codes/engine/code128.ts). Pinned to things independent of the encoder:
//  - the symbol table: all 107 rows equal an independent table, each sums to 11 modules (stop 13) and no two are equal;
//  - the worked example in the Code 128 article of Wikipedia ("PJJ123C" in set B) written out by hand;
//  - known-answer bit strings from an independent implementation (JsBarcode 3.11.6, MIT) for sets B and C, including
//    the odd-length number that starts in set B and continues in set C;
//  - the check character is the weighted sum modulo 103 (recomputed here, not copied).
import assert from 'node:assert/strict'
import { code128Bits, code128Pattern, code128SvgPath, encodeCode128, type Code128 } from '../../src/domains/codes/engine/code128.ts'

const gagal = (nama: string, fn: () => void) => { try { fn() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const must = (text: string): Code128 => {
  const r = encodeCode128(text)
  assert.ok(r.ok, `expected a barcode, got ${JSON.stringify(r)}`)
  return r.ok ? r.code : (undefined as never)
}

// All 107 symbols as bit strings (1 = bar module) from an independent implementation: pins every row of the table,
// not just the symbols a few sample texts happen to use.
const SYMBOL_BITS: readonly string[] = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100', '10001001100',
  '10011001000', '10011000100', '10001100100', '11001001000', '11001000100', '11000100100',
  '10110011100', '10011011100', '10011001110', '10111001100', '10011101100', '10011100110',
  '11001110010', '11001011100', '11001001110', '11011100100', '11001110100', '11101101110',
  '11101001100', '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000', '10001000110',
  '10110001000', '10001101000', '10001100010', '11010001000', '11000101000', '11000100010',
  '10110111000', '10110001110', '10001101110', '10111011000', '10111000110', '10001110110',
  '11101110110', '11010001110', '11000101110', '11011101000', '11011100010', '11011101110',
  '11101011000', '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100', '10010110000',
  '10010000110', '10000101100', '10000100110', '10110010000', '10110000100', '10011010000',
  '10011000010', '10000110100', '10000110010', '11000010010', '11001010000', '11110111010',
  '11000010100', '10001111010', '10100111100', '10010111100', '10010011110', '10111100100',
  '10011110100', '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110', '10111101000',
  '10111100010', '11110101000', '11110100010', '10111011110', '10111101110', '11101011110',
  '11110101110', '11010000100', '11010010000', '11010011100', '1100011101011',
]
const bitsOf = (pattern: string) => Array.from(pattern, Number).map((w, i) => (i % 2 === 0 ? '1' : '0').repeat(w)).join('')

gagal('tabel-simbol', () => {
  assert.equal(SYMBOL_BITS.length, 107)
  for (let v = 0; v < 107; v += 1) assert.equal(bitsOf(code128Pattern(v)), SYMBOL_BITS[v], `symbol ${v} equals the independent table`)
  const rows = Array.from({ length: 107 }, (_, v) => code128Pattern(v))
  rows.forEach((p, v) => {
    const sum = Array.from(p, Number).reduce((a, b) => a + b, 0)
    assert.equal(sum, v === 106 ? 13 : 11, `symbol ${v} width`)
    assert.equal(p.length, v === 106 ? 7 : 6, `symbol ${v} element count`)
  })
  assert.equal(new Set(rows).size, 107, 'all 107 patterns differ')
})

gagal('contoh-kerja-PJJ123C', () => {
  const code = must('PJJ123C')
  // start B (104), P J J 1 2 3 C = value of ASCII code - 32, then check, then stop
  assert.deepEqual(code.values.slice(0, 8), [104, 48, 42, 42, 17, 18, 19, 35])
  const sum = 104 + 48 * 1 + 42 * 2 + 42 * 3 + 17 * 4 + 18 * 5 + 19 * 6 + 35 * 7
  assert.equal(code.values[8], sum % 103)
  assert.equal(code.values[9], 106)
  assert.equal(code.sets, 'B')
})

// Bit strings (1 = bar module) from an independent implementation.
const KAT: { text: string; sets: Code128['sets']; bits: string }[] = [
  { text: 'PJJ123C', sets: 'B', bits: '1101001000011101110110101101110001011011100010011100110110011100101100101110010001000110111010001101100011101011' },
  { text: '1234', sets: 'C', bits: '110100111001011001110010001011000100100111101100011101011' },
]
gagal('bit-sama-dengan-implementasi-independen', () => {
  for (const k of KAT) {
    const code = must(k.text)
    assert.equal(code.sets, k.sets, k.text)
    assert.equal(code128Bits(code), k.bits, k.text)
    assert.equal(code.modules, k.bits.length, `${k.text}: width in modules`)
  }
})

gagal('pemilihan-set-dan-angka-ganjil', () => {
  assert.equal(must('MRN-2026-0042').sets, 'B')
  assert.equal(must('12').sets, 'B', 'two digits are too short to pay for a switch')
  assert.equal(must('123').sets, 'B')
  assert.equal(must('1234').sets, 'C')
  assert.equal(must('12345').sets, 'B+C', 'an odd count starts with one digit in set B')
  assert.deepEqual(must('12345').values.slice(0, 4), [104, 17, 99, 23], 'start B, "1", switch to C, then 23')
  // Paired: one letter makes the same digits set B only.
  assert.equal(must('x12345').sets, 'B')
  // Numbers use fewer symbols than the same text in set B (the reason set C exists).
  assert.ok(must('8992745100012').values.length < must('x992745100012').values.length)
  const check = (text: string) => { const c = must(text); let s = c.values[0]; for (let i = 1; i < c.values.length - 2; i += 1) s += c.values[i] * i; return c.values[c.values.length - 2] === s % 103 }
  for (const t of ['A', 'PM-1234', '12345', '8992745100012', 'Lot 7 / 2026-11']) assert.ok(check(t), t)
})

gagal('lebar-modul-dan-jalur-svg', () => {
  const code = must('A')
  // start (11) + 1 data (11) + check (11) + stop (13)
  assert.equal(code.modules, 46)
  assert.equal(code.widths.reduce((a, b) => a + b, 0), 46)
  const path = code128SvgPath(code, 40, 10)
  const barModules = [...path.matchAll(/h(\d+)v40/g)].reduce((s, m) => s + Number(m[1]), 0)
  assert.equal(barModules, code128Bits(code).split('').filter((b) => b === '1').length, 'every bar module is drawn once')
  assert.ok(path.startsWith('M10 0'), 'the first bar starts after the quiet zone')
  assert.equal(path, code128SvgPath(code, 40, 10), 'deterministic')
})

gagal('penolakan', () => {
  assert.deepEqual(encodeCode128(''), { ok: false, reason: 'empty' })
  assert.deepEqual(encodeCode128(null as unknown as string), { ok: false, reason: 'bad-input' })
  assert.deepEqual(encodeCode128(12345 as unknown as string), { ok: false, reason: 'bad-input' })
  for (const bad of ['é', 'tab\there', 'line\nbreak', '日本', 'del\x7f']) assert.deepEqual(encodeCode128(bad), { ok: false, reason: 'unsupported-character' }, JSON.stringify(bad))
  // Paired: the boundary characters themselves are accepted.
  assert.equal(encodeCode128(' ').ok, true)
  assert.equal(encodeCode128('~').ok, true)
})

console.log('codes-code128: symbol table, worked example, bit strings equal to an independent implementation, set choice, check character, SVG path and refusals verified')
