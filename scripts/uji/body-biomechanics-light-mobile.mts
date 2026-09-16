import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/pages/bodyhub/BiomechanicsMotionLab.tsx', 'utf8')

assert.match(source, /min-h-\[300px\]/, 'mobile motion viewport must not inherit the desktop-only 430px minimum')
assert.match(source, /md:min-h-\[430px\]/, 'desktop motion viewport height must remain preserved')
assert.match(source, /min-h-11/, 'primary touch targets must preserve a 44px mobile floor')
assert.match(source, /preload="metadata"/, 'local video must avoid eager full-media loading')
assert.match(source, /playsInline/, 'motion video must remain inline on mobile browsers')
assert.match(source, /role="status" aria-live="polite"/, 'loading and selection state must be announced accessibly')
assert.match(source, /role="alert"/, 'video decode failure must expose an accessible error state')
assert.match(source, /The 3D atlas remains available/, 'video failure must preserve visualization-first 3D availability')
assert.match(source, /Source atlas · drag or touch to rotate/, 'touch-orbit guidance must remain visible')
assert.match(source, /role="region"[\s\S]*Source-backed rotatable muscle atlas/, 'the 3D atlas must expose an accessible labelled region')
assert.match(source, /AtlasViewer3D/, 'the source-backed 3D atlas must remain mounted')
assert.match(source, /No synthetic skeleton is drawn over the user video/, 'missing pose inference must stay fail-closed')
assert.match(source, /Missing tendons or structures are never substituted with neighbouring geometry/, 'missing anatomy must never be fabricated')

console.log('body-biomechanics-light-mobile: mobile, accessibility, failure-state, and visualization-first invariants hold')
