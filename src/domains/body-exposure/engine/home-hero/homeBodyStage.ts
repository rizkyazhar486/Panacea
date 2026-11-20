// Home's body-analysis stage: the shipped atlas body with a hotspot per body system and a tag beside the selected
// one. Pure and deterministic; the hotspot positions come from scripts/bangun/bake-home-body.mjs (projected from
// atlas meshes). The model numbers live in homeBodyModels.ts so Home never loads the simulator at runtime.

import type { BodySystemId } from '../../data/bodySystems.ts'
import { HOME_BODY_ANCHORS } from '../../data/homeBodyAnchors.ts'

export interface HomeSystem {
  readonly id: BodySystemId
  readonly label: string
  /** Display tint only. */
  readonly tone: string
  /** Position in the body image, fractions of its width/height. */
  readonly x: number
  readonly y: number
  /** False when the atlas has no organ for this system: the point marks the region and the UI says so. */
  readonly inAtlas: boolean
}

const STYLE: Readonly<Record<BodySystemId, { label: string; tone: string }>> = {
  'nervous': { label: 'Brain & nerves', tone: '#8b6cff' },
  'sensory-ent': { label: 'Eyes & ears', tone: '#f2b84b' },
  'endocrine': { label: 'Hormones', tone: '#e86fb4' },
  'respiratory': { label: 'Lungs', tone: '#2fb8e6' },
  'cardiovascular': { label: 'Heart', tone: '#ef4459' },
  'lymphatic-immune': { label: 'Immune', tone: '#4cbf6b' },
  'digestive': { label: 'Digestion', tone: '#f08a3c' },
  'urinary': { label: 'Kidneys', tone: '#d9a72f' },
  'reproductive': { label: 'Reproductive', tone: '#e5739a' },
  'integumentary-surface': { label: 'Skin', tone: '#c99a74' },
  'musculoskeletal': { label: 'Muscle & bone', tone: '#19a88b' },
}

/** Every body system, ordered head to toe, with its hotspot. */
export const HOME_SYSTEMS: readonly HomeSystem[] = HOME_BODY_ANCHORS
  .map((a) => ({ ...a, ...STYLE[a.id] }))
  .sort((a, b) => a.y - b.y)

export interface Box { readonly w: number; readonly h: number }
export interface CardPlacement { readonly left: number; readonly top: number; readonly side: 'left' | 'right' }

/**
 * Where the floating card goes for a hotspot at (x, y) px on a stage: beside the point on the side with more room,
 * vertically centred on it, kept `margin` inside the stage. Invalid sizes → null (no card rather than a misplaced one).
 */
export function cardPlacement(x: number, y: number, card: Box, stage: Box, gap = 18, margin = 8): CardPlacement | null {
  const ok = (v: number) => Number.isFinite(v)
  if (![x, y, card.w, card.h, stage.w, stage.h, gap, margin].every(ok) || card.w <= 0 || card.h <= 0 || stage.w <= 0 || stage.h <= 0) return null
  if (card.w + 2 * margin > stage.w || card.h + 2 * margin > stage.h) return null
  const side: 'left' | 'right' = x <= stage.w / 2 ? 'right' : 'left'
  const rawLeft = side === 'right' ? x + gap : x - gap - card.w
  const left = Math.min(stage.w - margin - card.w, Math.max(margin, rawLeft))
  const top = Math.min(stage.h - margin - card.h, Math.max(margin, y - card.h / 2))
  return { left, top, side }
}
