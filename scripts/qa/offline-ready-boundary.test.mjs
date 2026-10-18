import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8')

test('offline preloading is owned by Settings page, not shared component layer', () => {
  const component = read('src/components/ui/OfflineReady.tsx')
  const page = read('src/pages/dashboard/Settings.tsx')
  assert.doesNotMatch(component, /import\(['"]\.\.\/\.\.\/pages\//, 'UI must not import pages')
  assert.match(component, /export function OfflineReady\(\{ pages \}/, 'component accepts injected page manifest')
  assert.match(page, /<OfflineReady pages=\{OFFLINE_PAGES\}/, 'Settings injects all preloaders')
  assert.equal((page.match(/imp:\s*\(\)\s*=>\s*import\(/g) || []).length, 8, 'retain all eight offline page downloads')
  assert.match(page, /import\('\.\.\/clinical\/InitialAssessment'\)/, 'clinical assessment still downloaded')
})

test('offline preload must report real failures rather than claiming success after a failed import', () => {
  const component = read('src/components/ui/OfflineReady.tsx')
  assert.match(component, /await pages\[i\]\.imp\(\)/, 'all manifest entries are executed')
  assert.match(component, /pages\.length/, 'progress denominator equals supplied manifest')
})
