import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [taxonomy, hiddenFeatures, allFeatures, entryPoints, services, carePlanning, careAccess] = await Promise.all([
  readFile(new URL('../../src/lib/productSpaces.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../src/lib/fiturTersembunyi.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../src/pages/SemuaFitur.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/lib/featureEntryPoints.ts', import.meta.url), 'utf8'),
  readFile(new URL('../../src/pages/HelpServicesWorkspace.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/pages/CarePlanningWorkspace.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/pages/CareAccessWorkspace.tsx', import.meta.url), 'utf8'),
])

test('product surface exposes one stable compact OS taxonomy', () => {
  for (const id of ['today', 'body', 'move', 'learn', 'care', 'discover', 'community', 'system']) {
    assert.match(taxonomy, new RegExp(`id: '${id}'`), `missing product space: ${id}`)
  }
  assert.match(taxonomy, /small OS|conceptual\s+neighborhoods|canonical workspace/s)
})

test('similar product spaces converge into shared canonical workspaces', () => {
  assert.match(taxonomy, /id: 'body'[\s\S]*to: '\/fitness-hub\?view=body-exposure'/)
  assert.match(taxonomy, /id: 'move'[\s\S]*to: '\/fitness-hub\?view=training'/)
  assert.match(taxonomy, /id: 'learn'[\s\S]*to: '\/learn'/)
  assert.match(taxonomy, /id: 'discover'[\s\S]*to: '\/learn\?t=discovery'/)
  assert.match(taxonomy, /id: 'care'[\s\S]*to: '\/clinical-hub'/)
})

test('daily navigation hides secondary doors without deleting routes', () => {
  assert.match(taxonomy, /SECONDARY_DAILY_DESTINATIONS/)
  for (const route of [
    '/latihan', '/workout', '/recovery', '/tubuh', '/nutrition', '/radiology',
    '/electrophysiology', '/genome-lab', '/frontier-health', '/health-data',
    '/evidence', '/osce-ukmppd', '/clinical-calculators', '/drug-info', '/emr',
  ]) {
    assert.ok(taxonomy.includes(`'${route}'`), `secondary daily destination missing: ${route}`)
  }
  assert.match(hiddenFeatures, /compactPrimaryNavigation\(items\)/)
  assert.match(hiddenFeatures, /fitur tersedia.*navigasi utama/s)
})

test('shell representatives are rewritten to hubs instead of spawning sibling pages', () => {
  assert.match(taxonomy, /CANONICAL_PRIMARY_WORKSPACES/)
  assert.match(taxonomy, /'\/body-explorer': \{ to: '\/fitness-hub', label: 'Your Body' \}/)
  assert.match(taxonomy, /'\/med-study': \{ to: '\/learn', label: 'Learn' \}/)
  assert.match(taxonomy, /'\/clinical-hub': \{ to: '\/clinical-hub', label: 'Services' \}/)
  assert.match(taxonomy, /next\.group = 'Home'/)
  assert.match(taxonomy, /seen\.has\(next\.to\)/)
})

test('services use intent-level grouping with nested planning and access workspaces', () => {
  for (const key of ['assistant', 'records', 'planning', 'access', 'emergency']) {
    assert.ok(services.includes(`key: '${key}'`), `missing services mode: ${key}`)
  }
  assert.match(services, /CarePlanningWorkspace/)
  assert.match(services, /CareAccessWorkspace/)
  assert.match(services, /feature count can grow inside these modes/i)

  for (const label of ['Care Plan', 'Care Episode']) {
    assert.ok(carePlanning.includes(label), `care planning surface missing: ${label}`)
  }
  for (const label of ['Consult', 'Facilities', 'Pharmacy', 'Second Opinion', 'Medication Reminders']) {
    assert.ok(careAccess.includes(label), `care access surface missing: ${label}`)
  }
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
