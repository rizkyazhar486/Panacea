import { useMemo } from 'react'
import { encodeQr, qrSvgPath, type QrEcc } from '../engine/qr.ts'
import { encodeCode128, code128SvgPath } from '../engine/code128.ts'

// Codes are always dark-on-white, in light and dark themes alike: scanners need that contrast, and the quiet zone
// (4 modules for QR, 10 for Code 128) is part of the symbol, so the white background includes it.
const INK = '#000000'
const PAPER = '#ffffff'

/** A real QR Code (ISO/IEC 18004) for `value`. `label` is what a screen reader hears; it must not repeat private data. */
export function QrSvg({ value, label, ecc = 'M', sizePx = 168, testId }: {
  readonly value: string
  readonly label: string
  readonly ecc?: QrEcc
  readonly sizePx?: number
  readonly testId?: string
}) {
  const result = useMemo(() => encodeQr(value, { ecc }), [value, ecc])
  if (!result.ok) {
    return <p role="alert" data-testid={testId}>{result.reason === 'too-long' ? 'This is too long for a QR code.' : 'There is nothing to show as a QR code.'}</p>
  }
  const quiet = 4
  const span = result.code.size + quiet * 2
  return (
    <svg
      role="img"
      aria-label={label}
      data-testid={testId}
      data-qr-version={result.code.version}
      viewBox={`0 0 ${span} ${span}`}
      shapeRendering="crispEdges"
      style={{ width: sizePx, height: sizePx, maxWidth: '100%', flex: 'none', borderRadius: 8 }}
    >
      <rect width={span} height={span} fill={PAPER} />
      <path d={qrSvgPath(result.code, quiet)} fill={INK} />
    </svg>
  )
}

/** A Code 128 barcode for `value` (printable ASCII). The readable text belongs next to it, not inside it. */
export function BarcodeSvg({ value, label, heightPx = 56, testId }: {
  readonly value: string
  readonly label: string
  readonly heightPx?: number
  readonly testId?: string
}) {
  const result = useMemo(() => encodeCode128(value), [value])
  if (!result.ok) {
    return <p role="alert" data-testid={testId}>{result.reason === 'empty' ? 'There is nothing to show as a barcode.' : 'This value cannot be shown as a Code 128 barcode.'}</p>
  }
  const quiet = 10
  const bars = 40
  const width = result.code.modules + quiet * 2
  return (
    <svg
      role="img"
      aria-label={label}
      data-testid={testId}
      viewBox={`0 0 ${width} ${bars}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      style={{ width: '100%', maxWidth: 360, height: heightPx, borderRadius: 6 }}
    >
      <rect width={width} height={bars} fill={PAPER} />
      <path d={code128SvgPath(result.code, bars, quiet)} fill={INK} />
    </svg>
  )
}
