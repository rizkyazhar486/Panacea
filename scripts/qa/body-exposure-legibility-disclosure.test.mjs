import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const cameraCapture = readFileSync(new URL('../../src/pages/bodyhub/PersonalAvatarCameraCapture.tsx', import.meta.url), 'utf8')
const twinViewport = readFileSync(new URL('../../src/pages/bodyhub/Img2ThreeJsTwinViewport.tsx', import.meta.url), 'utf8')

test('PersonalAvatarCameraCapture mounts Img2ThreeJsTwinViewport on demand inside progressive disclosure', () => {
  assert.match(cameraCapture, /showCadTwin/)
  assert.match(cameraCapture, /<details[\s\S]*onToggle=\{/)
  assert.match(cameraCapture, /\{showCadTwin\s*\?[\s\S]*<Img2ThreeJsTwinViewport/)
  assert.match(cameraCapture, /data-raw-frame-persistence="ephemeral"/)
  assert.match(cameraCapture, /data-patient-specific-internal-anatomy="not-inferred"/)
  assert.doesNotMatch(cameraCapture, /localStorage|sessionStorage|indexedDB/i)
})

test('Img2ThreeJsTwinViewport keeps truth boundary in progressive disclosure and 44px controls', () => {
  assert.match(twinViewport, /<details[\s\S]*CAD &amp; medical truth boundary/)
  assert.match(twinViewport, /h-11 min-h-\[44px\]/)
  assert.match(twinViewport, /buatRendererAman/)
  assert.match(twinViewport, /mulaiLoopTerjaga/)
  assert.doesNotMatch(twinViewport, /localStorage|sessionStorage|indexedDB/i)
})
