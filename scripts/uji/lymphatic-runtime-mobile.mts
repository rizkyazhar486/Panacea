import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const renderer = await readFile(new URL('../../src/pages/bodyhub/Limfe3D.tsx', import.meta.url), 'utf8')
const panel = await readFile(new URL('../../src/pages/bodyhub/LimfePanel.tsx', import.meta.url), 'utf8')

assert.match(renderer, /muatAtlas\(BERKAS_LIMFOID\)/, 'Lymphatic 3D must load the shipped lymphoid source')
assert.match(renderer, /namaAtlas\(namaAsli, m\)/, 'Runtime must resolve original GLB node names')
assert.match(renderer, /stasiunDariMeshAsli\(asli\)/, 'Selection must stay bound to exact source-node mapping')
assert.match(renderer, /IntersectionObserver/, 'Renderer must pause when offscreen')
assert.match(renderer, /visibilitychange/, 'Renderer must pause in hidden tabs')
assert.match(renderer, /pointercancel/, 'Touch cancellation must clear selection gesture state')
assert.match(renderer, /webglcontextlost/, 'WebGL context loss must fail closed')
assert.match(renderer, /bahanMilikViewport/, 'Viewport-owned cloned materials must be tracked')
assert.match(renderer, /bahan\.dispose\(\)/, 'Viewport-owned cloned materials must be disposed')
assert.match(renderer, /renderLists\.dispose\(\)/, 'Renderer lists must be disposed')
assert.match(renderer, /aria-label="Interactive source-backed lymphatic anatomy"/, '3D region must have an accessible name')
assert.match(renderer, /role="alert"/, 'Fatal 3D state must be announced')
assert.match(panel, /Limfe3D/, 'The source-backed 3D must remain reachable from the lymphatic panel')
assert.match(panel, /semuaMeshTerikat/, 'The panel must continue exposing source-bound geometry coverage')
assert.doesNotMatch(renderer, /new THREE\.(SphereGeometry|BoxGeometry|CylinderGeometry|CapsuleGeometry)/,
  'Do not synthesize substitute lymphatic anatomy geometry')

console.log('Lymphatic runtime/mobile gate: source-backed GLB mapping, offscreen/background pause, touch cancellation, WebGL fail-closed state, owned-material disposal, accessibility, and no synthetic substitute geometry are locked.')
