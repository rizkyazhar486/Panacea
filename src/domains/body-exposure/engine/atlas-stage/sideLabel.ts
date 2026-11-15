// Reading the side of an atlas structure from its name, without asserting what was not verified. Pure.

import { ATLAS_SIDE_LABEL_REVIEW, type SideLabelReviewKind } from '../../data/atlasSideLabelReview.ts'

export type AtlasSide = 'left' | 'right'

export interface AtlasSideReading {
  /** Name without the side suffix, first letter capitalised. */
  base: string
  /** The side the name states, or null when the name states none or the label is under review. */
  side: AtlasSide | null
  /** Set when the file's label disagrees with the mesh position; the side is then withheld. */
  review: SideLabelReviewKind | null
}

/** Bounding-box centres closer to the midline than this (metres) are treated as midline, not as a side. */
export const ATLAS_MIDLINE_TOLERANCE_M = 0.004

export function readAtlasSide(rawName: string): AtlasSideReading {
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  const match = /^(.*)\.([lr])$/.exec(name)
  const stem = (match ? match[1] : name).trim()
  const base = stem ? stem.charAt(0).toUpperCase() + stem.slice(1) : ''
  if (!match) return { base, side: null, review: null }
  const review = Object.prototype.hasOwnProperty.call(ATLAS_SIDE_LABEL_REVIEW, name) ? ATLAS_SIDE_LABEL_REVIEW[name] : null
  if (review) return { base, side: null, review }
  return { base, side: match[2] === 'l' ? 'left' : 'right', review: null }
}

/** Side implied by a bounding-box centre (+X = subject's left). Non-finite input yields null. */
export function sideFromCentreX(centreX: number, tolerance = ATLAS_MIDLINE_TOLERANCE_M): AtlasSide | 'midline' | null {
  if (!Number.isFinite(centreX) || !Number.isFinite(tolerance) || tolerance < 0) return null
  if (Math.abs(centreX) < tolerance) return 'midline'
  return centreX > 0 ? 'left' : 'right'
}
