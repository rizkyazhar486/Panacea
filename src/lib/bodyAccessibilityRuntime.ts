export type BodyContrastMode = 'system' | 'standard' | 'high'
export type BodyLabelScale = 'compact' | 'standard' | 'large' | 'xlarge'
export type BodyMotionPreference = 'system' | 'full' | 'reduced'

export interface BodyAccessibilityProfile {
  contrast: BodyContrastMode
  labelScale: BodyLabelScale
  motion: BodyMotionPreference
  captions: boolean
  keyboardNavigation: boolean
  focusRings: boolean
  announceSelection: boolean
  simplifyAmbientFx: boolean
}

export const BODY_ACCESSIBILITY_DEFAULT: BodyAccessibilityProfile = {
  contrast: 'system',
  labelScale: 'standard',
  motion: 'system',
  captions: true,
  keyboardNavigation: true,
  focusRings: true,
  announceSelection: true,
  simplifyAmbientFx: false,
}

export interface BodyAccessibilityResolved {
  highContrast: boolean
  reducedMotion: boolean
  labelScale: number
  captions: boolean
  keyboardNavigation: boolean
  focusRings: boolean
  announceSelection: boolean
  simplifyAmbientFx: boolean
}

export function resolveBodyAccessibility(
  profile: BodyAccessibilityProfile,
  system: { highContrast?: boolean; reducedMotion?: boolean } = {},
): BodyAccessibilityResolved {
  const highContrast = profile.contrast === 'high' || (profile.contrast === 'system' && Boolean(system.highContrast))
  const reducedMotion = profile.motion === 'reduced' || (profile.motion === 'system' && Boolean(system.reducedMotion))
  const labelScale = profile.labelScale === 'compact' ? .88 : profile.labelScale === 'large' ? 1.18 : profile.labelScale === 'xlarge' ? 1.34 : 1
  return {
    highContrast,
    reducedMotion,
    labelScale,
    captions: profile.captions,
    keyboardNavigation: profile.keyboardNavigation,
    focusRings: profile.focusRings,
    announceSelection: profile.announceSelection,
    simplifyAmbientFx: profile.simplifyAmbientFx || reducedMotion,
  }
}

export function browserAccessibilitySignals() {
  return {
    highContrast: window.matchMedia('(prefers-contrast: more)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    forcedColors: window.matchMedia('(forced-colors: active)').matches,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  }
}

export function bodyAccessibilityCssVars(resolved: BodyAccessibilityResolved) {
  return {
    '--body-label-scale': String(resolved.labelScale),
    '--body-motion-factor': resolved.reducedMotion ? '0' : '1',
    '--body-ambient-factor': resolved.simplifyAmbientFx ? '.25' : '1',
    '--body-focus-ring-opacity': resolved.focusRings ? '1' : '0',
    '--body-contrast-factor': resolved.highContrast ? '1.25' : '1',
  } as Record<string, string>
}

export function bodySelectionAnnouncement(label: string, context?: string) {
  const cleanLabel = label.trim() || 'structure'
  const cleanContext = context?.trim()
  return cleanContext ? `Selected ${cleanLabel}. ${cleanContext}.` : `Selected ${cleanLabel}.`
}

export function bodyAccessibilityAudit(profile: BodyAccessibilityResolved) {
  const checks = [
    { id: 'keyboard', pass: profile.keyboardNavigation, message: 'Core spatial actions expose keyboard alternatives.' },
    { id: 'focus', pass: profile.focusRings, message: 'Interactive controls expose visible focus state.' },
    { id: 'captions', pass: profile.captions, message: 'Narrated or timed educational content supports captions.' },
    { id: 'selection-announcement', pass: profile.announceSelection, message: 'Selected structures can be announced to assistive technology.' },
    { id: 'reduced-motion-safe', pass: true, message: profile.reducedMotion ? 'Reduced-motion path active.' : 'Full motion allowed with reduced-motion fallback available.' },
  ]
  return { pass: checks.every((check) => check.pass), checks }
}

export const BODY_ACCESSIBILITY_PRINCIPLES = [
  'Anatomical information must not depend on color alone.',
  'Motion is explanatory, never mandatory for comprehension.',
  'Every core pointer interaction should have a keyboard-accessible equivalent where practical.',
  'Focus indicators remain visible over glass and dark backgrounds.',
  'Floating labels scale without forcing the 3D scene to zoom.',
  'Screen-reader announcements describe selected structures without flooding live regions during camera movement.',
  'Ambient particles and parallax may be suppressed independently of essential simulation motion.',
] as const
