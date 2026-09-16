export type MotionIntent =
  | 'direct-manipulation'
  | 'state-change'
  | 'spatial-continuity'
  | 'progressive-disclosure'
  | 'feedback'

export interface FunctionalMotionPreset {
  intent: MotionIntent
  durationSeconds?: number
  spring?: {
    stiffness: number
    damping: number
    mass: number
  }
  enter: { opacity: number; x?: number; y?: number; scale?: number }
  exit: { opacity: number; x?: number; y?: number; scale?: number }
  reducedMotion: { durationSeconds: 0; transform: 'none'; opacityOnly: true }
  functionalPurpose: string
}

const PRESETS: Readonly<Record<MotionIntent, FunctionalMotionPreset>> = {
  'direct-manipulation': {
    intent: 'direct-manipulation',
    spring: { stiffness: 520, damping: 38, mass: 0.72 },
    enter: { opacity: 1, scale: 1 },
    exit: { opacity: 0.92, scale: 0.985 },
    reducedMotion: { durationSeconds: 0, transform: 'none', opacityOnly: true },
    functionalPurpose: 'Keep dragged, pressed or physically manipulated objects visually coupled to user input.',
  },
  'state-change': {
    intent: 'state-change',
    durationSeconds: 0.18,
    enter: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.99 },
    reducedMotion: { durationSeconds: 0, transform: 'none', opacityOnly: true },
    functionalPurpose: 'Make a discrete state transition legible without creating decorative delay.',
  },
  'spatial-continuity': {
    intent: 'spatial-continuity',
    spring: { stiffness: 410, damping: 42, mass: 0.9 },
    enter: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: 12 },
    reducedMotion: { durationSeconds: 0, transform: 'none', opacityOnly: true },
    functionalPurpose: 'Preserve the perceived origin/destination of a panel, card, drawer or object across layout changes.',
  },
  'progressive-disclosure': {
    intent: 'progressive-disclosure',
    durationSeconds: 0.22,
    enter: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 6, scale: 0.995 },
    reducedMotion: { durationSeconds: 0, transform: 'none', opacityOnly: true },
    functionalPurpose: 'Reveal contextual detail only after an explicit action while preserving hierarchy.',
  },
  feedback: {
    intent: 'feedback',
    durationSeconds: 0.12,
    enter: { opacity: 1, scale: 1 },
    exit: { opacity: 0.9, scale: 0.975 },
    reducedMotion: { durationSeconds: 0, transform: 'none', opacityOnly: true },
    functionalPurpose: 'Confirm tap, submit, success or error acknowledgement immediately.',
  },
}

export const PANACEA_MOTION_RULES = {
  functionalOnly: true,
  decorativeInfiniteMotionAllowed: false,
  preserveSpatialMemory: true,
  directManipulationFeedback: true,
  reducedMotionRequired: true,
  maxTimedTransitionSeconds: 0.42,
} as const

export function getMotionPreset(intent: MotionIntent, prefersReducedMotion = false) {
  const preset = PRESETS[intent]
  if (!prefersReducedMotion) return preset
  return {
    ...preset,
    durationSeconds: 0,
    spring: undefined,
    enter: { opacity: preset.enter.opacity },
    exit: { opacity: preset.exit.opacity },
  } satisfies FunctionalMotionPreset
}

export function validateMotionPreset(preset: FunctionalMotionPreset) {
  if (!preset.functionalPurpose.trim()) throw new Error('motion must have a functional purpose')
  if (preset.durationSeconds !== undefined && preset.durationSeconds > PANACEA_MOTION_RULES.maxTimedTransitionSeconds) {
    throw new Error('timed UI transition exceeds global motion budget')
  }
  if (preset.durationSeconds !== undefined && preset.durationSeconds < 0) throw new Error('duration cannot be negative')
  if (preset.spring) {
    if (preset.spring.stiffness <= 0 || preset.spring.damping <= 0 || preset.spring.mass <= 0) throw new Error('spring physics values must be positive')
  }
  if (preset.reducedMotion.durationSeconds !== 0 || preset.reducedMotion.transform !== 'none') {
    throw new Error('reduced-motion fallback must remove animated transforms')
  }
  return true
}

export function listMotionPresets() {
  return (Object.keys(PRESETS) as MotionIntent[]).map((intent) => PRESETS[intent])
}
