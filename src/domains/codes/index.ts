// Codes — real, scannable QR Codes (ISO/IEC 18004) and Code 128 barcodes, rendered as SVG. Public API of the domain.
// The index stays importable from plain Node: the React components load on demand through `loadCodeSvgs`.

// ── ENGINE ──
export {
  encodeQr, qrSvgPath, qrByteCapacity, qrDataCodewords, formatInformation, maskPenalty, interleaveBlocks,
  QR_MIN_VERSION, QR_MAX_VERSION,
} from './engine/qr.ts'
export type { QrEcc, QrOptions, QrCode, QrResult, QrRefusal } from './engine/qr.ts'
export { encodeCode128, code128Bits, code128SvgPath, code128Pattern } from './engine/code128.ts'
export type { Code128, Code128Result, Code128Refusal } from './engine/code128.ts'

// ── UI (loaded on demand) ──
export const loadCodeSvgs = () => import('./ui/CodeSvgs.tsx')
