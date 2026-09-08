import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const capture = await readFile('scripts/qa/body3d-canvas-artifact.mjs', 'utf8')
const smoke = await readFile('scripts/qa/body3d-mobile-smoke.mjs', 'utf8')
const workflow = await readFile('.github/workflows/stabilization-acceptance.yml', 'utf8')
const executableCapture = capture
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')

assert.match(smoke, /panacea_onboarded_v1/, 'behavioral smoke must seed only presentation onboarding state')
assert.match(smoke, /panacea_assessment_prompt_v1/, 'behavioral smoke must suppress only the presentation assessment prompt')
assert.doesNotMatch(smoke, /pm_assessment_v1/, 'behavioral smoke must not fabricate a completed assessment')

assert.match(capture, /rendered WebGL canvas|rendered-webgl-canvas/i, 'capture must describe its actual rendered WebGL-canvas scope')
assert.match(capture, /preserveDrawingBuffer:\s*true/, 'artifact browser must preserve only its QA WebGL buffer before direct canvas copy')
assert.match(capture, /getContextAttributes\(\)/, 'capture must verify that its QA-only WebGL context actually preserves the drawing buffer')
assert.match(capture, /drawImage\(node, 0, 0\)/, 'capture must copy the actual rendered WebGL canvas without a compositor screenshot')
assert.match(capture, /visibleSamples < 100/, 'capture must fail closed for visually empty output')
assert.match(capture, /lumaSpread < 8/, 'capture must fail closed for flat output')
assert.match(capture, /png\.length < 10_000/, 'capture must reject implausibly small PNG output')
assert.doesNotMatch(executableCapture, /page\.screenshot\s*\(/, 'capture must not reintroduce the hanging Playwright compositor screenshot')
assert.doesNotMatch(executableCapture, /Page\.captureScreenshot/, 'capture must not reintroduce the hanging CDP compositor screenshot')

assert.match(workflow, /Body Exposure mobile 390x844 smoke/, 'behavioral mobile smoke must remain required')
assert.match(workflow, /Body Exposure rendered WebGL visual artifact/, 'visual artifact step must remain required')
assert.match(workflow, /BODY3D_QA_CANVAS_ARTIFACT: artifacts\/body3d-mobile-canvas\.png/, 'artifact path must remain in the uploaded Body3D QA namespace')
assert.match(workflow, /run: node scripts\/qa\/body3d-canvas-artifact\.mjs/, 'workflow must execute the visual artifact gate')

console.log('Body3D QA preserves production-default behavioral smoke and requires a nonblank compositor-independent PNG from a QA-only preserved buffer.')
