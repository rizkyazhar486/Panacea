import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('current wedge is wired into the repository authority chain', () => {
  const maturity = read('PANACEA_PRODUCT_MATURITY_OS.md')
  const doctrine = read('PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md')
  const agents = read('AGENTS.md')
  const owner = read('PANACEA_OWNER_DIRECTIVES.md')
  for (const content of [maturity, doctrine, agents, owner]) {
    assert.match(content, /PANACEA_CURRENT_WEDGE\.md/)
  }
})

test('current wedge explicitly rejects generic wearable-chat differentiation and requires measured proof', () => {
  const wedge = read('PANACEA_CURRENT_WEDGE.md')
  assert.match(wedge, /does \*\*not\*\* use "AI can chat about your wearable data" as its primary differentiation/)
  assert.match(wedge, /No favorable claim is allowed for a dimension that has not been measured/)
  assert.match(wedge, /EXPLORE BROADLY → SHIP NARROWLY → MEASURE → DEEPEN → REPEAT/)
})
