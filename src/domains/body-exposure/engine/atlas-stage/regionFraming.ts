// Camera regions of the shipped atlas, as boxes in the atlas's own coordinates.
//
// These are NOT anatomical claims about a person: they are framing windows for one reference file
// (public/anatomy/*.glb, Z-Anatomy male; metres, +Y up from the floor, +X = the subject's left, +Z = anterior).
// The windows were set from landmark heights measured in that file (skull, sternum, hip bone, femur, ...)
// and scripts/uji/atlas-stage-assets.mts re-measures the file and fails if a landmark leaves its window.
//
// Pure: no three.js, no DOM.

import type { AnatomicalView, Vec3 } from '../cameraViews.ts'

/** Extent of the reference body in atlas coordinates (metres). Re-measured by the asset gate. */
export const ATLAS_BODY_EXTENT = {
  floorY: 0,
  vertexY: 1.743,
  halfWidthX: 0.34,
  backZ: -0.148,
  frontZ: 0.146,
} as const

export interface AtlasRegion {
  id: string
  label: string
  /** Height window above the floor, metres. */
  y: readonly [number, number]
  /** Half-width of the window around the midline, metres. */
  halfWidthX: number
  view: AnatomicalView
}

export const ATLAS_REGIONS: readonly AtlasRegion[] = [
  { id: 'all', label: 'Whole body', y: [ATLAS_BODY_EXTENT.floorY, ATLAS_BODY_EXTENT.vertexY], halfWidthX: ATLAS_BODY_EXTENT.halfWidthX, view: 'anterior' },
  { id: 'head-neck', label: 'Head & neck', y: [1.42, 1.745], halfWidthX: 0.11, view: 'anterior' },
  { id: 'thorax', label: 'Thorax', y: [1.2, 1.45], halfWidthX: 0.2, view: 'anterior' },
  { id: 'abdomen', label: 'Abdomen', y: [0.98, 1.24], halfWidthX: 0.18, view: 'anterior' },
  { id: 'pelvis', label: 'Pelvis', y: [0.78, 1.02], halfWidthX: 0.2, view: 'anterior' },
  { id: 'upper-limb', label: 'Upper limbs', y: [0.68, 1.45], halfWidthX: 0.36, view: 'anterior' },
  { id: 'lower-limb', label: 'Lower limbs', y: [0, 0.9], halfWidthX: 0.2, view: 'anterior' },
] as const

/** A box, in atlas coordinates (metres), that the camera should fit from a named anatomical view. */
export interface RegionFrame {
  center: Vec3
  size: Vec3
  view: AnatomicalView
}

export type RegionFrameError = 'unknown-region' | 'invalid-window'

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

/** The world-space box a region asks the camera to fit. Invalid windows are refused, never repaired. */
export function regionFrame(region: AtlasRegion): { ok: true; frame: RegionFrame } | { ok: false; error: RegionFrameError } {
  const [lo, hi] = region.y
  if (!finite(lo) || !finite(hi) || !finite(region.halfWidthX) || hi <= lo || region.halfWidthX <= 0) {
    return { ok: false, error: 'invalid-window' }
  }
  const depth = ATLAS_BODY_EXTENT.frontZ - ATLAS_BODY_EXTENT.backZ
  return {
    ok: true,
    frame: {
      center: [0, (lo + hi) / 2, (ATLAS_BODY_EXTENT.frontZ + ATLAS_BODY_EXTENT.backZ) / 2],
      size: [region.halfWidthX * 2, hi - lo, depth],
      view: region.view,
    },
  }
}

export function regionFrameById(id: string): { ok: true; frame: RegionFrame } | { ok: false; error: RegionFrameError } {
  const region = ATLAS_REGIONS.find((item) => item.id === id)
  if (!region) return { ok: false, error: 'unknown-region' }
  return regionFrame(region)
}

/** Whether a point (atlas coordinates) lies inside a region's window. Used by the asset gate. */
export function regionContains(region: AtlasRegion, x: number, y: number): boolean {
  if (!finite(x) || !finite(y)) return false
  return y >= region.y[0] && y <= region.y[1] && Math.abs(x) <= region.halfWidthX
}
