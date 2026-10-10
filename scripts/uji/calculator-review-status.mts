import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { auditReviewRegistry, reviewStateOf, type CalculatorReviewEntry } from '../../src/domains/clinical-calculators/model/reviewStatus.ts'
import { CALCULATOR_REVIEW_REGISTRY } from '../../src/domains/clinical-calculators/data/reviewRegistry.ts'

const files = readdirSync(new URL('../../src/domains/clinical-calculators/engine/', import.meta.url))
  .filter((f) => f.endsWith('.ts')).map((f) => f.replace(/\.ts$/, ''))

const pending = (engine: string): CalculatorReviewEntry => ({ engine, state: 'PENDING_CLINICAL_REVIEW', clinicallyReviewed: false })
const reviewed = (engine: string, over: Partial<CalculatorReviewEntry> = {}): CalculatorReviewEntry => ({
  engine, state: 'CLINICALLY_REVIEWED', clinicallyReviewed: true,
  review: { reviewer: 'Dr. Example (STR-0000)', reviewedOn: '2026-10-10', evidenceIds: ['review:example-1'] }, ...over,
})

// positif: registri nyata konsisten dengan disk dan semuanya masih menunggu review
const real = auditReviewRegistry(CALCULATOR_REVIEW_REGISTRY, files)
assert.deepEqual(real.problems, [])
assert.equal(files.length > 0, true)
assert.ok(CALCULATOR_REVIEW_REGISTRY.every((e) => e.state === 'PENDING_CLINICAL_REVIEW' && e.clinicallyReviewed === false))

// positif berpasangan: entri ditinjau yang lengkap diterima
assert.equal(auditReviewRegistry([reviewed('a')], ['a']).ok, true)
assert.equal(reviewStateOf([reviewed('a')], 'a'), 'CLINICALLY_REVIEWED')

// negatif: tiap aturan penolakan berbeda hanya pada satu kondisi
const bad = (e: CalculatorReviewEntry) => auditReviewRegistry([e], ['a'])
assert.match(bad(reviewed('a', { review: undefined })).problems[0], /reviewed without reviewer/)
assert.match(bad(reviewed('a', { review: { reviewer: '  ', reviewedOn: '2026-10-10', evidenceIds: ['x'] } })).problems[0], /reviewer/)
assert.match(bad(reviewed('a', { review: { reviewer: 'R', reviewedOn: '10/10/2026', evidenceIds: ['x'] } })).problems[0], /date/)
assert.match(bad(reviewed('a', { review: { reviewer: 'R', reviewedOn: '2026-10-10', evidenceIds: [] } })).problems[0], /evidence/)
assert.match(bad(reviewed('a', { review: { reviewer: 'R', reviewedOn: '2026-10-10', evidenceIds: [' '] } })).problems[0], /evidence/)
assert.match(bad(reviewed('a', { clinicallyReviewed: false })).problems[0], /without clinicallyReviewed flag/)
assert.match(bad({ ...pending('a'), clinicallyReviewed: true }).problems[0], /pending entry marked reviewed/)
assert.match(bad({ ...pending('a'), review: reviewed('a').review }).problems[0], /pending entry carries/)
assert.match(bad({ engine: 'a', state: 'APPROVED' as never, clinicallyReviewed: true }).problems[0], /unknown state/)

// negatif: ketidaksinkronan dengan disk
assert.deepEqual(auditReviewRegistry([pending('a')], ['a', 'b']).problems, ['engine not registered: b'])
assert.deepEqual(auditReviewRegistry([pending('a'), pending('ghost')], ['a']).problems, ['registry entry without engine file: ghost'])
assert.deepEqual(auditReviewRegistry([pending('a'), pending('a')], ['a']).problems, ['duplicate entry: a'])

// fail closed pada status efektif: tak terdaftar / catatan rusak = PENDING, tanpa efek samping pada registri
const snapshot = JSON.stringify(CALCULATOR_REVIEW_REGISTRY)
assert.equal(reviewStateOf([], 'a'), 'PENDING_CLINICAL_REVIEW')
assert.equal(reviewStateOf([reviewed('a', { review: undefined })], 'a'), 'PENDING_CLINICAL_REVIEW')
assert.equal(reviewStateOf([reviewed('a', { clinicallyReviewed: false })], 'a'), 'PENDING_CLINICAL_REVIEW')
assert.equal(reviewStateOf(CALCULATOR_REVIEW_REGISTRY, files[0]), 'PENDING_CLINICAL_REVIEW')
assert.equal(JSON.stringify(CALCULATOR_REVIEW_REGISTRY), snapshot)

// determinisme
assert.deepEqual(auditReviewRegistry(CALCULATOR_REVIEW_REGISTRY, files), auditReviewRegistry(CALCULATOR_REVIEW_REGISTRY, files))
console.log('calculator-review-status: OK')
