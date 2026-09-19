import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = async (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

test('ruthless simplicity is the final global presentation layer', async () => {
  const html = await source('index.html')
  const v49 = html.indexOf('/panacea-shell-mobile-compact-v49.css')
  const v50 = html.indexOf('/panacea-ruthless-simple-v50.css')
  assert.ok(v49 >= 0, 'v49 shell layer missing')
  assert.ok(v50 > v49, 'v50 must load after prior presentation layers')
})

test('v50 removes ambient gradients, glow and blur from the shared shell', async () => {
  const css = await source('public/panacea-ruthless-simple-v50.css')
  assert.match(css, /body[\s\S]*background-image:\s*none\s*!important/)
  assert.match(css, /header\.kaca[\s\S]*backdrop-filter:\s*none\s*!important/)
  assert.match(css, /box-shadow:\s*none\s*!important/)
  assert.match(css, /button\[data-pmd-assistive='true'\]::before/)
})

test('simplicity contract preserves safety and progressive disclosure', async () => {
  const doc = await source('DOCS/RUTHLESS-SIMPLICITY.md')
  for (const phrase of [
    'One viewport, one focal purpose',
    'Two-step access',
    'No decoration without meaning',
    'One canonical source per concern',
    'Preserve capability, reduce exposure',
    'safety-critical information',
  ]) assert.ok(doc.includes(phrase), `missing simplicity rule: ${phrase}`)
})
