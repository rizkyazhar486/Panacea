import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('system 10 standard is wired into core product authority documents', () => {
  for (const path of [
    'PANACEA_HUMANITY_10_CHARTER.md',
    'PANACEA_PRODUCT_MATURITY_OS.md',
    'PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md',
    'AGENTS.md',
  ]) {
    assert.match(read(path), /PANACEA_SYSTEM_10_STANDARD\.md/)
  }
})

test('system 10 standard uses a weakest-link law and preserves permissioned observability', () => {
  const standard = read('PANACEA_SYSTEM_10_STANDARD.md')
  assert.match(standard, /S_system = min\(A, O, I, H, E, P, R, T, F, U, D, B, C, Q\)/)
  assert.match(standard, /permissioned Human Observability/)
  assert.match(standard, /PANACEA_UNIVERSAL_HUMAN_ACCEPTANCE_STANDARD\.md/)
  assert.match(standard, /One patient\. One longitudinal state\. One trusted care flow\./)
  assert.match(standard, /10\/10 system ambition → one 10\/10 wedge/)
})
