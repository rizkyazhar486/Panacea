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
assert.match(runtime, /activateNestedPanel\('Whole-body precision', 'Breath atlas'\)/, 'Breath Atlas command must open the dedicated source-aware Breath atlas inside Whole-body precision')
assert.match(runtime, /does not measure a patient, infer disease, or deform source anatomy/, 'Breath Atlas must keep the explicit reference-only boundary')
assert.match(runtime, /not AGI, diagnosis, or autonomous clinical decision-making/, 'command-center branding must not misrepresent capability')
assert.match(runtime, /MutationObserver/, 'mount discovery should be bounded to the existing Body Explorer DOM')
assert.match(runtime, /Date\.now\(\) \+ 8000/, 'Body Explorer mount observer must have a bounded lifetime')
assert.match(runtime, /Date\.now\(\) \+ 3000/, 'nested Breath Atlas discovery must also have a bounded lifetime')
assert.doesNotMatch(runtime, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|WebSocket/, 'Atlas Command must not add persistence, network calls, or streaming transports')
assert.doesNotMatch(runtime, /heartRate\s*[=:]|respRate\s*[=:]|SpO2\s*[=:]|oxygenSaturation\s*[=:]|ventilationMap|diagnosisResult|riskScore|treatmentRecommendation/i, 'Atlas Command must not add physiologic measurements, diagnosis outputs, risk scoring, or treatment logic')

console.log('Body Atlas Command v1: mandatory benchmarks recorded; command UI routes to source-aware Breath Atlas and stays local, bounded, reference-only, and non-clinical')
