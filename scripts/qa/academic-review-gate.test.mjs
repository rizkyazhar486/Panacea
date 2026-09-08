import test from 'node:test'
import assert from 'node:assert/strict'
import { validateAcademicReview } from '../validate-academic-review.mjs'

const domains = [
  { id: 'medical-education', risk: 'medium' },
  { id: 'clinical-cdss', risk: 'clinical' },
]

const baseReview = {
  status: 'source-checked',
  sourceBasis: ['https://example.test/source'],
  aiUse: 'ai-assisted',
  note: 'Source-checked educational content; no clinical clearance claimed.',
  humanReview: { status: 'not-recorded', reviewer: null, credentials: null, reviewedAt: null },
}

test('done medium-risk feature can pass with source-checked metadata and no false human-review claim', () => {
  const progress = {
    items: {
      'ff-medical-education-evidence': { status: 'done', academicReview: baseReview },
    },
  }
  assert.deepEqual(validateAcademicReview(progress, domains), [])
})

test('done feature fails closed when academicReview metadata is missing', () => {
  const progress = { items: { 'ff-medical-education-evidence': { status: 'done' } } }
  assert.ok(validateAcademicReview(progress, domains).some((error) => error.includes('requires academicReview metadata')))
})

test('high or clinical risk cannot be marked done without qualified human review', () => {
  const progress = {
    items: {
      'ff-clinical-cdss-evidence': { status: 'done', academicReview: baseReview },
    },
  }
  assert.ok(validateAcademicReview(progress, domains).some((error) => error.includes('requires qualified human academic/clinical review')))
})

test('human-reviewed status requires reviewer identity, credentials and timestamp', () => {
  const progress = {
    items: {
      'ff-clinical-cdss-evidence': {
        status: 'done',
        academicReview: {
          ...baseReview,
          status: 'human-reviewed',
          humanReview: { status: 'completed', reviewer: '', credentials: '', reviewedAt: 'not-a-date' },
        },
      },
    },
  }
  const errors = validateAcademicReview(progress, domains)
  assert.ok(errors.some((error) => error.includes('requires named reviewer')))
  assert.ok(errors.some((error) => error.includes('requires reviewer credentials')))
  assert.ok(errors.some((error) => error.includes('requires valid reviewedAt timestamp')))
})

test('not-applicable review status is allowed only as an explicit no-material-claim declaration', () => {
  const progress = {
    items: {
      'ff-medical-education-accessibility': {
        status: 'done',
        academicReview: {
          status: 'not-applicable-no-material-claim',
          sourceBasis: [],
          aiUse: 'ai-assisted',
          note: 'Accessibility semantics only; no medical factual or clinical claim is introduced.',
          humanReview: { status: 'not-recorded', reviewer: null, credentials: null, reviewedAt: null },
        },
      },
    },
  }
  assert.deepEqual(validateAcademicReview(progress, domains), [])
})
