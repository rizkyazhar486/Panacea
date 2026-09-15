import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [shell, fabPolicy] = await Promise.all([
  readFile(new URL('../../src/components/Shell.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/lib/aksiFab.ts', import.meta.url), 'utf8'),
])

test('mobile shell keeps the FAB as the single persistent navigation layer', () => {
  assert.match(shell, /<FabNavigasi/)
  assert.match(shell, /data-pintasan/)
  assert.match(fabPolicy, /panacea-single-mobile-nav/)
  assert.match(fabPolicy, /@media \(max-width: 1023px\)\{\[data-pintasan\]\{display:none!important\}\}/)
})

test('desktop remains unaffected by the mobile-only consolidation rule', () => {
  assert.doesNotMatch(fabPolicy, /\[data-pintasan\]\{display:none!important\}(?!.*max-width)/s)
  assert.match(shell, /lg:hidden/)
})
