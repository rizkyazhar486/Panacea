import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('compact product law remains wired into wedge, doctrine and agent policy', () => {
  for (const path of [
    'PANACEA_CURRENT_WEDGE.md',
    'PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md',
    'AGENTS.md',
  ]) {
    const content = read(path)
    assert.match(content, /maximum orchestration depth, minimum visible complexity/i)
  }
})

test('canonical compact expression remains stable', () => {
  const wedge = read('PANACEA_CURRENT_WEDGE.md')
  const doctrine = read('PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md')
  for (const content of [wedge, doctrine]) {
    assert.match(content, /One patient\. One longitudinal state\. One trusted care flow\./)
  }
})
