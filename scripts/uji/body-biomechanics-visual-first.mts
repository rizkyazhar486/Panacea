import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/pages/bodyhub/BiomechanicsMotionLab.tsx', 'utf8')
const workout = readFileSync('src/pages/bodyhub/WorkoutSimSection.tsx', 'utf8')

// Whole-body / source-backed anatomy should remain the first visual on mobile.
assert.match(source, /relative order-1 min-h-\[390px\][\s\S]*md:order-2/,
  'source atlas is no longer first on mobile')
assert.match(source, /relative order-2 min-h-\[300px\][\s\S]*md:order-1/,
  'motion video ordering no longer complements the atlas-first mobile layout')

// Header must stay compact and single-purpose instead of carrying a long
// explanatory paragraph before the visualization.
assert.match(source, /<h3 className="truncate text-sm font-black">Motion ↔ source-backed atlas<\/h3>/,
  'biomechanics header lost its compact one-line title')
assert.doesNotMatch(source, /A side-by-side workspace inspired by the supplied reference/,
  'long promotional/explanatory copy returned above the visual stage')

// Validation caveats remain available, but do not occupy three equal-weight cards.
assert.match(source, /Validation boundaries & atlas provenance/,
  'validation boundaries are not one-tap reachable')
assert.doesNotMatch(source, /grid gap-2 sm:grid-cols-3[\s\S]*Pose[\s\S]*Force vectors[\s\S]*Atlas provenance/,
  'validation boundaries returned as a three-card dashboard')

// Overlay labels should be functional and restrained, without blur/glass chrome.
assert.doesNotMatch(source, /backdrop-blur/,
  'biomechanics overlays reintroduced blur/glass decoration')
assert.match(source, /Source atlas · drag or touch to rotate/,
  'atlas interaction cue disappeared')

// Movement/force simulation should follow the same visual-first hierarchy.
assert.match(workout, /Anatomy → kinetic chain → mechanics/,
  'movement simulator lost its compact one-line hierarchy')
assert.match(workout, /grid grid-cols-3 border-y border-neutral-200/,
  'movement mode switch returned to a filled segmented card')
assert.match(workout, /overflow-x-auto pb-1 no-scrollbar/,
  'movement choices no longer use a compact horizontal rail')
assert.match(workout, /Transparent equations<\/summary>/,
  'mechanics equations are no longer progressively disclosed')
assert.match(workout, /References & teaching limits/,
  'biomechanics references or teaching limits disappeared')
assert.doesNotMatch(workout, /bg-gradient-to-br from-white to-brand/,
  'decorative movement-atlas gradient header returned')

console.log('body-biomechanics-visual-first: atlas-first mobile order, compact motion/movement hierarchy, restrained overlays, flat simulation controls, and progressive validation/equation disclosures.')
