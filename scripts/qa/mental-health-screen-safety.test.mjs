import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../src/pages/MentalHealthScreen.tsx', import.meta.url), 'utf8')

test('PHQ-9 item 9 is wired to the fail-closed mental-health safety disposition', () => {
  assert.match(source, /deriveMentalHealthSafetyDisposition/)
  assert.match(source, /item9Positive \? \{ suicidalThoughts: true \} : \{\}/)
  assert.match(source, /safetyDisposition\.humanReviewRequired/)
})

test('positive item 9 is not mislabeled as proof of imminent risk', () => {
  assert.match(source, /does not by itself prove an immediate emergency/)
  assert.match(source, /thoughts are happening right now/)
})

test('current Indonesian crisis support and explicit care paths remain reachable', () => {
  assert.match(source, /https:\/\/healing119\.id/)
  assert.match(source, /119 ext\. 8/)
  assert.match(source, /to="\/jiwa\?t=aman"/)
  assert.match(source, /to="\/consult"/)
  assert.match(source, /to="\/hospitals"/)
})

test('the screen does not claim automatic external escalation', () => {
  assert.match(source, /does not automatically contact anyone/)
})
