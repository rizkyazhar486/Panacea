export type MotionIntent =
  | 'orient'
  | 'focus'
  | 'reveal'
  | 'transition'
  | 'simulate'
  | 'confirm'
  | 'warn'
  | 'ambient'
  | 'compare'
  | 'navigate'

export type MotionPhysics = 'spring' | 'inertial' | 'linear' | 'breathing' | 'pulse' | 'wave' | 'orbit' | 'scan'

export interface MotionRecipe {
  id: string
  label: string
  intent: MotionIntent
  physics: MotionPhysics
  durationMs: number
  stiffness: number
  damping: number
  mass: number
  distance: number
  scale: number
  opacityFrom: number
  blurFrom: number
  reducedMotionFallback: 'instant' | 'fade' | 'short-fade'
  notes: string
}

const m = (
  id: string,
  label: string,
  intent: MotionIntent,
  physics: MotionPhysics,
  durationMs: number,
  stiffness: number,
  damping: number,
  mass: number,
  distance: number,
  scale: number,
  opacityFrom: number,
  blurFrom: number,
  reducedMotionFallback: MotionRecipe['reducedMotionFallback'],
  notes: string,
): MotionRecipe => ({ id, label, intent, physics, durationMs, stiffness, damping, mass, distance, scale, opacityFrom, blurFrom, reducedMotionFallback, notes })

export const BODY_MOTION_RECIPES: readonly MotionRecipe[] = [
  m('panel-enter', 'Panel Enter', 'reveal', 'spring', 420, 260, 30, .8, 12, .985, 0, 10, 'short-fade', 'Primary panels rise subtly without dramatic travel.'),
  m('panel-exit', 'Panel Exit', 'transition', 'spring', 280, 300, 34, .75, 8, .99, 1, 0, 'instant', 'Fast removal preserves spatial continuity.'),
  m('card-magnetic', 'Magnetic Card', 'focus', 'spring', 260, 360, 28, .55, 4, 1.012, 1, 0, 'instant', 'Small pointer attraction; never enough to disturb reading.'),
  m('dock-select', 'Dock Selection', 'navigate', 'spring', 320, 420, 32, .5, 3, 1.02, .6, 2, 'short-fade', 'Selection indicator slides with compact spring response.'),
  m('whole-body-orbit', 'Whole-Body Orbit', 'orient', 'orbit', 18000, 0, 0, 0, 0, 1, 1, 0, 'instant', 'Very slow environmental orbit; user camera control wins immediately.'),
  m('organ-focus', 'Organ Focus', 'focus', 'spring', 720, 180, 24, .9, 36, 1.04, .4, 12, 'fade', 'Camera and context converge toward selected organ.'),
  m('layer-explode', 'Layer Explosion', 'reveal', 'spring', 900, 130, 22, 1, 80, 1, .2, 8, 'fade', 'Ordered anatomical layers separate along controlled depth axis.'),
  m('layer-collapse', 'Layer Collapse', 'orient', 'spring', 700, 170, 26, .9, 70, 1, 1, 0, 'short-fade', 'Exploded layers return to canonical whole-body arrangement.'),
  m('portal-enter', 'Portal Enter', 'transition', 'inertial', 1100, 0, 0, 0, 120, 1.18, 0, 18, 'fade', 'Organ-to-tissue camera passage with strong but brief depth cue.'),
  m('portal-exit', 'Portal Exit', 'transition', 'inertial', 760, 0, 0, 0, 90, .92, 1, 6, 'short-fade', 'Fast return from micro world to parent scale.'),
  m('micro-zoom', 'Micro Zoom', 'navigate', 'inertial', 1200, 0, 0, 0, 160, 1.3, 0, 24, 'fade', 'Continuous organ→tissue→cell transition.'),
  m('label-reveal', 'Label Reveal', 'reveal', 'spring', 300, 340, 30, .5, 6, .98, 0, 5, 'short-fade', 'Labels appear only after anchor settles.'),
  m('label-reflow', 'Label Reflow', 'orient', 'spring', 420, 220, 26, .7, 18, 1, 1, 0, 'instant', 'Spatial labels reposition without snapping.'),
  m('scan-sweep', 'Scan Sweep', 'simulate', 'scan', 1600, 0, 0, 0, 100, 1, .1, 0, 'fade', 'Plane traverses synthetic anatomy for CT/MRI/ultrasound concepts.'),
  m('slice-scrub', 'Slice Scrub', 'navigate', 'inertial', 180, 0, 0, 0, 4, 1, 1, 0, 'instant', 'Very low latency movement follows direct manipulation.'),
  m('flow-particles', 'Flow Particles', 'simulate', 'wave', 2200, 0, 0, 0, 24, 1, .25, 0, 'fade', 'Directional flow particles for blood, air, lymph, or signal abstractions.'),
  m('cardiac-pulse', 'Cardiac Pulse', 'simulate', 'pulse', 820, 0, 0, 0, 0, 1.045, .82, 0, 'fade', 'Short asymmetric pulse synchronized to synthetic cardiac phase.'),
  m('respiratory-breath', 'Respiratory Breath', 'simulate', 'breathing', 4200, 0, 0, 0, 0, 1.035, .9, 0, 'fade', 'Slow expansion/contraction for lung and environmental ambience.'),
  m('neural-fire', 'Neural Fire', 'simulate', 'wave', 420, 0, 0, 0, 42, 1.08, 0, 2, 'short-fade', 'Rapid directional signal along a selected pathway.'),
  m('vascular-beat', 'Vascular Beat', 'simulate', 'wave', 900, 0, 0, 0, 16, 1.02, .65, 0, 'fade', 'Subtle pulse travels along vessel path.'),
  m('compare-split', 'Compare Split', 'compare', 'spring', 560, 190, 26, .85, 50, 1, .2, 8, 'fade', 'Normal and pathology contexts separate into synchronized halves.'),
  m('compare-merge', 'Compare Merge', 'compare', 'spring', 480, 230, 28, .7, 42, 1, 1, 0, 'short-fade', 'Split reality returns to one shared scene.'),
  m('warning-pulse', 'Warning Pulse', 'warn', 'pulse', 900, 0, 0, 0, 0, 1.025, .55, 0, 'fade', 'Restrained urgency pulse; no constant flashing.'),
  m('success-settle', 'Success Settle', 'confirm', 'spring', 520, 240, 24, .65, 10, 1.035, .6, 4, 'short-fade', 'Completion state settles rather than bursts.'),
  m('mission-node', 'Mission Node', 'ambient', 'breathing', 3200, 0, 0, 0, 0, 1.08, .45, 0, 'fade', 'Map node gently breathes to indicate availability.'),
  m('map-travel', 'Map Travel', 'navigate', 'inertial', 780, 0, 0, 0, 120, 1.08, .5, 10, 'fade', 'Camera transitions between anatomical districts.'),
  m('cinematic-intro', 'Cinematic Intro', 'orient', 'inertial', 1800, 0, 0, 0, 180, 1.14, 0, 24, 'fade', 'Optional introduction; skippable and never blocks core navigation.'),
  m('cinematic-recap', 'Cinematic Recap', 'orient', 'inertial', 1400, 0, 0, 0, 120, 1.08, 0, 18, 'fade', 'Session recap links visited structures as a short montage.'),
  m('holo-float', 'Holographic Float', 'ambient', 'breathing', 6200, 0, 0, 0, 5, 1.01, .78, 0, 'fade', 'Slow depth drift for nonessential decorative surfaces.'),
  m('particle-twinkle', 'Particle Twinkle', 'ambient', 'pulse', 3400, 0, 0, 0, 0, 1.4, .08, 0, 'instant', 'Sparse background particles; density should remain low.'),
  m('gesture-release', 'Gesture Release', 'navigate', 'spring', 460, 210, 24, .7, 16, 1, 1, 0, 'instant', 'Object continues briefly after drag then settles.'),
  m('snap-target', 'Snap to Target', 'focus', 'spring', 360, 380, 32, .55, 18, 1.02, 1, 0, 'instant', 'Selected spatial object snaps into a readable focal position.'),
  m('tooltip-enter', 'Tooltip Enter', 'reveal', 'spring', 220, 420, 34, .45, 4, .99, 0, 3, 'short-fade', 'Fast contextual information reveal.'),
  m('tooltip-exit', 'Tooltip Exit', 'transition', 'linear', 120, 0, 0, 0, 2, .995, 1, 0, 'instant', 'Quick disappearance prevents UI trails.'),
  m('drawer-open', 'Drawer Open', 'reveal', 'spring', 460, 240, 28, .8, 42, 1, .25, 7, 'fade', 'Side knowledge drawer preserves main spatial scene.'),
  m('drawer-close', 'Drawer Close', 'transition', 'spring', 320, 300, 32, .65, 36, 1, 1, 0, 'short-fade', 'Drawer exits faster than it entered.'),
  m('focus-dim', 'Context Focus Dim', 'focus', 'linear', 260, 0, 0, 0, 0, 1, 1, 0, 'fade', 'Nonselected structures dim without vanishing completely.'),
  m('focus-restore', 'Context Restore', 'orient', 'linear', 320, 0, 0, 0, 0, 1, .35, 0, 'fade', 'Context gradually returns after focal exploration.'),
  m('loading-orbit', 'Loading Orbit', 'ambient', 'orbit', 1800, 0, 0, 0, 0, 1, .4, 0, 'instant', 'Compact loader used only when real work is pending.'),
  m('data-stream', 'Data Stream', 'simulate', 'linear', 1400, 0, 0, 0, 28, 1, .2, 0, 'fade', 'Directional numeric or signal stream for synthetic telemetry.'),
] as const

export function bodyMotionRecipe(id: string) {
  return BODY_MOTION_RECIPES.find((recipe) => recipe.id === id) ?? BODY_MOTION_RECIPES[0]
}

export function bodyMotionByIntent(intent: MotionIntent) {
  return BODY_MOTION_RECIPES.filter((recipe) => recipe.intent === intent)
}

export function bodyMotionByPhysics(physics: MotionPhysics) {
  return BODY_MOTION_RECIPES.filter((recipe) => recipe.physics === physics)
}

export function bodyMotionDuration(id: string, speed = 1) {
  const recipe = bodyMotionRecipe(id)
  const normalizedSpeed = Math.max(.25, Math.min(4, speed))
  return Math.round(recipe.durationMs / normalizedSpeed)
}

export function bodySpring(id: string) {
  const recipe = bodyMotionRecipe(id)
  return {
    type: 'spring' as const,
    stiffness: recipe.stiffness || 220,
    damping: recipe.damping || 26,
    mass: recipe.mass || .7,
  }
}

export const BODY_MOTION_PRINCIPLES = [
  'Direct manipulation receives immediate visual feedback.',
  'Navigation motion explains spatial continuity rather than decorating it.',
  'Ambient motion is sparse and subordinate to anatomy and text.',
  'Exit transitions are usually faster than entrance transitions.',
  'Large camera travel uses inertial easing; local UI uses spring behavior.',
  'Reduced-motion users receive instant or short-fade alternatives.',
  'No essential information depends on animation alone.',
  'No perpetual flashing warning effects.',
  'Touch targets remain stable while decorative layers may drift.',
  'Camera motion stops immediately when the user takes control.',
] as const
