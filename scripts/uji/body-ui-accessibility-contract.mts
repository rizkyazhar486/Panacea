import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../../src/pages/bodyhub/MultisystemScaleNavigator.tsx', import.meta.url),
  'utf8',
)

assert.match(source, /aria-expanded=\{eyeOpen\}/, 'Eye 4D toggle must expose expanded state')
assert.match(source, /className="min-h-11[^\"]*"/, 'Primary Eye 4D toggle must retain a 44px-equivalent touch floor')
assert.match(source, /<Suspense fallback=\{<div role="status"/, 'Lazy Eye 4D loading must remain announced')
assert.match(source, /<RadiologyModalityHub\s*\/>/, 'Radiology workspace must remain reachable from the multisystem navigator')
assert.match(source, /aria-pressed=\{active\}/, 'Biological scale selectors must expose pressed state')
assert.match(source, /data-selected-scale=\{selected\.scale\}/, 'Selected scale must remain observable for QA and assistive tooling')

console.log('body-ui-accessibility-contract: core navigator accessibility and reachability guards pass')
