// Accessibility helpers shared by the Body Exposure decks. Presentation only: no physiology, no rules.
//
// Why this exists: axe-core 4.10.2, run in a real browser over every deck on the stage, measured 18 critical
// `label` nodes (range sliders with no accessible name) and 18 serious `color-contrast` nodes. The decks now
// name each slider, say its value with the unit, and take the one colour below from here.

/**
 * Fill behind white text on an active toggle. White on #0369a1 is 5.93:1.
 * It replaces #0284c7 (4.09:1) and #3b82f6 (3.67:1), both measured below the 4.5:1 AA threshold.
 */
export const DECK_ACTIVE_FILL = '#0369a1'

/**
 * What a screen reader announces for a slider: the value WITH its unit ("2.2 mmHg/mL"), not a bare number.
 * A value that is not a finite number yields undefined, so nothing misleading is announced; an unusable
 * `digits` is ignored rather than allowed to throw.
 */
export function sliderValueText(value: number, unit: string, digits?: number): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  const fixed = typeof digits === 'number' && Number.isInteger(digits) && digits >= 0 && digits <= 6
  const shown = fixed ? value.toFixed(digits) : String(value)
  const suffix = typeof unit === 'string' ? unit.trim() : ''
  return suffix ? `${shown} ${suffix}` : shown
}
