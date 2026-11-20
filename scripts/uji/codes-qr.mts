// QR Code encoder (src/domains/codes/engine/qr.ts): the point of a QR code is that a phone camera can read it, so this
// test pins the encoder to things that do not depend on its own code:
//  - capacities and format/version information published in ISO/IEC 18004 (Tables 7, 12, Annex D);
//  - known-answer hashes of whole symbols produced by an independent implementation (qrcode 1.5.4, MIT), forced to the
//    same version, error-correction level, mask and byte mode, covering version information (v7+), the 16-bit count
//    (v10+), multi-block interleaving and the v32 alignment-spacing exception;
//  - the symbol's own structure (finder, separator, timing, dark module, both copies of format/version bits).
// The same encoder was also decoded with two other decoders when written (see the PR description); that evidence cannot
// run here because the repository carries no decoder.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { encodeQr, formatInformation, maskPenalty, qrByteCapacity, qrSvgPath, QR_MAX_VERSION, type QrCode, type QrEcc } from '../../src/domains/codes/engine/qr.ts'

const gagal = (nama: string, fn: () => void) => { try { fn() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const must = (text: string, options: Parameters<typeof encodeQr>[1] = {}): QrCode => {
  const r = encodeQr(text, options)
  assert.ok(r.ok, `expected a code, got ${JSON.stringify(r)}`)
  return r.ok ? r.code : (undefined as never)
}
const fill = (n: number, seed = 0) => Array.from({ length: n }, (_, i) => String.fromCharCode(97 + ((i * 7 + seed) % 26))).join('')
const hash = (rows: readonly (readonly boolean[])[]) => createHash('sha256').update(rows.map((r) => r.map((d) => (d ? '1' : '0')).join('')).join('\n')).digest('hex')

// ── 1. Capacities: ISO/IEC 18004 Table 7, byte mode (positive, and one byte past each limit is refused) ──
gagal('kapasitas-byte-sesuai-standar', () => {
  const table: Record<string, [number, QrEcc, number][]> = {
    v1: [[1, 'L', 17], [1, 'M', 14], [1, 'Q', 11], [1, 'H', 7]],
    v9: [[9, 'L', 230], [9, 'M', 180]],
    v10: [[10, 'L', 271], [10, 'M', 213], [10, 'Q', 151], [10, 'H', 119]],
    v40: [[40, 'L', 2953], [40, 'M', 2331], [40, 'Q', 1663], [40, 'H', 1273]],
  }
  for (const rows of Object.values(table)) for (const [v, ecc, cap] of rows) {
    assert.equal(qrByteCapacity(v, ecc), cap, `v${v}-${ecc}`)
    assert.equal(must(fill(cap), { ecc, minVersion: v, maxVersion: v }).version, v, `v${v}-${ecc} holds exactly its capacity`)
    assert.deepEqual(encodeQr(fill(cap + 1), { ecc, minVersion: v, maxVersion: v }), { ok: false, reason: 'too-long' }, `v${v}-${ecc} refuses one byte more`)
  }
})

// ── 2. Known answers from an independent generator ──
const KAT: { name: string; text: string; ecc: QrEcc; mask: number; version?: number; sha256: string }[] = [
  { name: 'v1-L one byte', text: 'A', ecc: 'L', mask: 0, sha256: 'f195dbbdf146dae0ddeba600cfb966e631eeab6cbf78410286bda1914ca89458' },
  { name: 'v1-Q full (11 bytes)', text: 'HELLO WORLD', ecc: 'Q', mask: 5, sha256: '2edf7aa91250e43a543e1296c6ab2bce5ff2be42d191fa570b3a813357456b6f' },
  { name: 'v3-M app link', text: 'https://www.panaceamed.id/#/health-data', ecc: 'M', mask: 2, sha256: '57647f1b8b2363fceb3068bbba127fdb39e1edaa8c96bb4bd4ccaef689a4803b' },
  { name: 'auto-H medical text', text: 'Panacea emergency card\nBlood type: O+\nAllergies: penicillin', ecc: 'H', mask: 7, sha256: 'f979e32467c21dff0ba8f47b5c4fc87ed833b61b629f9af1d9f92c7ae9a419b6' },
  { name: 'v7-M full (version info)', text: fill(qrByteCapacity(7, 'M'), 1), ecc: 'M', version: 7, mask: 1, sha256: '86ccf787b51332d1c9bbf760088a8466075c3bb809eb145d374761f3872c1dc6' },
  { name: 'v10-L (16-bit count)', text: fill(qrByteCapacity(10, 'L'), 2), ecc: 'L', version: 10, mask: 3, sha256: 'f3e6aad39dfb0c17c7a5dcad001eaa46e65f5f4b86eb6fc0baf1bafe12ab5a8a' },
  { name: 'v14-Q full', text: fill(qrByteCapacity(14, 'Q'), 3), ecc: 'Q', version: 14, mask: 6, sha256: '9c66f3cf87e165062b55c8524e5bf66c04ed2eb3d6bbe75ce2d80cd461a4a2fd' },
  { name: 'v25-H full', text: fill(qrByteCapacity(25, 'H'), 4), ecc: 'H', version: 25, mask: 4, sha256: '4ee591549e95c5eee316dbab8750cf537aeccb15e97b02ead69754d797f3e7b2' },
  { name: 'v32-L full (alignment exception)', text: fill(qrByteCapacity(32, 'L'), 5), ecc: 'L', version: 32, mask: 3, sha256: '8ce16f71e2af2bc5de48710c602fcedcefe4fba382ad5fe7b3e0f49c3c1830e5' },
  { name: 'v40-H full', text: fill(qrByteCapacity(40, 'H'), 6), ecc: 'H', version: 40, mask: 5, sha256: '7a96680d9b620069a34e2570dab95345ac2a12dc07b0eb6fa00c49a3ab132731' },
]
gagal('simbol-sama-bit-demi-bit-dengan-generator-independen', () => {
  for (const k of KAT) {
    const code = must(k.text, { ecc: k.ecc, mask: k.mask, ...(k.version ? { minVersion: k.version, maxVersion: k.version } : {}) })
    assert.equal(hash(code.modules), k.sha256, k.name)
  }
  // Paired: the hash is sensitive to exactly one forced mask and one changed byte.
  const base = KAT[2]
  assert.notEqual(hash(must(base.text, { ecc: base.ecc, mask: 3 }).modules), base.sha256, 'another mask gives another symbol')
  assert.notEqual(hash(must(base.text.replace('data', 'dota'), { ecc: base.ecc, mask: base.mask }).modules), base.sha256, 'another byte gives another symbol')
})

// ── 3. Format and version information (Annex C/D golden values) ──
gagal('informasi-format-dan-versi-sesuai-standar', () => {
  assert.equal(formatInformation('L', 0), 0x77c4)
  assert.equal(formatInformation('M', 0), 0x5412)
  assert.equal(formatInformation('Q', 0), 0x355f)
  assert.equal(formatInformation('H', 0), 0x1689)
  const readVersion = (code: QrCode, swap: boolean) => {
    let bits = 0
    for (let i = 0; i < 18; i += 1) {
      const a = code.size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      if (swap ? code.modules[a][b] : code.modules[b][a]) bits |= 1 << i
    }
    return bits
  }
  for (const [v, expected] of [[7, 0x07c94], [8, 0x085bc], [9, 0x09a99], [10, 0x0a4d3], [20, 0x149a6], [40, 0x28c69]] as const) {
    const code = must('a', { minVersion: v, maxVersion: v })
    assert.equal(readVersion(code, false), expected, `version ${v}, first copy`)
    assert.equal(readVersion(code, true), expected, `version ${v}, second copy`)
  }
  // Negative: below version 7 the standard has no version information, so those cells carry data or stay light and are not a version word.
  const v6 = must('a', { minVersion: 6, maxVersion: 6 })
  assert.notEqual(readVersion(v6, false), 0x07c94)
})

// ── 4. Structure of the symbol ──
gagal('struktur-simbol', () => {
  for (const [text, ecc] of [['A', 'L'], [fill(122), 'M'], [fill(258), 'Q']] as const) {
    const code = must(text, { ecc })
    const { size, modules: m } = code
    assert.equal(size, code.version * 4 + 17)
    assert.equal(m.length, size); assert.ok(m.every((row) => row.length === size))
    // finder pattern at the three corners: 7x7 dark ring, light ring, 3x3 dark centre; light separator beyond it
    for (const [ox, oy] of [[0, 0], [size - 7, 0], [0, size - 7]]) {
      for (let dy = 0; dy < 7; dy += 1) for (let dx = 0; dx < 7; dx += 1) {
        const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3))
        assert.equal(m[oy + dy][ox + dx], ring !== 2, `finder at ${ox},${oy} cell ${dx},${dy}`)
      }
    }
    for (let i = 0; i < 8; i += 1) { assert.equal(m[7][i], false); assert.equal(m[i][7], false) } // top-left separators
    for (let i = 8; i < size - 8; i += 1) { assert.equal(m[6][i], i % 2 === 0, `timing row ${i}`); assert.equal(m[i][6], i % 2 === 0, `timing col ${i}`) }
    assert.equal(m[size - 8][8], true, 'the always-dark module')
    // both copies of the 15 format bits equal the BCH word for the declared level and mask
    const want = formatInformation(code.ecc, code.mask)
    let a = 0; let b = 0
    const first = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]] // [x, y] for bits 0..14
    first.forEach(([x, y], i) => { if (m[y][x]) a |= 1 << i })
    for (let i = 0; i < 8; i += 1) if (m[8][size - 1 - i]) b |= 1 << i
    for (let i = 8; i < 15; i += 1) if (m[size - 15 + i][8]) b |= 1 << i
    assert.equal(a, want, 'format bits, copy around the top-left finder')
    assert.equal(b, want, 'format bits, copy split over the other two finders')
  }
})

// ── 5. Version selection and the cost of non-ASCII (ECI) ──
gagal('pemilihan-versi-dan-biaya-eci', () => {
  assert.equal(must(fill(qrByteCapacity(1, 'L')), { ecc: 'L' }).version, 1)
  assert.equal(must(fill(qrByteCapacity(1, 'L') + 1), { ecc: 'L' }).version, 2)
  assert.equal(must(fill(qrByteCapacity(9, 'M')), { ecc: 'M' }).version, 9)
  assert.equal(must(fill(qrByteCapacity(9, 'M') + 1), { ecc: 'M' }).version, 10) // the character count grows from 8 to 16 bits here
  // 17 bytes fill version 1-L; the same 17 bytes with one non-ASCII character need the 12-bit ECI header, so version 2.
  assert.equal(must('a'.repeat(17), { ecc: 'L' }).version, 1)
  assert.equal(must('a'.repeat(15) + 'é', { ecc: 'L' }).version, 2)
  // A higher level never needs a smaller version than a lower one for the same text.
  const text = fill(100)
  const versions = (['L', 'M', 'Q', 'H'] as QrEcc[]).map((ecc) => must(text, { ecc }).version)
  assert.deepEqual(versions, [...versions].sort((x, y) => x - y))
  assert.ok(versions[3] > versions[0])
})

// ── 6. The chosen mask is the lowest-penalty mask, and the result is deterministic ──
gagal('mask-terbaik-dan-determinisme', () => {
  for (const text of ['https://www.panaceamed.id/#/emergency-card', fill(60, 3), '0123456789']) {
    const auto = must(text, { ecc: 'M' })
    const penalties = Array.from({ length: 8 }, (_, mask) => maskPenalty(must(text, { ecc: 'M', mask }).modules))
    assert.equal(maskPenalty(auto.modules), Math.min(...penalties))
    assert.equal(maskPenalty(auto.modules), penalties[auto.mask])
    assert.deepEqual(must(text, { ecc: 'M' }), auto)
  }
  assert.ok(maskPenalty(Array.from({ length: 21 }, () => new Array<boolean>(21).fill(false))) > maskPenalty(Array.from({ length: 21 }, (_, y) => Array.from({ length: 21 }, (_, x) => (x + y) % 2 === 0))), 'a blank grid is worse than a checkerboard')
})

// ── 7. Refusals: nothing is truncated or guessed ──
gagal('penolakan', () => {
  assert.deepEqual(encodeQr(''), { ok: false, reason: 'empty' })
  assert.deepEqual(encodeQr(123 as unknown as string), { ok: false, reason: 'bad-option' })
  assert.deepEqual(encodeQr(null as unknown as string), { ok: false, reason: 'bad-option' })
  assert.deepEqual(encodeQr(fill(qrByteCapacity(QR_MAX_VERSION, 'L') + 1), { ecc: 'L' }), { ok: false, reason: 'too-long' })
  assert.equal(must(fill(qrByteCapacity(QR_MAX_VERSION, 'L')), { ecc: 'L' }).version, QR_MAX_VERSION)
  // Paired: only the level differs, and 2000 bytes fit at L but not at H.
  assert.equal(encodeQr(fill(2000), { ecc: 'L' }).ok, true)
  assert.deepEqual(encodeQr(fill(2000), { ecc: 'H' }), { ok: false, reason: 'too-long' })
  // Paired: only maxVersion differs.
  const needsV5 = fill(qrByteCapacity(4, 'M') + 1)
  assert.deepEqual(encodeQr(needsV5, { maxVersion: 4 }), { ok: false, reason: 'too-long' })
  assert.equal(encodeQr(needsV5, { maxVersion: 5 }).ok, true)
  for (const bad of [{ ecc: 'X' as QrEcc }, { minVersion: 0 }, { maxVersion: 41 }, { minVersion: 5, maxVersion: 4 }, { minVersion: 1.5 }, { mask: 8 }, { mask: -1 }, { mask: 2.5 }]) {
    assert.deepEqual(encodeQr('a', bad), { ok: false, reason: 'bad-option' }, JSON.stringify(bad))
  }
})

// ── 8. Many random payloads stay self-consistent (size, level, mask readable) ──
gagal('banyak-muatan-acak-konsisten', () => {
  let seed = 20261116
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  for (let i = 0; i < 60; i += 1) {
    const ecc = (['L', 'M', 'Q', 'H'] as QrEcc[])[i % 4]
    const text = Array.from({ length: 1 + Math.floor(rnd() * 200) }, () => String.fromCharCode(32 + Math.floor(rnd() * 95))).join('')
    const code = must(text, { ecc })
    assert.equal(code.size, code.version * 4 + 17)
    assert.ok(code.version >= 1 && code.mask >= 0 && code.mask <= 7)
  }
})

// ── 9. SVG path: runs of dark modules, shifted by the quiet zone ──
gagal('jalur-svg', () => {
  const tiny = { version: 1, size: 3, ecc: 'L', mask: 0, modules: [[true, true, false], [false, true, true], [false, false, false]] } as unknown as QrCode
  assert.equal(qrSvgPath(tiny, 4), 'M4 4h2v1h-2zM5 5h2v1h-2z')
  assert.equal(qrSvgPath(tiny, 0), 'M0 0h2v1h-2zM1 1h2v1h-2z')
  assert.equal(qrSvgPath({ ...tiny, modules: [[false, false], [false, false]] } as unknown as QrCode), '', 'a blank grid has no dark module to draw')
  const real = must('https://www.panaceamed.id/')
  const dark = real.modules.flat().filter(Boolean).length
  const drawn = [...qrSvgPath(real).matchAll(/h(\d+)v1/g)].reduce((sum, m) => sum + Number(m[1]), 0)
  assert.equal(drawn, dark, 'every dark module is drawn exactly once')
})

console.log('codes-qr: capacities, 10 symbols equal to an independent generator, format/version words, structure, version selection, mask choice, refusals and SVG path verified')
