import assert from 'node:assert/strict'
import {
  SOURCE_EXPERIENCE_SHORTCUTS,
  matchingSourceExperiences,
} from '../../src/lib/sourceExperienceShortcuts.ts'

assert.equal(SOURCE_EXPERIENCE_SHORTCUTS.length, 4)
assert.deepEqual(matchingSourceExperiences('').map((item) => item.id), ['heart-ecg', 'ct-mr', 'pubmed', 'money'])
assert.deepEqual(matchingSourceExperiences('PTB-XL').map((item) => item.id), ['heart-ecg'])
assert.deepEqual(matchingSourceExperiences('axial').map((item) => item.id), ['ct-mr'])
assert.deepEqual(matchingSourceExperiences('evidence').map((item) => item.id), ['pubmed'])
assert.deepEqual(matchingSourceExperiences('cashflow').map((item) => item.id), ['money'])
assert.deepEqual(matchingSourceExperiences('not-yet-available-source'), [])

const ecg = SOURCE_EXPERIENCE_SHORTCUTS.find((item) => item.id === 'heart-ecg')
assert.match(ecg?.boundary ?? '', /synthetic education/i)
assert.match(ecg?.boundary ?? '', /not recorded ECG data/i)
assert.match(ecg?.boundary ?? '', /not.*rhythm diagnosis/i)

const imaging = SOURCE_EXPERIENCE_SHORTCUTS.find((item) => item.id === 'ct-mr')
assert.match(imaging?.boundary ?? '', /simulated and acquired-image states remain separate/i)
assert.match(imaging?.boundary ?? '', /not.*patient segmentation/i)

const pubmed = SOURCE_EXPERIENCE_SHORTCUTS.find((item) => item.id === 'pubmed')
assert.equal(pubmed?.route, '/rujukan?t=bukti')
assert.match(pubmed?.boundary ?? '', /not an AI conclusion/i)

for (const item of SOURCE_EXPERIENCE_SHORTCUTS) {
  assert.ok(item.route.startsWith('/'), `${item.id} must use an internal reachable route`)
  assert.ok(item.location.length > 0, `${item.id} must explain where the user lands`)
  assert.ok(item.boundary.length > 40, `${item.id} must expose a plain-language boundary`)
}

console.log('source-experience-shortcuts: routing, filtering, and safety labels passed')
