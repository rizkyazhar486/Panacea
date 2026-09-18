import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/pages/bodyExposureOS.css', 'utf8')

// Body Exposure must prioritize the anatomy/simulation content over decorative
// chrome. The shell stays dark and quiet instead of layering ornamental glow.
assert.doesNotMatch(css, /radial-gradient|conic-gradient/,
  'Body Exposure reintroduced decorative radial/conic background effects')
assert.match(css, /\.body-exposure-os__ambient\s*\{[\s\S]*display:\s*none/,
  'decorative ambient layer is visible again')
assert.match(css, /\.body-exposure-os__glass\s*\{[\s\S]*background:\s*transparent[\s\S]*backdrop-filter:\s*none[\s\S]*box-shadow:\s*none/,
  'orientation header became a floating glass card again')

// Modes remain continuously reachable while the user explores deeper panels.
assert.match(css, /\.body-exposure-os__dock\s*\{[\s\S]*position:\s*sticky[\s\S]*top:\s*8px/,
  'Body Exposure mode ribbon is not sticky')
assert.match(css, /\.body-exposure-os__dock button\[aria-pressed="true"\][\s\S]*background:\s*rgba\(255, 255, 255, 0\.08\)/,
  'active mode does not have compact deterministic state feedback')

// The outer BodyExplorer wrapper must not become another card around a card.
assert.match(css, /\.body-exposure-os__core\s*\{[\s\S]*background:\s*transparent[\s\S]*box-shadow:\s*none[\s\S]*backdrop-filter:\s*none/,
  'Body Explorer outer shell reintroduced redundant floating-card chrome')

// Simulation/panel navigation stays flat and readable rather than a pill mosaic.
assert.match(css, /\[aria-label="Panel groups"\] button\s*\{[\s\S]*border-radius:\s*0[\s\S]*background:\s*transparent/,
  'simulation group controls reverted to decorative pills')
assert.match(css, /\[aria-label="Panel groups"\] button\[aria-pressed="true"\][\s\S]*border-bottom-color/,
  'active simulation group lost its restrained selected-state indicator')

// Mobile must reveal the visual stage quickly and preserve one-line status.
assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.body-exposure-os__glass p\s*\{[\s\S]*display:\s*none/,
  'mobile Body Exposure still leads with paragraph copy before the visual stage')
assert.match(css, /\.body-exposure-os__dock \+ div\s*\{[\s\S]*white-space:\s*nowrap/,
  'mode status can expand into multi-line scrolling copy')

// Accessibility preferences remain first-class.
assert.match(css, /prefers-reduced-transparency: reduce/,
  'reduced-transparency fallback disappeared')
assert.match(css, /prefers-reduced-motion: reduce/,
  'reduced-motion fallback disappeared')

console.log('body-exposure-visual-simulation-ui: visual-first shell, flat simulation navigation, sticky modes, mobile-first content reveal, and accessibility fallbacks.')
