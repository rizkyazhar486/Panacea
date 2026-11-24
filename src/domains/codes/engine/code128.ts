/**
 * Code 128 linear barcode (ISO/IEC 15417), code sets B and C.
 *
 * Used for labels a clinic desk reader can scan: a record number, a pack lot, a shelf tag. Set B covers printable ASCII
 * (32-126). Set C packs digit pairs, so a long numeric id is about half as wide; it is chosen automatically for numeric text.
 * Mixed text stays in set B (valid, slightly wider than a full optimiser would make it). Set A, FNC1 (GS1-128) and
 * shifts are not produced.
 *
 * Pure and deterministic. Verified symbol-by-symbol against an independent implementation (scripts/uji/codes-code128.mts).
 */

export type Code128Refusal = 'empty' | 'unsupported-character' | 'bad-input'

export interface Code128 {
  /** Symbol values: start, data, check character, stop. */
  readonly values: readonly number[]
  /** Alternating bar and space widths in modules, starting with a bar; the stop pattern's final bar is included. */
  readonly widths: readonly number[]
  /** Total width in modules, without quiet zones (the standard asks for 10 modules each side). */
  readonly modules: number
  /** 'B', 'C', or 'B+C' when an odd-length number starts in set B and continues in set C. */
  readonly sets: 'B' | 'C' | 'B+C'
}

export type Code128Result = { readonly ok: true; readonly code: Code128 } | { readonly ok: false; readonly reason: Code128Refusal }

// Bar/space widths of the 107 symbols (values 0-106), ISO/IEC 15417 Table 2; each row sums to 11 modules (stop: 13).
const PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
]

const START_B = 104
const START_C = 105
const CODE_C = 99 // switch B -> C
const STOP = 106

/** Width pattern of one symbol value; throws only on a value outside 0-106, which this module never produces. */
export const code128Pattern = (value: number): string => PATTERNS[value]

const isDigits = (text: string) => /^[0-9]+$/.test(text)

export function encodeCode128(text: string): Code128Result {
  if (typeof text !== 'string') return { ok: false, reason: 'bad-input' }
  if (text.length === 0) return { ok: false, reason: 'empty' }
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i)
    if (c < 32 || c > 126) return { ok: false, reason: 'unsupported-character' }
  }
  const values: number[] = []
  let sets: Code128['sets']
  if (isDigits(text) && text.length >= 4) {
    // Numeric: set C pairs. An odd count puts the single leading digit in set B, then switches to C.
    const odd = text.length % 2 === 1
    if (odd) { values.push(START_B, text.charCodeAt(0) - 32, CODE_C); sets = 'B+C' } else { values.push(START_C); sets = 'C' }
    for (let i = odd ? 1 : 0; i < text.length; i += 2) values.push(Number(text.slice(i, i + 2)))
  } else {
    values.push(START_B)
    for (let i = 0; i < text.length; i += 1) values.push(text.charCodeAt(i) - 32)
    sets = 'B'
  }
  let sum = values[0]
  for (let i = 1; i < values.length; i += 1) sum += values[i] * i
  values.push(sum % 103, STOP)
  const widths = values.flatMap((v) => Array.from(PATTERNS[v], Number))
  return { ok: true, code: { values, widths, modules: widths.reduce((a, b) => a + b, 0), sets } }
}

/** Binary form (1 = bar module, 0 = space module); handy for tests and for comparing with other implementations. */
export function code128Bits(code: Code128): string {
  return code.widths.map((w, i) => (i % 2 === 0 ? '1' : '0').repeat(w)).join('')
}

/** One SVG path of the bars, `quiet` modules of light margin on each side; render with viewBox `0 0 modules+2*quiet height`. */
export function code128SvgPath(code: Code128, height = 40, quiet = 10): string {
  const parts: string[] = []
  let x = quiet
  code.widths.forEach((w, i) => {
    if (i % 2 === 0) parts.push(`M${x} 0h${w}v${height}h-${w}z`)
    x += w
  })
  return parts.join('')
}
