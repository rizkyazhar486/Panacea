import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../src/components/bodyhub/Body3D.tsx', import.meta.url), 'utf8')

assert.match(
  source,
  /createBodyRenderScheduler/,
  'Body3D must use the shared invalidation scheduler instead of owning another RAF implementation.',
)
assert.match(
  source,
  /createBodyWebglContextLifecycle/,
  'Body3D must use the shared WebGL context-loss lifecycle.',
)
assert.match(
  source,
  /const renderScheduler = createBodyRenderScheduler\(\{/,
  'Body3D must instantiate the shared render scheduler.',
)
assert.match(
  source,
  /canRender:\s*\(\) => inViewport && documentVisible && !contextLifecycle\.isLost\(\)/,
  'Render eligibility must fail closed while the atlas is offscreen, hidden, or context-lost.',
)
assert.match(
  source,
  /onLost:\s*\(\) => \{[\s\S]*?renderScheduler\.stop\(\)/,
  'Context loss must stop any pending Body3D frame.',
)
assert.match(
  source,
  /onRestored:\s*\(\) => \{[\s\S]*?renderScheduler\.request\(\)/,
  'A genuine context restoration must request one fresh Body3D frame.',
)
assert.match(source, /contextLifecycle\.handleLost\(e\)/)
assert.match(source, /contextLifecycle\.handleRestored\(\)/)
assert.match(source, /renderScheduler\.dispose\(\)/)
assert.match(source, /contextLifecycle\.dispose\(\)/)

assert.doesNotMatch(
  source,
  /let raf = 0/,
  'Body3D must not retain a second local RAF scheduler once the shared scheduler is wired.',
)
assert.doesNotMatch(
  source,
  /cancelAnimationFrame\(raf\)/,
  'Body3D frame cancellation must flow through the shared scheduler.',
)

console.log('Body3D shared runtime lifecycle: scheduler and WebGL context state are centralized and fail closed.')
