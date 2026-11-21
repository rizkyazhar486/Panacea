// Step 1 of face-from-photo: accept one photo and let the person line their face up with an outline. Pure: no DOM,
// no I/O. Nothing here measures or generates a face — later steps do, and they inherit the boundary below. A live
// camera scan (owner's next-gen direction, 2026-11-21) is meant to feed this same alignment and boundary.
//
// A photo gives a likeness, never patient anatomy: whatever is derived from it stays labelled "estimated from a
// photo", separate from measured scans (CLAUDE.md §8). The photo itself is biometric data: it is held only in
// memory for this session and never sent or stored without a separate, explicit consent.

export const FACE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const FACE_PHOTO_MAX_BYTES = 10 * 1024 * 1024
/** Below this the face is too small for landmarks to mean anything. */
export const FACE_PHOTO_MIN_SIDE = 256

export const ZOOM_MIN = 1
export const ZOOM_MAX = 4
export const ROTATE_MAX_DEG = 45

export const FACE_PHOTO_BOUNDARY = 'Estimated from a photo — a likeness, not a measurement of your anatomy.'

export type PhotoCheck =
  | { ok: true }
  | { ok: false; reason: 'type' | 'size' | 'empty' | 'small' }

const PHOTO_REASON: Record<Exclude<PhotoCheck, { ok: true }>['reason'], string> = {
  type: 'Use a JPEG, PNG or WebP photo.',
  size: 'Use a photo under 10 MB.',
  empty: 'That file is empty.',
  small: `Use a photo at least ${FACE_PHOTO_MIN_SIDE} pixels on its shorter side.`,
}
export const photoReason = (c: Exclude<PhotoCheck, { ok: true }>) => PHOTO_REASON[c.reason]

/** Checks the file before it is decoded. */
export function checkPhotoFile(type: string, bytes: number): PhotoCheck {
  if (!(FACE_PHOTO_TYPES as readonly string[]).includes(type)) return { ok: false, reason: 'type' }
  if (!Number.isFinite(bytes) || bytes <= 0) return { ok: false, reason: 'empty' }
  if (bytes > FACE_PHOTO_MAX_BYTES) return { ok: false, reason: 'size' }
  return { ok: true }
}

/** Checks the decoded image size. */
export function checkPhotoSize(width: number, height: number): PhotoCheck {
  if (!Number.isFinite(width) || !Number.isFinite(height) || Math.min(width, height) < FACE_PHOTO_MIN_SIDE) return { ok: false, reason: 'small' }
  return { ok: true }
}

export interface Alignment {
  /** 1 = the photo's shorter side just fills the outline circle. */
  readonly zoom: number
  readonly rotateDeg: number
  /** Offset of the photo centre from the circle centre, in circle diameters. */
  readonly panX: number
  readonly panY: number
}

export const ALIGN_START: Alignment = { zoom: 1, rotateDeg: 0, panX: 0, panY: 0 }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Keeps an alignment inside its limits: zoom 1–4, rotation ±45°, and a pan that never uncovers the circle (the photo
 * at zoom z spans z diameters, so its centre may move at most (z − 1) / 2 diameters each way). A non-finite value
 * falls back to the start value for that field.
 */
export function clampAlignment(a: Alignment): Alignment {
  const finite = (v: number, d: number) => (Number.isFinite(v) ? v : d)
  const zoom = clamp(finite(a.zoom, 1), ZOOM_MIN, ZOOM_MAX)
  const reach = (zoom - 1) / 2
  return {
    zoom,
    rotateDeg: clamp(finite(a.rotateDeg, 0), -ROTATE_MAX_DEG, ROTATE_MAX_DEG),
    panX: clamp(finite(a.panX, 0), -reach, reach),
    panY: clamp(finite(a.panY, 0), -reach, reach),
  }
}

/** The CSS transform for the photo inside a circle `size` px across. */
export function alignTransform(a: Alignment, size: number): string {
  const c = clampAlignment(a)
  const px = (v: number) => `${+(v * size).toFixed(2)}px`
  return `translate(${px(c.panX)}, ${px(c.panY)}) rotate(${c.rotateDeg}deg) scale(${c.zoom})`
}

/** Generate is allowed only with a valid photo and consent given in this session. */
export const canGenerate = (photoOk: boolean, consent: boolean) => photoOk && consent
