// Pengujian unit untuk triage re-land komit yang direvert (WP-3 Directive D-100).
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

test('1. Generated RELAND_TRIAGE.json exists and contains 68 commits', () => {
  assert.equal(existsSync('governance/RELAND_TRIAGE.json'), true)
  const content = JSON.parse(readFileSync('governance/RELAND_TRIAGE.json', 'utf8'))
  assert.equal(content.rangeEvaluated, '3e3f9471..59f9a87f')
  assert.equal(content.totalCommits, 68)
  assert.equal(Array.isArray(content.commits), true)
  assert.equal(content.commits.length, 68)
})

test('2. Every reject-claims entry has claim hits', () => {
  const content = JSON.parse(readFileSync('governance/RELAND_TRIAGE.json', 'utf8'))
  const rejectClaims = content.commits.filter((c) => c.classification === 'reject-claims')
  for (const c of rejectClaims) {
    assert.ok(Array.isArray(c.claimHits) && c.claimHits.length > 0)
  }
})

test('3. Every legit-candidate entry has zero claim hits', () => {
  const content = JSON.parse(readFileSync('governance/RELAND_TRIAGE.json', 'utf8'))
  const legit = content.commits.filter((c) => c.classification === 'legit-candidate')
  for (const c of legit) {
    assert.deepEqual(c.claimHits, [])
  }
})
