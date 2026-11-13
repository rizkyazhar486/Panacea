// Snap positions of the phone inspector sheet. Pure: heights in, state out.
//
// The sheet never covers the whole stage: the body must stay visible above it at every position, so the
// tallest stop leaves a strip of the stage showing.

export type SheetSnap = 'peek' | 'half' | 'full'

export const SHEET_SNAPS: readonly SheetSnap[] = ['peek', 'half', 'full']

/** Share of the stage height a stop may take. */
const HALF_SHARE = 0.56
const FULL_SHARE = 0.9

const usable = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0

/** Height in px of a stop, or null when the inputs cannot describe a stage. */
export function sheetHeight(snap: SheetSnap, stageHeight: number, peekHeight: number): number | null {
  if (!usable(stageHeight) || !usable(peekHeight) || peekHeight >= stageHeight) return null
  if (snap === 'peek') return peekHeight
  const share = snap === 'half' ? HALF_SHARE : snap === 'full' ? FULL_SHARE : NaN
  if (!Number.isFinite(share)) return null
  return Math.max(peekHeight, Math.round(stageHeight * share))
}

/** The handle button steps one stop up and returns to peek from the top. */
export function nextSnap(snap: SheetSnap): SheetSnap {
  const index = SHEET_SNAPS.indexOf(snap)
  if (index < 0) return 'peek'
  return SHEET_SNAPS[(index + 1) % SHEET_SNAPS.length]
}

/**
 * Stop to settle on after a drag. `dragUpPx` is how far the handle was pulled upward (negative = downward).
 * The nearest stop wins; unusable input keeps the sheet where it was.
 */
export function snapAfterDrag(from: SheetSnap, dragUpPx: number, stageHeight: number, peekHeight: number): SheetSnap {
  const start = sheetHeight(from, stageHeight, peekHeight)
  if (start === null || !Number.isFinite(dragUpPx)) return SHEET_SNAPS.includes(from) ? from : 'peek'
  const target = start + dragUpPx
  let best: SheetSnap = from
  let bestDistance = Infinity
  for (const snap of SHEET_SNAPS) {
    const height = sheetHeight(snap, stageHeight, peekHeight)
    if (height === null) continue
    const distance = Math.abs(height - target)
    if (distance < bestDistance) { best = snap; bestDistance = distance }
  }
  return best
}
