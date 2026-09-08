import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const breathAtlas = await readFile(new URL('../../src/pages/bodyhub/BreathAtlasLab.tsx', import.meta.url), 'utf8')
const precisionLab = await readFile(new URL('../../src/pages/bodyhub/WholeBodyPrecisionLab.tsx', import.meta.url), 'utf8')

const mandatoryBenchmarks = [
  'https://github.com/thebuggeddev/anatomy',
  'https://breath-atlas.thebuggeddev.chatgpt.site/',
]

for (const url of mandatoryBenchmarks) {
  assert.match(breathAtlas, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Mandatory Body Atlas benchmark must remain user-visible: ${url}`)
}

assert.match(breathAtlas, /independently implemented Panacea teaching layer/i)
assert.match(breathAtlas, /does not embed or copy third-party viewer code or assets/i)
assert.match(breathAtlas, /interaction reference only/i)
assert.match(breathAtlas, /license check required/i)
assert.match(breathAtlas, /Scientific boundary/i)
assert.match(breathAtlas, /no patient-specific ventilation map/i)
assert.match(breathAtlas, /Microscopic alveolar geometry is disclosed as unavailable/i)

assert.match(precisionLab, /import BreathAtlasLab from '\.\/BreathAtlasLab'/)
assert.match(precisionLab, /'breath-atlas'/)
assert.match(precisionLab, /<BreathAtlasLab\s/)

// External benchmark URLs are navigation/interaction references only. They must
// never be promoted here as source geometry, academic review, or medical evidence.
assert.doesNotMatch(breathAtlas, /thebuggeddev[^\n]{0,160}(?:verified anatomy|academic review recorded|evidence-eligible)/i)
assert.doesNotMatch(breathAtlas, /breath-atlas\.thebuggeddev[^\n]{0,160}(?:verified anatomy|academic review recorded|evidence-eligible)/i)

console.log('Body Atlas mandatory benchmarks verified: both references are mounted, user-visible, original-implementation-only, and fail closed as non-evidence UX references.')
