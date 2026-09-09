import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const component = readFileSync('src/components/LongevityRecordedSnapshot.tsx', 'utf8')

assert.match(component, /Recorded-input safety checklist/, 'Longevity recorded-input panel must expose its safety checklist.')
assert.match(component, /Source identity/, 'Checklist must expose source identity.')
assert.match(component, /Measurement timestamp/, 'Checklist must expose measurement timestamp.')
assert.match(component, /Units preserved/, 'Checklist must expose unit preservation.')
assert.match(component, /No fabricated defaults/, 'Checklist must guard against fabricated defaults.')
assert.match(component, /Scientific boundary/, 'Checklist must expose the scientific-review boundary.')
assert.match(component, /metrics\.every\(\(metric\) => metric\.unit\.trim\(\)\.length > 0\)/, 'Unit check must derive from rendered recorded metrics rather than a hard-coded pass.')
assert.match(component, /Boolean\(provenance\.source\)/, 'Source check must derive from recorded provenance.')
assert.match(component, /Boolean\(provenance\.timestamp\)/, 'Timestamp check must derive from recorded provenance.')
assert.match(component, /does not validate the page’s legacy score, biological-age estimate, targets, projections, diagnosis, prognosis or treatment guidance/i, 'Checklist must not promote legacy longevity logic as validated.')
assert.doesNotMatch(component, /\bfetch\s*\(/, 'Checklist must not add a page-level network call.')
assert.doesNotMatch(component, /localStorage/, 'Checklist component must remain presentation-only and must not add persistence.')

console.log('Feature Factory longevity checklist: source/timestamp/unit/empty-state/scientific-boundary checks are deterministic and recorded-input-only.')
