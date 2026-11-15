// Which atlas layers the stage mounts for a chosen depth. Pure and deterministic.
//
// The depth order is NOT restated here: it is read from lib/dissection (KEDALAMAN), the one place that
// documents why vessels and nerves sit after muscle. A second ordering would silently disagree with it.
//
// Two honest ways to look at a depth:
//   - 'peeled' : everything at or below the chosen depth, as a body with the outer layers removed;
//   - 'focus'  : the layer of that depth, with the skeleton as a frame — a lighter plate.
// A person may add or hide any single layer on top of either (overrides).
//
// Opaque skin encloses everything else, so while it is shown nothing behind it is mounted: layers that
// cannot be seen are neither drawn nor downloaded.

import { KEDALAMAN, LAPISAN_TERDALAM, type KunciLapisan } from '../../../../lib/dissection.ts'

export type AtlasLayerId = KunciLapisan
export type AtlasPlateMode = 'focus' | 'peeled'

/** Outermost first. Derived from the canonical dissection depths. */
export const ATLAS_DEPTH_ORDER: readonly AtlasLayerId[] = (Object.keys(KEDALAMAN) as AtlasLayerId[])
  .sort((a, b) => KEDALAMAN[a] - KEDALAMAN[b])

export const ATLAS_MAX_DEPTH = LAPISAN_TERDALAM

/** The outer shell that hides every other layer while it is opaque. */
export const ATLAS_SHELL_LAYER: AtlasLayerId = 'surface'
/** The layer kept as a structural frame in 'focus' plates. */
export const ATLAS_FRAME_LAYER: AtlasLayerId = 'skeletal'
/**
 * From this dissection depth on, lib/dissection fades the skin to its faint floor (a silhouette that keeps
 * orientation). One step shallower it would be a frosted cover over the layer being studied, so the skin is
 * only kept as context from here.
 */
export const ATLAS_GHOST_FROM_DEPTH = 2

/** What the stage shows about one layer. The home's configuration supplies these; nothing here invents them. */
export interface AtlasLayerInfo {
  id: AtlasLayerId
  file: string
  label: string
  /** One word for the depth rail. */
  short: string
  color: string
  peelRank: number
  /** Size of the shipped file in bytes, shown before a download starts. Checked against the file on disk. */
  sizeBytes: number
}

/** "12 MB" / "5.6 MB" for a byte count; unknown or invalid sizes are shown as unknown, never as zero. */
export function formatLayerSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'size unknown'
  const mb = bytes / 1_000_000
  return mb >= 10 ? `${mb.toFixed(0)} MB` : `${mb.toFixed(1)} MB`
}

export type AtlasLayerOverrides = Readonly<Partial<Record<AtlasLayerId, boolean>>>

export interface StageLayerRequest {
  depth: number
  mode: AtlasPlateMode
  /** true = always show, false = always hide, absent = follow the plate. */
  overrides?: AtlasLayerOverrides
}

export type StageLayerError = 'invalid-depth' | 'invalid-mode' | 'unknown-layer' | 'invalid-override'

export type StageLayerPlan =
  | {
      ok: true
      /** The layer this depth is about. */
      focus: AtlasLayerId
      /** Layers to mount in the viewer, outermost first (solid plus ghost). */
      mount: AtlasLayerId[]
      /** Mounted at full opacity. */
      solid: AtlasLayerId[]
      /** Mounted only as faint context. */
      ghost: AtlasLayerId[]
      /** Wanted, but behind the opaque shell: not mounted, not downloaded. */
      occluded: AtlasLayerId[]
      /** Dissection depth to hand to the viewer so that `solid` is opaque and `ghost` is faint. */
      dissect: number
    }
  | { ok: false; error: StageLayerError }

const isLayer = (key: string): key is AtlasLayerId => Object.prototype.hasOwnProperty.call(KEDALAMAN, key)

export function isAtlasDepth(depth: unknown): depth is number {
  return typeof depth === 'number' && Number.isInteger(depth) && depth >= 0 && depth <= ATLAS_MAX_DEPTH
}

/** The layer whose canonical depth is `depth`, or null when the depth is not a valid stop. */
export function layerAtDepth(depth: number): AtlasLayerId | null {
  if (!isAtlasDepth(depth)) return null
  return ATLAS_DEPTH_ORDER.find((layer) => KEDALAMAN[layer] === depth) ?? null
}

/** Whether a plate shows a layer before any personal override. */
export function plateShows(layer: AtlasLayerId, depth: number, mode: AtlasPlateMode): boolean {
  if (mode === 'peeled') return KEDALAMAN[layer] >= depth
  return KEDALAMAN[layer] === depth || (layer === ATLAS_FRAME_LAYER && depth > KEDALAMAN[ATLAS_SHELL_LAYER])
}

export function planStageLayers(request: StageLayerRequest): StageLayerPlan {
  const { depth, mode } = request
  if (!isAtlasDepth(depth)) return { ok: false, error: 'invalid-depth' }
  if (mode !== 'focus' && mode !== 'peeled') return { ok: false, error: 'invalid-mode' }
  const overrides = request.overrides ?? {}
  for (const [key, value] of Object.entries(overrides)) {
    if (!isLayer(key)) return { ok: false, error: 'unknown-layer' }
    if (value !== undefined && typeof value !== 'boolean') return { ok: false, error: 'invalid-override' }
  }

  const focus = layerAtDepth(depth)
  if (!focus) return { ok: false, error: 'invalid-depth' }

  const wanted = ATLAS_DEPTH_ORDER.filter((layer) => overrides[layer] ?? plateShows(layer, depth, mode))

  if (wanted.includes(ATLAS_SHELL_LAYER)) {
    return {
      ok: true,
      focus,
      mount: [ATLAS_SHELL_LAYER],
      solid: [ATLAS_SHELL_LAYER],
      ghost: [],
      occluded: wanted.filter((layer) => layer !== ATLAS_SHELL_LAYER),
      dissect: 0,
    }
  }

  // The viewer fades every layer shallower than `dissect`; the shallowest solid layer therefore sets it.
  const dissect = wanted.length ? Math.min(...wanted.map((layer) => KEDALAMAN[layer])) : depth
  const ghost = dissect >= ATLAS_GHOST_FROM_DEPTH && overrides[ATLAS_SHELL_LAYER] !== false ? [ATLAS_SHELL_LAYER] : []
  return { ok: true, focus, mount: [...ghost, ...wanted], solid: wanted, ghost, occluded: [], dissect }
}
