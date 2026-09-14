import assert from 'node:assert/strict'
import { compilePubMedQuery } from '../../src/lib/pubmedQuery.ts'

const focused = compilePubMedQuery({
  population: 'atrial fibrillation',
  intervention: 'apixaban; direct oral anticoagulant',
  comparison: 'warfarin',
  outcome: 'ischemic stroke; major bleeding',
  design: 'randomized-trial',
  fromYear: 2018,
  toYear: 2026,
  humansOnly: true,
  freeFullTextOnly: false,
})

assert.equal(focused.concepts.length, 4)
assert.match(focused.query, /"atrial fibrillation"\[Title\/Abstract\]/)
assert.match(focused.query, /\("apixaban"\[Title\/Abstract\] OR "direct oral anticoagulant"\[Title\/Abstract\]\)/)
assert.match(focused.query, /randomized controlled trial\[Publication Type\]/)
assert.match(focused.query, /humans\[MeSH Terms\]/)
assert.match(focused.query, /"2018\/01\/01"\[Date - Publication\].*"2026\/12\/31"\[Date - Publication\]/)
assert.ok(!focused.query.includes('free full text[sb]'))

const correctedYears = compilePubMedQuery({
  population: 'heart failure',
  intervention: '',
  comparison: '',
  outcome: '',
  design: 'any',
  fromYear: 2025,
  toYear: 2020,
  humansOnly: false,
  freeFullTextOnly: true,
})

assert.match(correctedYears.query, /"2020\/01\/01".*"2025\/12\/31"/)
assert.match(correctedYears.query, /free full text\[sb\]/)
assert.ok(correctedYears.warnings.some((warning) => warning.includes('corrected')))
assert.ok(correctedYears.warnings.some((warning) => warning.includes('broad')))

const empty = compilePubMedQuery({
  population: '',
  intervention: '',
  comparison: '',
  outcome: '',
  design: 'any',
  humansOnly: false,
  freeFullTextOnly: false,
})

assert.equal(empty.query, '')
assert.equal(empty.concepts.length, 0)
assert.ok(empty.warnings.some((warning) => warning.includes('at least one concept')))

const deDuplicated = compilePubMedQuery({
  population: 'Diabetes; diabetes; type 2 diabetes',
  intervention: '',
  comparison: '',
  outcome: '',
  design: 'any',
  humansOnly: false,
  freeFullTextOnly: false,
})
assert.deepEqual(deDuplicated.concepts[0]?.alternatives, ['Diabetes', 'type 2 diabetes'])

console.log('PubMed concept-search acceptance passed')
