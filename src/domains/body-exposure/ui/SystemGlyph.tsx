// One glyph per body system, drawn as simple line art so a system is recognised without reading a word. The name
// always travels with it as an accessible label and a tooltip; the glyph never carries meaning on its own.

import type { BodySystemId } from '../data/bodySystems.ts'

const P: Readonly<Record<BodySystemId, string>> = {
  // Brain: skull outline with a folded cortex line.
  nervous: 'M8 6.2c2-2.4 6-2.4 8 0c2.4.5 3.4 3 2.4 5c.8 2-.4 4.4-2.6 4.8c-.4 2-3 2.6-4.3 1.2c-1.6 1.2-4-.1-4-2c-2.2-.6-3-3.2-1.7-4.9c-1-2 0-4.4 2.2-4.1ZM12 6v12',
  // Eye with an iris.
  'sensory-ent': 'M2.5 12c3-4.6 6.2-6.9 9.5-6.9s6.5 2.3 9.5 6.9c-3 4.6-6.2 6.9-9.5 6.9S5.5 16.6 2.5 12Z M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6Z',
  // Thyroid-shaped gland: two lobes joined by an isthmus.
  endocrine: 'M8.5 6.5c-2.6 0-4 2.4-4 5s1.6 5.5 4 5.5c1.8 0 2.6-1.8 2.8-3.6h1.4c.2 1.8 1 3.6 2.8 3.6c2.4 0 4-2.9 4-5.5s-1.4-5-4-5',
  // Two lungs and a trachea.
  respiratory: 'M12 3v8 M9.5 11c0-2-1-3.2-2.4-3.2C5.2 7.8 4 10.4 4 13.4c0 2.4.6 4.6 2.2 4.6c1.6 0 3.3-1.4 3.3-3.4Zm5 0c0-2 1-3.2 2.4-3.2c1.9 0 3.1 2.6 3.1 5.6c0 2.4-.6 4.6-2.2 4.6c-1.6 0-3.3-1.4-3.3-3.4Z',
  // Heart with the great vessels leaving the base.
  cardiovascular: 'M12 20.5C7 16.9 3.5 13.9 3.5 10.2A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8.5 2.6c0 3.7-3.5 6.7-8.5 10.3Z M12 7.6V3.5 M12 5h4',
  // Shield: the immune system's defended line.
  'lymphatic-immune': 'M12 3l7.5 3v6c0 4.2-3 7.8-7.5 9.4C7.5 19.8 4.5 16.2 4.5 12V6Zm-3 8.8l2.2 2.3l4-4.4',
  // Stomach and duodenum.
  digestive: 'M9 3.5v3.2c-2.6 1-4.3 3.3-4.3 6.4c0 3.6 2.7 6.4 6 6.4c2.6 0 4.6-1.6 4.6-3.8c0-2-1.5-3.2-3.4-3.2c-1.3 0-2.2.7-2.2 1.7',
  // A kidney with its hilum and ureter.
  urinary: 'M14.5 4.2c3 0 5 3.3 5 7.4s-2 7.4-5 7.4c-2.2 0-3.1-1.8-3.8-3.6c-.7-1.9-1.4-2.8-3-3.8c1.6-1 2.3-1.9 3-3.8c.7-1.8 1.6-3.6 3.8-3.6Z M11.7 11.6H7.5 M7.5 11.6v7',
  // Uterus-and-ovaries outline: the organ pair the atlas does not ship.
  reproductive: 'M8 4.5c0 3.2.6 5 1.8 6.4C11 12.3 12 13.7 12 16v4m0-4c0-2.3 1-3.7 2.2-5.1C15.4 9.5 16 7.7 16 4.5M5.5 5.6a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 0 0 0-3.6Zm13 0a1.8 1.8 0 1 1 0 3.6a1.8 1.8 0 0 1 0-3.6Z',
  // Layered skin with a hair follicle.
  'integumentary-surface': 'M3 8.5h18 M3 13h18 M3 17.5h18 M8 8.5V4 M16 17.5v3',
  // Biceps-and-bone: muscle belly over a long bone.
  musculoskeletal: 'M4 17.2c1.8-5.6 4.6-8.6 8.4-8.6c2.8 0 4.6 1.8 4.6 4.2c0 2-1.4 3.4-3.2 3.4c-1.4 0-2.4-.9-2.4-2.1 M17 5.2a2 2 0 1 1 2.8 2.8l-6 6 M14.5 3.5l1.6 1.6',
}

export interface SystemGlyphProps {
  readonly system: BodySystemId
  readonly size?: number
}

/** Decorative on its own: the control around it carries the name. */
export function SystemGlyph({ system, size = 22 }: SystemGlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d={P[system]} />
    </svg>
  )
}

export default SystemGlyph
