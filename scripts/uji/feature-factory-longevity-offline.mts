import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/pages/Longevity.tsx', 'utf8')
const snapshot = readFileSync('src/components/LongevityRecordedSnapshot.tsx', 'utf8')

assert.match(page, /const KEY = 'pmd_longevity_v1'/, 'Longevity must retain a stable local persistence key.')
assert.match(page, /localStorage\.getItem\(KEY\)/, 'Longevity must load its editable core state from local storage.')
assert.match(page, /localStorage\.setItem\(KEY/, 'Longevity must persist editable core state locally.')
assert.match(snapshot, /No shared recorded vitals yet\./, 'Recorded snapshot must retain an honest empty state when shared measurements are absent.')
assert.match(snapshot, /Source unavailable/, 'Recorded snapshot must disclose missing source instead of inventing provenance.')
assert.match(snapshot, /Timestamp unavailable/, 'Recorded snapshot must disclose missing timestamp instead of inventing provenance.')
assert.doesNotMatch(snapshot, /\bfetch\s*\(/, 'Recorded snapshot must not require a page-level network request.')
assert.doesNotMatch(snapshot, /axios/i, 'Recorded snapshot must not require axios/network transport.')
assert.match(snapshot, /does not validate the Longevity Score, biological-age estimate, targets, projections, diagnosis, prognosis or treatment guidance/i, 'Offline availability must not promote legacy longevity interpretation as validated.')

console.log('Feature Factory longevity offline: local core persistence and recorded-input empty/provenance boundaries are deterministic without a page-level network dependency.')
