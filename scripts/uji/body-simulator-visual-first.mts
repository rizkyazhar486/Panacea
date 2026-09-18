import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/pages/bodyhub/SimulatorSection.tsx', 'utf8')

// Simulator should lead with the coupled visual model and compact state,
// while long assumptions/context remain one interaction away.
assert.match(source, /Circulation ↔ gas exchange ↔ kidney · steady-state educational model/,
  'simulator lost its one-line system status')
assert.match(source, /Scenario context · \{skenario\.label\}/,
  'scenario narrative is not progressively disclosed')
assert.match(source, /Simulation assumptions/,
  'visual coupling assumptions are no longer one-tap reachable')
assert.match(source, /Model limits & equations/,
  'model limitations and equations are no longer one-tap reachable')

// Scenario controls stay horizontal and touch-friendly instead of wrapping into
// a dense pill mosaic on mobile.
assert.match(source, /flex gap-1\.5 overflow-x-auto pb-1 no-scrollbar/,
  'scenario rail no longer uses local horizontal scrolling')
assert.match(source, /min-h-\[40px\] shrink-0 rounded-full/,
  'scenario targets are not stable touch-sized controls')

// Metrics should read as instruments rather than equal-weight cards.
assert.match(source, /min-w-0 border-t border-neutral-200 pt-2/,
  'metric instruments lost their flat top-rule hierarchy')
assert.doesNotMatch(source, /rounded-lg p-2 \$\{buruk \? 'bg-red-50/,
  'metric cards returned as colored dashboard tiles')
assert.match(source, /Outside teaching reference/,
  'abnormal-state semantics disappeared from assistive text')

// The system coupling figure is the visual focus and should not be nested inside
// another filled card.
assert.match(source, /<figure className="border-y border-neutral-200 py-3/,
  'system coupling visual returned to a filled floating card')

console.log('body-simulator-visual-first: compact scenarios, visual coupling first, flat instrument metrics, progressive assumptions, and explicit state semantics.')
