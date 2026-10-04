import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('worthiness standard is wired into agent, system and maturity policy', () => {
  for (const path of [
    'PANACEA_SYSTEM_10_STANDARD.md',
    'PANACEA_PRODUCT_MATURITY_OS.md',
    'AGENTS.md',
  ]) {
    assert.match(read(path), /PANACEA_WORTHINESS_EVIDENCE_STANDARD\.md/)
  }
})

test('worthiness review remains evidence-first and non-coercive', () => {
  const standard = read('PANACEA_WORTHINESS_EVIDENCE_STANDARD.md')
  assert.match(standard, /Conviction must be an output of evidence, not an input to evaluation/)
  assert.match(standard, /AI consensus is not external validation/)
  assert.match(standard, /Make Panacea demonstrably worth building/)
  assert.match(standard, /W_verified = min\(/)
  assert.match(standard, /E0 — hypothesis/)
  assert.match(standard, /E4 — external validation/)
})
