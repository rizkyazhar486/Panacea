/**
 * QR Code encoder (ISO/IEC 18004 Model 2), byte mode, versions 1-40, error correction L/M/Q/H.
 *
 * Why this exists: a QR code is only useful if an ordinary phone camera can read it. A grid that merely looks like one
 * (finder squares plus noise) reads as nothing. This module follows the standard's data layout, Reed-Solomon error
 * correction, function patterns, masking and format/version information, and is verified by reading its own output
 * back (scripts/uji/codes-qr.mts) and by decoding rendered images with an independent decoder.
 *
 * Scope: text only (UTF-8 bytes; an ECI header is added when any byte is non-ASCII so readers decode it as UTF-8).
 * Pure and deterministic: no DOM, clock or randomness. Text is data to encode, never interpreted.
 *
 * Block structure follows ISO/IEC 18004 Table 9; the mask penalty follows 7.8.3. The layout algorithm is the one
 * documented in Project Nayuki's QR Code generator (MIT), re-written here against the standard.
 */

export type QrEcc = 'L' | 'M' | 'Q' | 'H'
export type QrRefusal = 'empty' | 'too-long' | 'bad-option'

export interface QrOptions {
  readonly ecc?: QrEcc
  readonly minVersion?: number
  readonly maxVersion?: number
  /** Force one mask (0-7). Normal use leaves this out so the lowest-penalty mask is chosen. */
  readonly mask?: number
}

export interface QrCode {
  readonly version: number
  readonly size: number
  readonly ecc: QrEcc
  readonly mask: number
  /** modules[y][x] is true for a dark module. */
  readonly modules: readonly (readonly boolean[])[]
}

export type QrResult = { readonly ok: true; readonly code: QrCode } | { readonly ok: false; readonly reason: QrRefusal }

const ECC_INDEX: Readonly<Record<QrEcc, number>> = { L: 0, M: 1, Q: 2, H: 3 }
/** Two format-information bits per level (ISO/IEC 18004 Table 12): L=01, M=00, Q=11, H=10. */
const ECC_FORMAT_BITS: Readonly<Record<QrEcc, number>> = { L: 1, M: 0, Q: 3, H: 2 }

// Index [ecc][version]; index 0 of each row is unused. Error-correction codewords per block, and number of blocks.
const ECC_CODEWORDS_PER_BLOCK: readonly (readonly number[])[] = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
]
const NUM_BLOCKS: readonly (readonly number[])[] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
]

export const QR_MIN_VERSION = 1
export const QR_MAX_VERSION = 40

const sizeOf = (version: number) => version * 4 + 17

/** Modules left for data + error correction after all function patterns (ISO/IEC 18004 Annex). */
function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2
    result -= (25 * align - 10) * align - 55
    if (version >= 7) result -= 36
  }
  return result
}

/** Data codewords available at a version and level (what the payload may occupy). */
export function qrDataCodewords(version: number, ecc: QrEcc): number {
  const e = ECC_INDEX[ecc]
  return Math.floor(rawDataModules(version) / 8) - ECC_CODEWORDS_PER_BLOCK[e][version] * NUM_BLOCKS[e][version]
}

/** Largest UTF-8 payload (bytes) that fits at the given version and level in byte mode without an ECI header. */
export function qrByteCapacity(version: number, ecc: QrEcc): number {
  const countBits = version <= 9 ? 8 : 16
  return Math.floor((qrDataCodewords(version, ecc) * 8 - 4 - countBits) / 8)
}

// ── Reed-Solomon over GF(2^8), generator polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11D) ──
function gfMultiply(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = gfMultiply(result[j], root)
      if (j + 1 < result.length) result[j] ^= result[j + 1]
    }
    root = gfMultiply(root, 0x02)
  }
  return result
}

function rsRemainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result = divisor.map(() => 0)
  for (const b of data) {
    const factor = b ^ (result.shift() as number)
    result.push(0)
    divisor.forEach((coef, i) => { result[i] ^= gfMultiply(coef, factor) })
  }
  return result
}

/** Data codewords -> data + error correction, split in blocks and interleaved (ISO/IEC 18004 7.6). */
export function interleaveBlocks(data: readonly number[], version: number, ecc: QrEcc): number[] {
  const e = ECC_INDEX[ecc]
  const numBlocks = NUM_BLOCKS[e][version]
  const eccLen = ECC_CODEWORDS_PER_BLOCK[e][version]
  const rawCodewords = Math.floor(rawDataModules(version) / 8)
  const numShort = numBlocks - (rawCodewords % numBlocks)
  const shortLen = Math.floor(rawCodewords / numBlocks)
  const divisor = rsDivisor(eccLen)
  const blocks: number[][] = []
  for (let i = 0, k = 0; i < numBlocks; i += 1) {
    const len = shortLen - eccLen + (i < numShort ? 0 : 1)
    const dat = data.slice(k, k + len)
    k += len
    const rem = rsRemainder(dat, divisor)
    if (i < numShort) dat.push(0) // placeholder so every block has the same length; skipped when interleaving
    blocks.push(dat.concat(rem))
  }
  const out: number[] = []
  for (let i = 0; i < blocks[0].length; i += 1) {
    blocks.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= numShort) out.push(block[i])
    })
  }
  return out
}

// ── Bit buffer ──
function appendBits(buffer: number[], value: number, length: number): void {
  for (let i = length - 1; i >= 0; i -= 1) buffer.push((value >>> i) & 1)
}

const utf8 = new TextEncoder()

/** Mode indicator + (optional ECI 26 = UTF-8) + character count + bytes. */
function payloadBits(bytes: Uint8Array, version: number, needsEci: boolean): number[] {
  const bits: number[] = []
  if (needsEci) { appendBits(bits, 0b0111, 4); appendBits(bits, 26, 8) }
  appendBits(bits, 0b0100, 4)
  appendBits(bits, bytes.length, version <= 9 ? 8 : 16)
  bytes.forEach((b) => appendBits(bits, b, 8))
  return bits
}

// ── Function patterns and drawing ──
class Matrix {
  readonly version: number
  readonly size: number
  readonly modules: boolean[][]
  readonly isFunction: boolean[][]
  constructor(version: number) {
    this.version = version
    this.size = sizeOf(version)
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false))
    this.isFunction = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false))
  }
  setFunction(x: number, y: number, dark: boolean): void { this.modules[y][x] = dark; this.isFunction[y][x] = true }
}

const bit = (value: number, i: number) => ((value >>> i) & 1) !== 0

function alignmentPositions(version: number): number[] {
  if (version === 1) return []
  const count = Math.floor(version / 7) + 2
  // Spread count-1 gaps over the 4v+4 modules between the first (6) and last (size-7) centre; v32 is the standard's exception.
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2
  const result = [6]
  for (let pos = sizeOf(version) - 7; result.length < count; pos -= step) result.splice(1, 0, pos)
  return result
}

function drawFunctionPatterns(m: Matrix): void {
  const { size } = m
  for (let i = 0; i < size; i += 1) { m.setFunction(6, i, i % 2 === 0); m.setFunction(i, 6, i % 2 === 0) }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        const x = cx + dx
        const y = cy + dy
        if (x >= 0 && x < size && y >= 0 && y < size) m.setFunction(x, y, dist !== 2 && dist !== 4)
      }
    }
  }
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4)
  const positions = alignmentPositions(m.version)
  const last = positions.length - 1
  positions.forEach((cx, i) => {
    positions.forEach((cy, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return // would overlap a finder
      for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) m.setFunction(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    })
  })
  drawFormatBits(m, 'L', 0) // reserve the cells; the real bits are drawn once the mask is chosen
  drawVersionBits(m)
}

/** 15-bit format information: 5 data bits + BCH(15,5) remainder, XOR 0x5412 (ISO/IEC 18004 7.9). */
export function formatInformation(ecc: QrEcc, mask: number): number {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return ((data << 10) | rem) ^ 0x5412
}

function drawFormatBits(m: Matrix, ecc: QrEcc, mask: number): void {
  const bits = formatInformation(ecc, mask)
  const { size } = m
  for (let i = 0; i <= 5; i += 1) m.setFunction(8, i, bit(bits, i))
  m.setFunction(8, 7, bit(bits, 6)); m.setFunction(8, 8, bit(bits, 7)); m.setFunction(7, 8, bit(bits, 8))
  for (let i = 9; i < 15; i += 1) m.setFunction(14 - i, 8, bit(bits, i))
  for (let i = 0; i < 8; i += 1) m.setFunction(size - 1 - i, 8, bit(bits, i))
  for (let i = 8; i < 15; i += 1) m.setFunction(8, size - 15 + i, bit(bits, i))
  m.setFunction(8, size - 8, true) // the always-dark module
}

function drawVersionBits(m: Matrix): void {
  if (m.version < 7) return
  let rem = m.version
  for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
  const bits = (m.version << 12) | rem
  for (let i = 0; i < 18; i += 1) {
    const a = m.size - 11 + (i % 3)
    const b = Math.floor(i / 3)
    m.setFunction(a, b, bit(bits, i)); m.setFunction(b, a, bit(bits, i))
  }
}

function drawCodewords(m: Matrix, data: readonly number[]): void {
  let i = 0
  for (let right = m.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < m.size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? m.size - 1 - vert : vert
        if (!m.isFunction[y][x] && i < data.length * 8) {
          m.modules[y][x] = bit(data[i >>> 3], 7 - (i & 7))
          i += 1
        }
      }
    }
  }
}

const MASKS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

function applyMask(m: Matrix, mask: number): void {
  const test = MASKS[mask]
  for (let y = 0; y < m.size; y += 1) for (let x = 0; x < m.size; x += 1) if (!m.isFunction[y][x] && test(x, y)) m.modules[y][x] = !m.modules[y][x]
}

/** Mask penalty (ISO/IEC 18004 7.8.3): runs, 2x2 blocks, finder-like patterns, dark/light balance. */
export function maskPenalty(modules: readonly (readonly boolean[])[]): number {
  const n = modules.length
  let penalty = 0
  const line = (get: (i: number) => boolean) => {
    let run = 1
    for (let i = 1; i < n; i += 1) {
      if (get(i) === get(i - 1)) { run += 1; if (run === 5) penalty += 3; else if (run > 5) penalty += 1 } else run = 1
    }
    // finder-like 1:1:3:1:1 with four light modules on one side (N3)
    for (let i = 0; i + 11 <= n; i += 1) {
      const w = (k: number) => get(i + k)
      const core = w(0) && !w(1) && w(2) && w(3) && w(4) && !w(5) && w(6)
      if (core && !w(7) && !w(8) && !w(9) && !w(10)) penalty += 40
      const tail = w(4) && !w(5) && w(6) && w(7) && w(8) && !w(9) && w(10)
      if (tail && !w(0) && !w(1) && !w(2) && !w(3)) penalty += 40
    }
  }
  for (let y = 0; y < n; y += 1) line((i) => modules[y][i])
  for (let x = 0; x < n; x += 1) line((i) => modules[i][x])
  for (let y = 0; y + 1 < n; y += 1) for (let x = 0; x + 1 < n; x += 1) {
    const c = modules[y][x]
    if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) penalty += 3
  }
  const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0)
  const total = n * n
  penalty += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10
  return penalty
}

const isEcc = (v: unknown): v is QrEcc => v === 'L' || v === 'M' || v === 'Q' || v === 'H'

/** Encode text as a QR Code. Refuses (never truncates) when the text is empty or does not fit. */
export function encodeQr(text: string, options: QrOptions = {}): QrResult {
  const ecc = options.ecc ?? 'M'
  const minVersion = options.minVersion ?? QR_MIN_VERSION
  const maxVersion = options.maxVersion ?? QR_MAX_VERSION
  if (!isEcc(ecc) || !Number.isInteger(minVersion) || !Number.isInteger(maxVersion) || minVersion < QR_MIN_VERSION || maxVersion > QR_MAX_VERSION || minVersion > maxVersion) return { ok: false, reason: 'bad-option' }
  if (options.mask !== undefined && (!Number.isInteger(options.mask) || options.mask < 0 || options.mask > 7)) return { ok: false, reason: 'bad-option' }
  if (typeof text !== 'string') return { ok: false, reason: 'bad-option' }
  if (text.length === 0) return { ok: false, reason: 'empty' }

  const bytes = utf8.encode(text)
  const needsEci = bytes.some((b) => b >= 0x80)
  let version = -1
  for (let v = minVersion; v <= maxVersion; v += 1) {
    if (payloadBits(bytes, v, needsEci).length <= qrDataCodewords(v, ecc) * 8) { version = v; break }
  }
  if (version < 0) return { ok: false, reason: 'too-long' }

  const bits = payloadBits(bytes, version, needsEci)
  const capacityBits = qrDataCodewords(version, ecc) * 8
  appendBits(bits, 0, Math.min(4, capacityBits - bits.length)) // terminator
  appendBits(bits, 0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) appendBits(bits, pad, 8)
  const dataCodewords: number[] = new Array<number>(bits.length / 8).fill(0)
  bits.forEach((b, i) => { dataCodewords[i >>> 3] |= b << (7 - (i & 7)) })

  const all = interleaveBlocks(dataCodewords, version, ecc)
  const base = new Matrix(version)
  drawFunctionPatterns(base)
  drawCodewords(base, all)

  let best = -1
  let bestPenalty = Number.POSITIVE_INFINITY
  const candidates = options.mask === undefined ? [0, 1, 2, 3, 4, 5, 6, 7] : [options.mask]
  for (const mask of candidates) {
    const trial = cloneMatrix(base)
    applyMask(trial, mask)
    drawFormatBits(trial, ecc, mask)
    const penalty = maskPenalty(trial.modules)
    if (penalty < bestPenalty) { best = mask; bestPenalty = penalty }
  }
  const final = cloneMatrix(base)
  applyMask(final, best)
  drawFormatBits(final, ecc, best)
  return { ok: true, code: { version, size: final.size, ecc, mask: best, modules: final.modules } }
}

function cloneMatrix(m: Matrix): Matrix {
  const copy = new Matrix(m.version)
  m.modules.forEach((row, y) => row.forEach((v, x) => { copy.modules[y][x] = v; copy.isFunction[y][x] = m.isFunction[y][x] }))
  return copy
}

/**
 * One SVG path for all dark modules, merged into horizontal runs and offset by a quiet zone (the standard asks for 4
 * modules of light margin). Render with viewBox `0 0 size+2*quiet size+2*quiet`.
 */
export function qrSvgPath(code: QrCode, quiet = 4): string {
  const parts: string[] = []
  code.modules.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (!row[x]) { x += 1; continue }
      let end = x
      while (end < row.length && row[end]) end += 1
      parts.push(`M${x + quiet} ${y + quiet}h${end - x}v1h-${end - x}z`)
      x = end
    }
  })
  return parts.join('')
}
