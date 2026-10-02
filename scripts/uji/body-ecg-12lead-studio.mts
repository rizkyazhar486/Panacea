import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const studio = readFileSync(new URL('../../src/pages/bodyhub/EcgAnatomyStudio.tsx', import.meta.url), 'utf8')
const cardio = readFileSync(new URL('../../src/pages/bodyhub/CardioLab.tsx', import.meta.url), 'utf8')

for (const lead of ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']) {
  assert.match(studio, new RegExp(`id: '${lead}'`), `12-lead selector lost ${lead}`)
}
assert.match(studio, /data-ecg-anatomy-studio="v2"/)
assert.match(studio, /Show 12 leads/)
assert.match(studio, /Multi-label statement learning/)
assert.match(studio, /No patient ECG is analysed/)
assert.match(studio, /PTB-XL is a future source-backed compatibility target/)
assert.match(studio, /no autonomous diagnosis is performed/i)
assert.match(studio, /RR = 60 \/ heart rate/)
assert.match(cardio, /<EcgAnatomyStudio heartRate=\{hr\} onHeartRateChange=\{setHr\} \/>/)

console.log('body-ecg-12lead-studio: reachable 12-lead synthetic learning surface remains non-diagnostic')
