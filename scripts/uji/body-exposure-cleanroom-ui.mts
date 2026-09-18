import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/pages/bodyExposureOS.css', 'utf8')
const simulator = readFileSync('src/pages/bodyhub/SimulatorSection.tsx', 'utf8')
const motion = readFileSync('src/pages/bodyhub/BiomechanicsMotionLab.tsx', 'utf8')
const movement = readFileSync('src/pages/bodyhub/WorkoutSimSection.tsx', 'utf8')

// Body Exposure must read as one continuous canvas, not a dashboard of nested cards.
assert.match(css, /\.body-exposure-os\s*\{[\s\S]*border:\s*0;[\s\S]*border-radius:\s*0;[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/)
assert.match(css, /\.body-exposure-os__core > div > \.kaca\s*\{[\s\S]*border:\s*0 !important;[\s\S]*border-radius:\s*0 !important;[\s\S]*background:\s*transparent !important;/)
assert.doesNotMatch(css, /radial-gradient|conic-gradient/, 'decorative ambient gradients returned to Body Exposure')
assert.match(css, /\.body-exposure-os__glass p,[\s\S]*grid-cols-3[\s\S]*display:\s*none !important;/,
  'hero prose / orientation tiles are visible above the body again')

// Primary mode and panel navigation should be text + underline, not pill mosaics.
assert.match(css, /\.body-exposure-os__dock button\s*\{[\s\S]*border-bottom:\s*2px solid transparent[\s\S]*border-radius:\s*0 !important;/)
assert.match(css, /aria-label="Panel groups"[\s\S]*border-radius:\s*0 !important;/)
assert.match(css, /aria-label="Panel groups"[\s\S]*border-bottom-color:\s*#00bf63 !important;/)

// Physiology simulator: scenario selection is a flat rail and metrics are instruments.
assert.match(simulator, /flex gap-5 overflow-x-auto border-b border-neutral-200/)
assert.match(simulator, /border-0 border-b-2 bg-transparent px-0/)
assert.match(simulator, /aria-label="Circulation outputs"/)
assert.match(simulator, /aria-label="Gas exchange outputs"/)
assert.match(simulator, /aria-label="Kidney outputs"/)
assert.doesNotMatch(simulator, /bg-emerald-400/, 'healthy metric state should not create decorative green dots')

// Motion lab: anatomy first on mobile, no glass/blur chrome, flat target rail.
assert.match(motion, /order-1 min-h-\[390px\][\s\S]*md:order-2/)
assert.match(motion, /order-2 min-h-\[300px\][\s\S]*md:order-1/)
assert.doesNotMatch(motion, /backdrop-blur/)
assert.match(motion, /Muscle and tendon targets[\s\S]*border-b-2 bg-transparent px-0/)

// Movement lab: cards/pills are replaced by dividers, rails, and disclosure.
assert.match(movement, /Anatomy → kinetic chain → mechanics/)
assert.match(movement, /Clinical note/)
assert.match(movement, /Interpret movement/)
assert.match(movement, /Common mechanical error/)
assert.match(movement, /Force-model assumptions/)
assert.match(movement, /References & teaching limits/)
assert.doesNotMatch(movement, /bg-gradient-to-br/, 'decorative movement header gradient returned')
assert.match(movement, /LATIHAN\.map[\s\S]*border-0 border-b-2 bg-transparent px-0/)

// Accessibility preferences stay intact.
assert.match(css, /prefers-reduced-transparency: reduce/)
assert.match(css, /prefers-reduced-motion: reduce/)

console.log('body-exposure-cleanroom-ui: one continuous canvas, visual-first hierarchy, flat instrument navigation, progressive disclosure, and no decorative dashboard chrome.')
