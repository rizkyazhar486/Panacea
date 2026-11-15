// Which ray hit a tap is allowed to select. Pure and deterministic.
//
// A ray through the body crosses layers that are mounted only as faint context (dissection fades outer
// layers but never removes them) and helper nodes that are hidden. Selecting those names the wrong thing:
// the person taps a muscle and is told about a skin region they cannot see. A hit is selectable only when
// it is visible and has not been faded to context.

export interface PickCandidate {
  /** False when the object or any ancestor is hidden. */
  visible: boolean
  /** Opacity the material is drawn with now. */
  opacity: number
  /** Opacity the same material has when nothing is faded. */
  baseOpacity: number
}

/** A layer drawn at less than this share of its own opacity is context, not a target. */
export const PICK_MIN_FADE = 0.5

export function isPickable(candidate: PickCandidate): boolean {
  if (candidate.visible !== true) return false
  const { opacity, baseOpacity } = candidate
  if (!Number.isFinite(opacity) || !Number.isFinite(baseOpacity) || baseOpacity <= 0 || opacity < 0) return false
  return opacity / baseOpacity >= PICK_MIN_FADE
}

/** Index of the nearest selectable hit in a near-to-far list, or -1 when none may be selected. */
export function firstPickableIndex(candidates: readonly PickCandidate[]): number {
  for (let i = 0; i < candidates.length; i += 1) if (isPickable(candidates[i])) return i
  return -1
}
