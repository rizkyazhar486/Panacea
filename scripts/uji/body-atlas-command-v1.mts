import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const runtime = readFileSync('public/body-atlas-command-v1.js', 'utf8')
const benchmark = readFileSync('docs/body-atlas-command-benchmarks-20260909.md', 'utf8')
const index = readFileSync('index.html', 'utf8')

for (const required of [
  'https://github.com/thebuggeddev/anatomy',
  'https://breath-atlas.thebuggeddev.chatgpt.site/',
  'not copy source code, models, textures, medical prose, or other assets',
  'Academic Accuracy Gate',
]) assert.ok(benchmark.includes(required), `Body Atlas benchmark contract missing: ${required}`)

for (const command of [
  'Atlas Command',
  'Explore anatomy',
  'Find structure',
  'Whole-body precision',
  'Breath Atlas',
  'Organs',
  'Study',
]) assert.ok(runtime.includes(command), `Atlas Command entry missing: ${command}`)

assert.match(index, /body-atlas-command-v1\.js\?v=20260909-1/, 'Atlas Command runtime must be registered in the application shell')
assert.match(runtime, /activatePanel\('Physiology'\)/, 'Breath Atlas must hand off to the existing physiology-reference workspace')
assert.match(runtime, /does not measure a patient, infer disease, or deform source anatomy/, 'Breath Atlas must keep the explicit reference-only boundary')
assert.match(runtime, /not AGI, diagnosis, or autonomous clinical decision-making/, 'command-center branding must not misrepresent capability')
assert.match(runtime, /MutationObserver/, 'mount discovery should be bounded to the existing Body Explorer DOM')
assert.match(runtime, /Date\.now\(\) \+ 8000/, 'DOM observer must have a bounded lifetime')
assert.doesNotMatch(runtime, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|WebSocket/, 'Atlas Command must not add persistence, network calls, or streaming transports')
assert.doesNotMatch(runtime, /heartRate|respRate|SpO2|oxygen|ventilat|diagnos/i, 'Atlas Command runtime must not invent physiologic measurements or clinical interpretation')

console.log('Body Atlas Command v1: mandatory benchmarks recorded; command UI stays local, bounded, reference-only, and non-clinical')
