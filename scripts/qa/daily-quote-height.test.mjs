// F2: prevent daily quote rotation from changing the Home card's minimum height.
// Source contract is a fast guard; the real screenshot gate remains authoritative.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../src/components/dashboard/DailyQuoteBanner.tsx', import.meta.url), 'utf8')
const card = (text) => text.match(/className="(fly-in-drop[^"]+)"/)?.[1] || ''
const stable = (text) => /(?:^|\s)min-h-\[100px\](?:\s|$)/.test(card(text)) &&
  !/(?:^|\s)h-\[100px\](?:\s|$)/.test(card(text))

test('F2: rotating quote has stable minimum card height without fixed clipping', () => {
  assert.equal(stable(source), true)
  assert.match(source, /if \(!visible\) return null/)
  assert.match(source, /onClick=\{dismiss\}/)
})
test('F2: removing minimum height is detected by the regression guard', () => {
  assert.equal(stable(source.replace('min-h-[100px]', '')), false)
})
test('F2: fixed height instead of minimum height is rejected', () => {
  assert.equal(stable(source.replace('min-h-[100px]', 'h-[100px]')), false)
})
