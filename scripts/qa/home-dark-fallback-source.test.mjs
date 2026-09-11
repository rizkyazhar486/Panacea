import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../../src/styles/widget-dark-surface-v29.css', import.meta.url), 'utf8')

test('Living Instrument dark source guard repairs only active outer neutral fallbacks', () => {
  assert.match(css, /widget-instrument-slide-v5\[aria-hidden='false'\] > :is\([^)]+\.bg-neutral-50[^)]+\.bg-gray-100[^)]+\.bg-slate-200[^)]+\)/)
  assert.match(css, /background:#111925!important/)
})

test('Living Instrument dark source guard bounds empty direct-child fallbacks', () => {
  assert.match(css, /widget-instrument-slide-v5\[aria-hidden='false'\] > div:empty/)
  assert.match(css, /min-height:132px!important;[\s\S]*max-height:184px!important/)
  assert.match(css, /widget-instrument-scroll-v5:has\(> \.widget-instrument-slide-v5\[aria-hidden='false'\] > div:empty\)/)
})
