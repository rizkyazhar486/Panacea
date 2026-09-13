import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../src/components/OrganModel3D.tsx', import.meta.url), 'utf8')

assert.match(source, /new IntersectionObserver\(/, 'organ renderer must pause when offscreen')
assert.match(source, /document\.addEventListener\('visibilitychange'/, 'organ renderer must pause for hidden tabs')
assert.match(source, /document\.removeEventListener\('visibilitychange'/, 'visibility listener must be cleaned up')
assert.match(source, /renderer\.forceContextLoss\(\)/, 'WebGL context must be explicitly released on cleanup')
assert.match(source, /renderer\.renderLists\.dispose\(\)/, 'renderer lists must be disposed')
assert.match(source, /mesh\.geometry\.dispose\(\)/, 'mesh geometry must be disposed')
assert.match(source, /webglcontextlost/, 'context loss must fail closed instead of leaving a frozen canvas')
assert.match(source, /e\.preventDefault\(\)/, 'context loss handling must explicitly own the browser recovery path')
assert.match(source, /className="absolute flex h-11 w-11/, 'mobile hotspot hit target must be 44px even when the visual marker stays small')
assert.match(source, /aria-pressed=\{aktif\}/, 'selected hotspot state must be accessible')
assert.match(source, /role="region"/, '3D viewer must expose a labelled region')
assert.match(source, /aria-busy=\{loading\}/, 'loading state must be machine readable')
assert.match(source, /role="status"/, 'loading must be announced politely')
assert.match(source, /role="alert"/, 'fatal WebGL/source failures must be announced')
assert.match(source, /renderer\.domElement\.setAttribute\('aria-hidden', 'true'\)/, 'raw canvas must not duplicate the accessible viewer surface')
assert.match(source, /folderModel\(organ\).*organ\.id\.glb/s, 'source-backed GLB loading must remain intact')
assert.doesNotMatch(source, /BoxGeometry|CapsuleGeometry|CylinderGeometry|synthetic anatomy/i, 'light lifecycle fix must not fabricate replacement anatomy')

console.log('body organ model LIGHT lifecycle invariants: ok')
