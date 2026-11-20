// The numbers Home shows next to the body: the resting whole-body state from lib/bodySim and a left-ventricular
// volume trace from the Wiggers cycle model. Home does not import this at runtime; scripts/bangun/home-body-snapshot.mts
// writes the result into data/homeBodySnapshot.ts and scripts/uji/home-body-stage.mts fails if the snapshot ever
// differs from what these functions compute now.

import { NORMAL, simulate } from '../../../../lib/bodySim.ts'
import { cardiacStateAt, validateParams, type CardiacParams } from '../cardiacCycle.ts'

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

