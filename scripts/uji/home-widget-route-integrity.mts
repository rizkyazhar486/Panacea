import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const widgetsSource = readFileSync('src/lib/homeWidgets.ts', 'utf8')
const routesSource = readFileSync('src/main.tsx', 'utf8')

const widgetDestinations = [...widgetsSource.matchAll(/\bke:\s*'([^']+)'/g)].map((match) => match[1])
assert.ok(widgetDestinations.length >= 200, `Expected the full Home widget catalogue, found only ${widgetDestinations.length} destinations`)

const routePaths = new Set([...routesSource.matchAll(/<Route\s+path=\"([^\"]+)\"/g)].map((match) => match[1]))
const unresolved = [...new Set(widgetDestinations
  .map((destination) => destination.split('?')[0])
  .filter((path) => path.startsWith('/') && !routePaths.has(path)))]

assert.deepEqual(
  unresolved,
  [],
  `Every Home widget must resolve to a registered route. Unresolved: ${unresolved.join(', ')}`,
)

console.log(`Home widget route integrity: ${widgetDestinations.length} widget destinations resolve through the registered router.`)
