import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../src/components/CardiacCycle3D.tsx', import.meta.url), 'utf8')

assert.match(source, /role="region"/, 'cardiac WebGL must expose a labelled region')
assert.match(source, /aria-label="Animated cardiac cycle 3D visualization"/, 'cardiac WebGL region must be named')
assert.match(source, /aria-busy=\{muat && !gagal\}/, 'loading state must be machine-readable')
assert.match(source, /role="status" aria-live="polite"/, 'loading/ready state must be announced politely')
assert.match(source, /role="alert"/, 'WebGL/source failures must be announced as errors')
assert.match(source, /setAttribute\('aria-hidden', 'true'\)/, 'raw canvas must not become a duplicate accessibility surface')
assert.match(source, /IntersectionObserver/, 'offscreen WebGL pause lifecycle must remain intact')
assert.match(source, /visibilitychange/, 'background-tab pause lifecycle must remain intact')
assert.match(source, /renderer\.dispose\(\)/, 'renderer cleanup must remain intact')
assert.match(source, /renderer\.forceContextLoss\(\)/, 'WebGL context cleanup must remain intact')
assert.match(source, /OrbitControls/, 'interactive orbit visualization must remain present')
assert.match(source, /GLTFLoader/, 'source heart geometry loader must remain present')
assert.doesNotMatch(source, /placeholder anatomy|fake geometry|synthetic heart/i, 'light state patch must not substitute anatomy')

console.log('body cardiac-cycle LIGHT accessible-state invariants passed')
