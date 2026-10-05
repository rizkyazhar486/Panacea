import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../src/components/OrganModel3D.tsx', import.meta.url), 'utf8')

// Jeda offscreen / tab tersembunyi / konteks hilang kini disediakan SATU loop bersama
// (loopRenderTerjaga); gerbang ini mengunci bahwa penampil organ memakainya dan melepasnya.
assert.match(source, /mulaiLoopTerjaga\(/, 'organ renderer must pause offscreen/hidden through the shared guarded loop')
assert.match(source, /loopTerjaga\.hentikan\(\)/, 'guarded render loop must be stopped on cleanup')
assert.match(source, /layarBerubah\(/, 'hotspot projection must not re-render React every frame')

assert.match(source, /body3dPixelRatio/, 'organ renderer must use the shared bounded DPR policy')
assert.match(source, /prefers-reduced-motion: reduce/, 'auto-rotation must respect reduced-motion preference')

// Siklus hidup GPU.
assert.match(source, /disposeOwnedObject3DResources\(scene\)/, 'mounted scene resources must be disposed on unmount')
assert.match(source, /if \(disposed\) \{\s*disposeOwnedObject3DResources\(gltf\.scene\)/s, 'late GLTF success after unmount must dispose the decoded scene')
assert.match(source, /renderer\.renderLists\.dispose\(\)/, 'renderer lists must be disposed')
assert.match(source, /renderer\.forceContextLoss\(\)/, 'WebGL context must be explicitly released on cleanup')
assert.match(source, /webglcontextlost/, 'context loss must fail closed instead of leaving a frozen canvas')
assert.match(source, /event\.preventDefault\(\)|e\.preventDefault\(\)/, 'context loss handling must explicitly own the browser recovery path')
assert.match(source, /setLoading\(true\)\s*setPct\(0\)\s*setFatal\(''\)/, 'switching organ must reset loading/progress/error state')

// Ketergunaan.
assert.match(source, /className="absolute flex h-11 w-11/, 'mobile hotspot hit target must be 44px even when the visual marker stays small')
assert.match(source, /aria-pressed=\{aktif\}/, 'selected hotspot state must be accessible')
assert.match(source, /role="region"/, '3D viewer must expose a labelled region')
assert.match(source, /aria-busy=\{loading\}/, 'loading state must be machine readable')
assert.match(source, /role="status"/, 'loading must be announced politely')
assert.match(source, /role="alert"/, 'fatal WebGL/source failures must be announced')
assert.match(source, /renderer\.domElement\.setAttribute\('aria-hidden', 'true'\)/, 'raw canvas must not duplicate the accessible viewer surface')

// Sumber nyata tetap sumber nyata.
assert.match(source, /jalurModel\(organ\)/, 'source-backed GLB loading must remain intact through the canonical model-path resolver')
assert.doesNotMatch(source, /BoxGeometry|CapsuleGeometry|CylinderGeometry|synthetic anatomy/i, 'light lifecycle fix must not fabricate replacement anatomy')

console.log('body organ model LIGHT lifecycle invariants: ok')
