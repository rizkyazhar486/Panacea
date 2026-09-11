import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const main = readFileSync('src/main.tsx', 'utf8')
const shell = readFileSync('src/components/Shell.tsx', 'utf8')
const catalog = readFileSync('src/lib/katalogFitur.ts', 'utf8')
const allFeatures = readFileSync('src/pages/SemuaFitur.tsx', 'utf8')

function routePath(value: string): string {
  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return trimmed
  return trimmed.split(/[?#]/, 1)[0] || '/'
}

function quotedValues(source: string, key: 'path' | 'to'): string[] {
  const re = key === 'path'
    ? /<Route\s+[^>]*\bpath\s*=\s*["']([^"']+)["']/g
    : /\bto\s*:\s*["']([^"']+)["']/g
  return [...source.matchAll(re)].map((match) => match[1])
}

const routerPaths = new Set(quotedValues(main, 'path').map(routePath))
const shellDestinations = quotedValues(shell, 'to')
const catalogDestinations = quotedValues(catalog, 'to')

assert.ok(routerPaths.has('/semua-fitur'), 'Router must expose /semua-fitur')
assert.match(allFeatures, /FITUR_DARI_HUB/, 'All Features must consume the hub feature catalog')
assert.match(allFeatures, /NAV_UNTUK_PENGATURAN/, 'All Features must consume the shared navigation catalog')

const internalDestinations = [...new Set([...shellDestinations, ...catalogDestinations])]
  .filter((destination) => destination.startsWith('/'))

const missingRoutes = internalDestinations
  .map((destination) => ({ destination, canonical: routePath(destination) }))
  .filter(({ canonical }) => !routerPaths.has(canonical))

assert.deepEqual(
  missingRoutes,
  [],
  `Every user-facing catalog destination must resolve to a router path or redirect. Missing: ${missingRoutes.map((item) => `${item.destination} -> ${item.canonical}`).join(', ')}`,
)

const malformedDestinations = internalDestinations.filter((destination) => {
  const canonical = routePath(destination)
  return canonical.length > 1 && canonical.endsWith('/')
})
assert.deepEqual(malformedDestinations, [], 'Catalog destinations must use canonical paths without trailing slashes')

const catalogCanonical = catalogDestinations
  .filter((destination) => destination.startsWith('/'))
  .map(routePath)
const duplicateCatalogRoutes = [...new Set(catalogCanonical.filter((path, index) => catalogCanonical.indexOf(path) !== index))]
assert.deepEqual(duplicateCatalogRoutes, [], `Hub catalog must not duplicate canonical destinations: ${duplicateCatalogRoutes.join(', ')}`)

assert.ok(internalDestinations.length >= 100, `Expected a broad navigable product surface; found only ${internalDestinations.length} destinations`)

console.log(`✓ feature surface sync: ${internalDestinations.length} user-facing destinations resolve through ${routerPaths.size} router paths`)
