// Home's body-analysis stage: the shipped atlas body with a hotspot per body system, a floating card beside the
// selected one, and for the heart a left-ventricular volume trace from the Wiggers cycle model. Pure and
// deterministic; the hotspot positions come from scripts/bangun/bake-home-body.mjs (projected from atlas meshes).

import { NORMAL, SKENARIO, simulate, type SimInput, type SimOutput } from '../../../../lib/bodySim.ts'
import { DEFAULT_OXYGEN_CONTENT_CONVENTION, oxygenContentConvention } from '../../../../lib/physiology/oxygenContentConventions.ts'
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

// ── Scenario board ────────────────────────────────────────────────────────────────────────────────────────────
// Everything below is read back from simulate() for each scenario in lib/bodySim. No figure is written by hand, and
// nothing is a measurement of any person: these are the model's answers for a textbook adult in that state.

export interface ScenarioRow {
  readonly key: string
  readonly label: string
  readonly input: SimInput
  readonly out: SimOutput
}

/** Every scenario the simulator ships, solved once. */
export function scenarioRows(): readonly ScenarioRow[] {
  return SKENARIO.map((s) => ({ key: s.key, label: s.label, input: s.input, out: simulate(s.input) }))
}

/** The metrics compared across scenarios, each read straight off SimOutput. */
export const BOARD_METRICS: ReadonlyArray<{ readonly key: string; readonly label: string; readonly pick: (o: SimOutput) => number }> = [
  { key: 'co', label: 'Cardiac output', pick: (o) => o.cardiacOutput },
  { key: 'map', label: 'Mean pressure', pick: (o) => o.map },
  { key: 'do2', label: 'O₂ delivery', pick: (o) => o.do2 },
  { key: 'sao2', label: 'O₂ saturation', pick: (o) => o.sao2 },
  { key: 'gfr', label: 'Filtration', pick: (o) => o.gfr },
  { key: 'urine', label: 'Urine output', pick: (o) => o.urineOutput },
]

/** Each metric as a ratio of the same metric at rest; the rest row itself is all ones. Unknown scenario → empty. */
export function ratiosVsRest(rows: readonly ScenarioRow[], key: string): readonly number[] {
  const rest = rows.find((r) => r.key === 'normal')
  const row = rows.find((r) => r.key === key)
  if (!rest || !row) return []
  return BOARD_METRICS.map((m) => {
    const base = m.pick(rest.out)
    return base > 0 ? m.pick(row.out) / base : 0
  })
}

/** Oxygen in one decilitre of arterial blood, split into the part bound to haemoglobin and the part dissolved. */
export function oxygenSplit(row: ScenarioRow): { readonly bound: number; readonly dissolved: number } {
  const { hufnerMlO2PerGHb, dissolvedMlO2PerDlPerMmHg } = oxygenContentConvention(DEFAULT_OXYGEN_CONTENT_CONVENTION)
  return {
    bound: hufnerMlO2PerGHb * row.input.hemoglobin * (row.out.sao2 / 100),
    dissolved: dissolvedMlO2PerDlPerMmHg * row.out.pao2,
  }
}

/** Minute ventilation split into the part that reaches alveoli and the part that only fills dead space. */
export function ventilationSplit(row: ScenarioRow): { readonly alveolar: number; readonly deadSpace: number } {
  const minute = (row.input.respRate * row.input.tidalVolume) / 1000
  const deadSpace = minute * row.input.deadSpaceFraction
  return { alveolar: minute - deadSpace, deadSpace }
}

/** Dry-gas constants of the alveolar gas equation, as a textbook states them. */
const ATMOSPHERIC_MMHG = 760
const WATER_VAPOUR_MMHG = 47
const RESPIRATORY_QUOTIENT = 0.8

export interface CascadeStep { readonly key: string; readonly delta: number; readonly total?: boolean }

/**
 * The oxygen cascade for one scenario: inspired partial pressure, what carbon dioxide displaces in the alveolus,
 * then the drop across the lung to arterial blood. The last bar is the arterial value the simulator reports.
 */
export function oxygenCascade(row: ScenarioRow): { readonly base: number; readonly steps: readonly CascadeStep[] } {
  const pio2 = row.input.fio2 * (ATMOSPHERIC_MMHG - WATER_VAPOUR_MMHG)
  const pao2Alveolar = pio2 - row.out.paco2 / RESPIRATORY_QUOTIENT
  return {
    base: pio2,
    steps: [
      { key: 'inspired', delta: 0 },
      { key: 'co2', delta: pao2Alveolar - pio2 },
      { key: 'lung', delta: row.out.pao2 - pao2Alveolar },
      { key: 'arterial', delta: 0, total: true },
    ],
  }
}
