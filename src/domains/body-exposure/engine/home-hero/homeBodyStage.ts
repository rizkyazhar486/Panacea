// Home's body-analysis stage: the shipped atlas body with a hotspot per body system, a floating card beside the
// selected one, and for the heart a left-ventricular volume trace from the Wiggers cycle model. Pure and
// deterministic; the hotspot positions come from scripts/bangun/bake-home-body.mjs (projected from atlas meshes).

import { NORMAL, simulate } from '../../../../lib/bodySim.ts'
import type { BodySystemId } from '../../data/bodySystems.ts'
import { HOME_BODY_ANCHORS } from '../../data/homeBodyAnchors.ts'
import { cardiacStateAt, validateParams, type CardiacParams } from '../cardiacCycle.ts'

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

export interface VolumeTrace {
  /** SVG path in a w×h box, time left to right, volume up. */
  readonly d: string
  readonly edvMl: number
  readonly esvMl: number
  readonly ejectionFractionPct: number
  readonly beatS: number
}

/**
 * Left-ventricular volume over `beats` cardiac cycles from the Wiggers model, as an SVG path. Invalid parameters,
 * box or sample count → null.
 */
export function ventricleVolumeTrace(p: CardiacParams, beats: number, w: number, h: number, samples = 160): VolumeTrace | null {
  if (validateParams(p) !== null) return null
  if (!Number.isInteger(beats) || beats < 1 || beats > 8 || !(w > 0) || !(h > 0) || !Number.isInteger(samples) || samples < 8) return null
  const beatS = 60 / p.hrBpm
  const span = p.edvMl - p.esvMl
  if (!(span > 0)) return null
  let d = ''
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * beats * beatS
    const v = cardiacStateAt(p, t).ventricleMl
    const px = Math.round(((i / samples) * w) * 10) / 10
    const py = Math.round((h - ((v - p.esvMl) / span) * h) * 10) / 10
    d += `${i === 0 ? 'M' : 'L'}${px} ${py}`
  }
  return { d, edvMl: p.edvMl, esvMl: p.esvMl, ejectionFractionPct: Math.round((span / p.edvMl) * 100), beatS }
}

export interface RestingVital {
  readonly key: string
  readonly label: string
  readonly value: string
  readonly unit: string
  readonly tone: string
}

/**
 * The resting whole-body state as the simulator computes it from NORMAL: a worked reference, never a measurement of
 * the viewer. Every number is read back from simulate() or its own input, so nothing here is a hand-written figure.
 */
export function restingVitals(): readonly RestingVital[] {
  const o = simulate(NORMAL)
  const r = (v: number, d = 0) => v.toFixed(d)
  return [
    { key: 'hr', label: 'Heart rate', value: r(NORMAL.heartRate), unit: 'bpm', tone: '#ef4459' },
    { key: 'co', label: 'Cardiac output', value: r(o.cardiacOutput, 1), unit: 'L/min', tone: '#e5739a' },
    { key: 'bp', label: 'Blood pressure', value: `${r(o.systolic)}/${r(o.diastolic)}`, unit: 'mmHg', tone: '#f08a3c' },
    { key: 'rr', label: 'Breaths', value: r(NORMAL.respRate), unit: '/min', tone: '#2fb8e6' },
    { key: 'sao2', label: 'O\u2082 saturation', value: r(o.sao2), unit: '%', tone: '#4cbf6b' },
    { key: 'urine', label: 'Urine output', value: r(o.urineOutput), unit: 'mL/h', tone: '#d9a72f' },
  ]
}
