import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const capture = await readFile('scripts/qa/body3d-canvas-artifact.mjs', 'utf8')
const workflow = await readFile('.github/workflows/stabilization-acceptance.yml', 'utf8')

assert.match(capture, /rendered WebGL canvas|rendered-webgl-canvas/i, 'capture must describe its actual WebGL-canvas scope')
assert.match(capture, /drawImage\(node, 0, 0\)/, 'capture must copy the rendered canvas without a compositor screenshot')
assert.match(capture, /visibleSamples < 100/, 'capture must fail closed for visually empty output')
assert.match(capture, /lumaSpread < 8/, 'capture must fail closed for flat output')
assert.match(capture, /png\.length < 10_000/, 'capture must reject implausibly small PNG output')
assert.doesNotMatch(capture, /page\.screenshot\s*\(/, 'capture must not reintroduce the hanging Playwright compositor screenshot')
assert.doesNotMatch(capture, /Page\.captureScreenshot/, 'capture must not reintroduce the hanging CDP compositor screenshot')

assert.match(workflow, /Body Exposure mobile 390x844 smoke/, 'behavioral mobile smoke must remain required')
assert.match(workflow, /Body Exposure rendered WebGL visual artifact/, 'visual artifact step must remain required')
assert.match(workflow, /BODY3D_QA_CANVAS_ARTIFACT: artifacts\/body3d-mobile-canvas\.png/, 'artifact path must remain in the uploaded Body3D QA namespace')
assert.match(workflow, /run: node scripts\/qa\/body3d-canvas-artifact\.mjs/, 'workflow must execute the visual artifact gate')

console.log('Body3D visual artifact gate preserves behavioral smoke and requires a nonblank compositor-independent PNG.')
