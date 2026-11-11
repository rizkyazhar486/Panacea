// Visual tokens of the atlas stage. Inline styles only: nothing here reaches the render-blocking CSS budget.
//
// One committed dark look: an anatomical stage is read like an instrument, and the shared viewer paints a
// dark studio in both app themes. Colour carries meaning, the same meaning everywhere on the stage:
//   ref  = reference atlas (not a person) · live = selected / active · sim = simulated · gate = clinical boundary.
// Text colours are chosen for contrast on the panel colour (dim 9.6:1, faint 5.9:1, onLive 7.9:1 on live).
// `active` / `onActive` are the app's own pressed-and-selected grading (white on #0b7a4b, 5.4:1). The global
// control skin paints exactly that on aria-pressed / aria-selected buttons; stating the same pair here keeps
// the stage identical on surfaces where that skin is switched off.

import type { CSSProperties } from 'react'

export const TONE = {
  bg: '#060a12',
  panel: 'rgba(9, 14, 24, 0.76)',
  panelSolid: '#0a1019',
  raised: 'rgba(148, 197, 255, 0.07)',
  line: 'rgba(148, 197, 255, 0.16)',
  lineStrong: 'rgba(148, 197, 255, 0.34)',
  text: '#eef4ff',
  dim: '#a9b9cf',
  faint: '#7f91a8',
  live: '#00bf63',
  onLive: '#04130b',
  active: '#0b7a4b',
  onActive: '#ffffff',
  liveText: '#5ff2a7',
  ref: '#5cd6ff',
  sim: '#ffb547',
  gate: '#ff8f9b',
} as const

/** Smallest touch target on the stage (px). */
export const TOUCH = 44

export const glass: CSSProperties = {
  background: TONE.panel,
  border: `1px solid ${TONE.line}`,
  backdropFilter: 'blur(14px) saturate(1.25)',
  WebkitBackdropFilter: 'blur(14px) saturate(1.25)',
  borderRadius: 16,
}

export const eyebrow: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
}

export const iconButton: CSSProperties = {
  ...glass,
  width: TOUCH,
  height: TOUCH,
  display: 'grid',
  placeItems: 'center',
  color: TONE.text,
  cursor: 'pointer',
  padding: 0,
  flex: 'none',
}

export const rootFrame: CSSProperties = {
  width: '100%',
  borderRadius: 24,
  overflow: 'hidden',
  border: `1px solid ${TONE.line}`,
  background: TONE.bg,
}

/** A soft light from above the head, over the canvas; it never takes a pointer event. */
export const stageGlow: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background: 'radial-gradient(90% 55% at 50% 0%, rgba(92, 214, 255, 0.09), rgba(92, 214, 255, 0) 70%)',
}

export const paragraph: CSSProperties = { margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: TONE.dim }

export const primaryButton: CSSProperties = {
  width: '100%',
  minHeight: TOUCH,
  padding: '0 16px',
  border: 'none',
  borderRadius: 14,
  background: TONE.live,
  color: TONE.onLive,
  fontSize: 14,
  fontWeight: 800,
  cursor: 'pointer',
}

export const subtleButton: CSSProperties = {
  minHeight: TOUCH,
  padding: '0 12px',
  border: `1px solid ${TONE.line}`,
  borderRadius: 14,
  background: TONE.raised,
  color: TONE.text,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

/**
 * The few rules inline styles cannot express: keyboard focus, hover, hidden scrollbars, and motion that is
 * opt-in — transitions exist only when neither the system nor the app's own setting asks for reduced motion.
 * Static text, scoped to the stage root; no user data is ever interpolated into it.
 */
export const STAGE_CSS = `
[data-atlas-stage] .as-root { height: calc(100vh - 104px); height: calc(100dvh - 104px); }
[data-atlas-stage] button, [data-atlas-stage] input { font: inherit; }
[data-atlas-stage] .as-focus:focus-visible { outline: 2px solid ${TONE.ref}; outline-offset: 2px; }
[data-atlas-stage] .as-field:focus-within { border-color: ${TONE.ref}; box-shadow: 0 0 0 2px rgba(92, 214, 255, 0.3); }
[data-atlas-stage] .as-hover:hover { border-color: ${TONE.lineStrong}; background: rgba(148, 197, 255, 0.12); }
[data-atlas-stage] .as-scroll { scrollbar-width: none; }
[data-atlas-stage] .as-scroll::-webkit-scrollbar { display: none; }
[data-atlas-stage] .as-panel-scroll { scrollbar-width: thin; scrollbar-color: rgba(148, 197, 255, 0.3) transparent; }
@media (prefers-reduced-motion: no-preference) {
  html:not(.reduce-motion) [data-atlas-stage] .as-move { transition: height 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); }
  html:not(.reduce-motion) [data-atlas-stage] .as-fade { transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease; }
}
`
