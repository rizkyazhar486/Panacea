import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import {
  checkReviewRegistry, reviewedCount,
  type ReviewEntry, type ReviewRegistry,
} from '../../src/domains/clinical-calculators/engine/reviewRegistry.ts'

const dir = new URL('../../src/domains/clinical-calculators/engine/', import.meta.url)
const engineIds = readdirSync(dir)
  .filter((f) => f.endsWith('.ts') && f !== 'reviewRegistry.ts')
  .map((f) => f.slice(0, -3))
const real: ReviewRegistry = JSON.parse(
  readFileSync(new URL('../../governance/CALCULATOR_REVIEW_REGISTRY.json', import.meta.url), 'utf8'),
)

const pending = (id: string): ReviewEntry => ({
  id, review_status: 'PENDING_CLINICAL_REVIEW', clinically_reviewed: false,
  reviewer: null, reviewed_at: null, evidence: null,
})
const reviewed = (id: string): ReviewEntry => ({
  id, review_status: 'CLINICALLY_REVIEWED', clinically_reviewed: true,
  reviewer: 'dr. Contoh, Sp.PD (STR terverifikasi)', reviewed_at: '2026-10-10', evidence: 'review-note:abc',
})
const reg = (entries: ReviewEntry[], exempt: string[] = []): ReviewRegistry => ({ entries, exempt })
const errs = (r: ReviewRegistry, ids: string[]) => checkReviewRegistry(r, ids).errors

// positif: registri nyata mencakup semua mesin di disk, tanpa tinjauan karangan
{
  const r = checkReviewRegistry(real, engineIds)
  assert.deepEqual(r.errors, [])
  assert.equal(r.ok, true)
  assert.equal(reviewedCount(real), 0, 'tidak ada klaim ditinjau tanpa peninjau nyata')
}
// positif: entri ditinjau lengkap sah dan dihitung
assert.deepEqual(errs(reg([reviewed('a')]), ['a']), [])
assert.equal(reviewedCount(reg([reviewed('a'), pending('b')])), 1)

// negatif berpasangan: tiap aturan menolak sendiri
assert.deepEqual(errs(reg([pending('a')]), ['a', 'b']), ['b: engine-without-review-entry'])
assert.deepEqual(errs(reg([pending('a'), pending('z')]), ['a']), ['z: entry-without-engine'])
assert.deepEqual(errs(reg([pending('a'), pending('a')]), ['a']), ['a: duplicate-entry'])
assert.deepEqual(errs(reg([pending('a')], ['b']), ['a', 'b']), [])
assert.deepEqual(errs(reg([pending('a')], ['x']), ['a']), ['x: exempt-without-engine'])
assert.deepEqual(errs(reg([pending('a')], ['a']), ['a']), ['a: exempt-and-registered'])
assert.deepEqual(errs(reg([pending('')]), []), ['entry-id-blank'])

// fail closed: "ditinjau" tanpa bukti lengkap ditolak, dan tidak dihitung
for (const [field, value, code] of [
  ['reviewer', null, 'reviewer-missing'],
  ['reviewer', '   ', 'reviewer-missing'],
  ['reviewed_at', null, 'reviewed-at-invalid'],
  ['reviewed_at', '2026-02-30', 'reviewed-at-invalid'],
  ['reviewed_at', '10/10/2026', 'reviewed-at-invalid'],
  ['evidence', '', 'evidence-missing'],
] as const) {
  const e = { ...reviewed('a'), [field]: value }
  assert.deepEqual(errs(reg([e]), ['a']), [`a: ${code}`], `${field}=${String(value)}`)
  assert.equal(reviewedCount(reg([e])), 0, 'entri cacat tidak boleh dihitung ditinjau')
}
assert.deepEqual(
  errs(reg([{ ...reviewed('a'), clinically_reviewed: false }]), ['a']),
  ['a: reviewed-status-flag-mismatch'],
)
assert.deepEqual(
  errs(reg([{ ...pending('a'), clinically_reviewed: true }]), ['a']),
  ['a: pending-status-flag-mismatch'],
)
assert.deepEqual(
  errs(reg([{ ...pending('a'), reviewer: 'dr. Karangan' }]), ['a']),
  ['a: pending-must-not-carry-review-fields'],
)
assert.deepEqual(
  errs(reg([{ ...pending('a'), review_status: 'APPROVED' as never }]), ['a']),
  ['a: unknown-status'],
)

// deterministik
assert.deepEqual(checkReviewRegistry(real, engineIds), checkReviewRegistry(real, engineIds))
console.log('calculator-review-registry: OK')
