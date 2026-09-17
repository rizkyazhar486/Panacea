import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [taxonomy, hiddenFeatures, allFeatures, entryPoints] = await Promise.all([
  readFile(new URL('../../src/lib/productSpaces.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../src/lib/fiturTersembunyi.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../src/pages/SemuaFitur.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/lib/featureEntryPoints.ts', import.meta.url), 'utf8'),
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
  assert.match(hiddenFeatures, /fitur tersedia.*navigasi utama/s)
})

test('all-features page starts with spaces and keeps full directory progressive', () => {
  assert.match(allFeatures, /One system\. Six spaces\./)
  assert.match(allFeatures, /Advanced directory/)
  assert.match(allFeatures, /showDirectory/)
  assert.match(allFeatures, /productSpaceForRoute/)
  assert.match(allFeatures, /Browse main tools/)
})

test('browse stays compact while exact search keeps deep tools reachable', () => {
  assert.match(entryPoints, /BrowseSurface = AvailableCapabilities − SecondaryDoors/)
  assert.match(entryPoints, /SearchSurface = AvailableCapabilities/)
  assert.match(entryPoints, /compactBrowseResults/)
  for (const route of ['/wells-score', '/sleep-apnea-screen', '/caffeine', '/drug-info', '/training-plan']) {
    assert.ok(entryPoints.includes(`'${route}'`), `secondary browse door missing: ${route}`)
  }
  assert.match(allFeatures, /compactBrowseResults\(hasil, q\.trim\(\)\.length > 0\)/)
  assert.match(allFeatures, /focused tools are intentionally search-first/)
})

test('emergency and core account exits remain protected', () => {
  for (const route of ['/', '/profile', '/settings', '/emergency', '/atur-fitur']) {
    assert.ok(hiddenFeatures.includes(`'${route}'`), `protected route missing: ${route}`)
  }
})
