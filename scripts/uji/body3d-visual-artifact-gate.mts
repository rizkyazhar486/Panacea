import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const source = await readFile(new URL('../qa/body3d-canvas-artifact.mjs', import.meta.url), 'utf8')

assert.match(source, /scrollIntoViewIfNeeded\(\)/, 'visual artifact must bring the real Body3D canvas onscreen')
assert.match(source, /canvas center outside viewport/i, 'visual artifact must reject offscreen capture')
assert.match(source, /brightFraction/, 'visual artifact must measure a bright anatomy signal, not opaque pixels alone')
assert.match(source, /capture\.p99Luma < 40/, 'visual artifact must require a meaningful bright-tail luminance')
assert.match(source, /capture\.maxLuma < 48/, 'visual artifact must reject the observed dark background-only frame')
assert.match(source, /capture\.lumaSpread < 32/, 'visual artifact must require substantial contrast')
assert.match(source, /luma >= 40/, 'bright-sample threshold must remain explicit and deterministic')
assert.doesNotMatch(source, /style\.(display|visibility|opacity)\s*=/, 'QA must not fake visibility by mutating presentation CSS')

console.log('Body3D visual artifact gate requires an onscreen, contrast-bearing anatomy signal.')
