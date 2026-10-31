// Pengujian unit untuk triage re-land komit yang direvert (WP-3 Directive D-101 & D-102).
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { classifyCommitDiff, evaluateRange } from './reland-triage.mjs'

test('1. Generated RELAND_TRIAGE.json exists, is deterministic (no timestampUtc), and contains 68 commits', () => {
  assert.equal(existsSync('governance/RELAND_TRIAGE.json'), true)
  const content = JSON.parse(readFileSync('governance/RELAND_TRIAGE.json', 'utf8'))
  assert.equal(content.rangeEvaluated, '3e3f9471..59f9a87f')
  assert.equal(content.totalCommits, 68)
  assert.equal(Array.isArray(content.commits), true)
  assert.equal(content.commits.length, 68)
  assert.equal('timestampUtc' in content, false)
})

test('2. Every reject-claims entry has real file:term claim hits (never placeholder banned-term-matched)', () => {
  const content = JSON.parse(readFileSync('governance/RELAND_TRIAGE.json', 'utf8'))
  const rejectClaims = content.commits.filter((c) => c.classification === 'reject-claims')
  for (const c of rejectClaims) {
    assert.ok(Array.isArray(c.claimHits) && c.claimHits.length > 0)
    assert.equal(c.claimHits.includes('banned-term-matched'), false)
    assert.ok(c.claimHits.every((h) => h.includes(':')))
  }
})

test('3. Every legit-candidate entry has zero claim hits and an honest testStatus (tests are never executed here)', () => {
  const content = JSON.parse(readFileSync('governance/RELAND_TRIAGE.json', 'utf8'))
  const legit = content.commits.filter((c) => c.classification === 'legit-candidate')
  assert.ok(legit.length > 0)
  for (const c of legit) {
    assert.deepEqual(c.claimHits, [])
    assert.ok(['not-run', 'no-tests-in-commit'].includes(c.testStatus))
  }
})

test('4. Positive case: classifyCommitDiff classifies clean bounded diff as legit-candidate even if subject mentions quantum', () => {
  const res = classifyCommitDiff({
    statText: ' src/clean.ts | 10 ++++++++++\n 1 file changed, 10 insertions(+)',
    filesTouched: ['src/clean.ts'],
    linesAdded: 10,
    patchText: '+++ b/src/clean.ts\n+export const x = 42;\n',
    testStatus: 'pass'
  })
  assert.equal(res.classification, 'legit-candidate')
  assert.deepEqual(res.claimHits, [])
})

test('5. Negative case: classifyCommitDiff catches banned claim inside diff content with innocent subject', () => {
  const res = classifyCommitDiff({
    statText: ' src/bad.ts | 2 ++\n 1 file changed, 2 insertions(+)',
    filesTouched: ['src/bad.ts'],
    linesAdded: 2,
    patchText: '+++ b/src/bad.ts\n+export const mode = "quantum healing biophoton";\n',
    testStatus: 'not-applicable'
  })
  assert.equal(res.classification, 'reject-claims')
  assert.ok(res.claimHits.length >= 1)
  assert.ok(res.claimHits.some((h) => h.startsWith('src/bad.ts:')))
})

test('6. Negative control (fail-closed by name): invalid git range or malformed diff input throws explicitly', () => {
  assert.throws(
    () => evaluateRange('invalid-range-without-dots'),
    /reland-triage: invalid git range "invalid-range-without-dots"/
  )
  assert.throws(
    () => classifyCommitDiff({ statText: null, filesTouched: null, linesAdded: 0, patchText: '' }),
    /reland-triage: invalid diff input/
  )
})

test('7. Negative control: no entry may claim its tests passed or failed, because this script never runs them', () => {
  const content = JSON.parse(readFileSync('governance/RELAND_TRIAGE.json', 'utf8'))
  for (const c of content.commits) assert.ok(['not-run', 'no-tests-in-commit'].includes(c.testStatus), `${c.sha}: ${c.testStatus}`)
  assert.equal(content.commits.some((c) => c.testStatus === 'pass' || c.testStatus === 'fail' || c.testStatus === 'not-applicable'), false)
})

