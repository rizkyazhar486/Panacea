import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createBodyWebglContextLifecycle } from '../../src/lib/bodyWebglContextLifecycle.ts'

let lostCount = 0
let restoredCount = 0
let preventedCount = 0

const lifecycle = createBodyWebglContextLifecycle({
  onLost: () => { lostCount += 1 },
  onRestored: () => { restoredCount += 1 },
})

const lossEvent = { preventDefault: () => { preventedCount += 1 } }
lifecycle.handleLost(lossEvent)
lifecycle.handleLost(lossEvent)
assert.equal(preventedCount, 2, 'every context-loss event must opt into browser restoration')
assert.equal(lostCount, 1, 'duplicate loss events must not duplicate renderer shutdown')
assert.equal(lifecycle.isLost(), true)

lifecycle.handleRestored()
lifecycle.handleRestored()
assert.equal(restoredCount, 1, 'only a lost context can transition back to restored')
assert.equal(lifecycle.isLost(), false)

lifecycle.handleLost(lossEvent)
lifecycle.dispose()
lifecycle.handleRestored()
assert.equal(restoredCount, 1, 'disposed renderers must not restart after context restoration')

const renderer = readFileSync(new URL('../../src/components/BodyAllSystems3D.tsx', import.meta.url), 'utf8')
assert.match(renderer, /webglcontextlost/)
assert.match(renderer, /webglcontextrestored/)
assert.match(renderer, /contextLifecycle\.dispose\(\)/)
assert.match(renderer, /Graphics context was lost/)
assert.match(renderer, /contextAvailable/)

console.log('body WebGL lifecycle: context loss fails closed, opts into restoration, and cannot revive a disposed renderer')
