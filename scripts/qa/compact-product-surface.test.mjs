import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [taxonomy, hiddenFeatures, allFeatures] = await Promise.all([
  readFile(new URL('../../src/lib/productSpaces.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../src/lib/fiturTersembunyi.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../src/pages/SemuaFitur.tsx', import.meta.url), 'utf8'),
])

test('product surface exposes one stable compact OS taxonomy', () => {
  for (const id of ['today', 'body', 'move', 'learn', 'care', 'discover', 'community', 'system']) {
    assert.match(taxonomy, new RegExp(`id: '${id}'`), `missing product space: ${id}`)
  }
  assert.match(taxonomy, /One system|stable mental model|small OS/)
})

test('daily navigation hides secondary doors without deleting routes', () => {
  assert.match(taxonomy, /SECONDARY_DAILY_DESTINATIONS/)
  assert.match(taxonomy, /'\/workout'/)
  assert.match(taxonomy, /'\/radiology'/)
  assert.match(taxonomy, /'\/frontier-health'/)
  assert.match(hiddenFeatures, /compactPrimaryNavigation\(items\)/)
  assert.match(hiddenFeatures, /fitur tersedia.*fitur yang pantas tampil di\s*\/\/ navigasi utama|fitur tersedia.*navigasi utama/s)
})

test('all-features page starts with spaces and keeps full directory progressive', () => {
  assert.match(allFeatures, /One system\. Six spaces\./)
  assert.match(allFeatures, /Advanced directory/)
  assert.match(allFeatures, /showDirectory/)
  assert.match(allFeatures, /productSpaceForRoute/)
  assert.match(allFeatures, /Browse all tools/)
})

test('emergency and core account exits remain protected', () => {
  for (const route of ['/', '/profile', '/settings', '/emergency', '/atur-fitur']) {
    assert.ok(hiddenFeatures.includes(`'${route}'`), `protected route missing: ${route}`)
  }
})
