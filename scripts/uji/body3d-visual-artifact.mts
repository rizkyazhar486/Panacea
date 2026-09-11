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
assert.match(capture, /scrollIntoViewIfNeeded\(\)/, 'capture must bring the real Body3D canvas onscreen before demanding visual evidence')
assert.match(capture, /canvas center outside viewport/i, 'capture must reject an offscreen Body3D canvas')
assert.match(capture, /visibleSamples < 100/, 'capture must fail closed for visually empty output')
assert.match(capture, /luma >= 40/, 'capture must explicitly count pixels bright enough to distinguish anatomy from the dark viewer background')
assert.match(capture, /capture\.lumaSpread < 32/, 'capture must require substantial image contrast')
assert.match(capture, /capture\.maxLuma < 48/, 'capture must reject the observed background-only luminance envelope')
assert.match(capture, /capture\.p99Luma < 40/, 'capture must require a meaningful bright-tail luminance')
assert.match(capture, /capture\.brightFraction < 0\.01/, 'capture must require a nontrivial bright anatomy-signal population')
assert.match(capture, /png\.length < 10_000/, 'capture must reject implausibly small PNG output')
assert.doesNotMatch(executableCapture, /page\.screenshot\s*\(/, 'capture must not reintroduce the hanging Playwright compositor screenshot')
assert.doesNotMatch(executableCapture, /Page\.captureScreenshot/, 'capture must not reintroduce the hanging CDP compositor screenshot')
assert.doesNotMatch(executableCapture, /style\.(display|visibility|opacity)\s*=/, 'visual QA must not fake visibility by mutating presentation CSS')

assert.match(workflow, /Body Exposure mobile 390x844 smoke/, 'behavioral mobile smoke must remain required')
assert.match(workflow, /Body Exposure rendered WebGL visual artifact/, 'visual artifact step must remain required')
assert.match(workflow, /BODY3D_QA_CANVAS_ARTIFACT: artifacts\/body3d-mobile-canvas\.png/, 'artifact path must remain in the uploaded Body3D QA namespace')
assert.match(workflow, /run: node scripts\/qa\/body3d-canvas-artifact\.mjs/, 'workflow must execute the visual artifact gate')

console.log('Body3D QA requires an onscreen, contrast-bearing anatomy signal from the real preserved WebGL canvas.')
