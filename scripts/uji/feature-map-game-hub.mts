import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  FEATURE_MAP,
  FEATURE_MAP_BLOCKED_ROUTES,
  FEATURE_MAP_LIMIT,
  auditFeatureMap,
  featureMapNodes,
  featureMapWorlds,
  minimumOrbitGapPx,
  orbitLayout,
  routesFromRouterSource,
  type FeatureMapNode,
} from '../../src/lib/navigation/featureMap.ts'
import { SUPER_PAGES, type SuperPageId } from '../../src/lib/superPages.ts'

const mainSource = readFileSync(new URL('../../src/main.tsx', import.meta.url), 'utf8')
const launcherSource = readFileSync(new URL('../../src/components/ui/SuperPageLauncher.tsx', import.meta.url), 'utf8')
const orbitSource = readFileSync(new URL('../../src/components/ui/FeatureMapOrbit.tsx', import.meta.url), 'utf8')
const orbitCss = readFileSync(new URL('../../src/styles/feature-map-orbit.css', import.meta.url), 'utf8')

const FORBIDDEN_UI_COPY = /\b(lokal|compliant|compliance|certified|tersertifikasi|kepatuhan|hipaa|fda|terverifikasi)\b/i

export function auditFeatureMapUiSources({
  launcher,
  orbit,
  css,
}: {
  launcher: string
  orbit: string
  css: string
}): string[] {
  const problems: string[] = []
  if (!/lazy\(\(\)\s*=>\s*import\(['"]\.\/FeatureMapOrbit['"]\)\)/.test(launcher)) {
    problems.push('SuperPageLauncher does not lazy-load FeatureMapOrbit')
  }
  if (!/<Suspense\b/.test(launcher)) {
    problems.push('SuperPageLauncher missing Suspense fallback for lazy FeatureMapOrbit')
  }
  const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  const orbitCode = stripComments(orbit)
  const launcherCode = stripComments(launcher)
  if (/from\s+['"]three['"]|webgl|WebGLRenderingContext/i.test(orbitCode)) {
    problems.push('FeatureMapOrbit requires WebGL instead of pure DOM/SVG fallback')
  }
  if (!/className="dark pmd-feature-map"/.test(orbitCode)) {
    problems.push('FeatureMapOrbit dark surface missing explicit dark marker')
  }
  if (!/event\.key === 'Escape'/.test(orbitCode)) {
    problems.push('FeatureMapOrbit missing keyboard Escape return to orbit')
  }
  if (!/min-height:\s*44px/.test(css) || !/min-h-\[44px\]/.test(launcherCode)) {
    problems.push('touch target >=44px floor missing from feature map controls')
  }
  if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css)) {
    problems.push('FeatureMapOrbit CSS missing reduced-motion fallback')
  }
  const visibleCopyOnly = `${launcherCode}\n${orbitCode}`
  if (FORBIDDEN_UI_COPY.test(visibleCopyOnly)) {
    problems.push('feature map UI contains forbidden local/unverified compliance wording')
  }
  return problems
}

// ── 1. POSITIVE: canonical map & real router inventory pass completely.
const realRoutes = routesFromRouterSource(mainSource)
assert.ok(realRoutes.length >= 200, `router inventory unexpectedly small (${realRoutes.length})`)
assert.deepEqual(auditFeatureMap(FEATURE_MAP, { routes: realRoutes }), [])

const worlds = featureMapWorlds()
assert.equal(worlds.length, 6, 'orbit on Home must expose exactly 6 worlds (<=6 primary choices)')
assert.equal(Object.keys(FEATURE_MAP).length, SUPER_PAGES.length, 'every canonical super-page must be mapped')
for (const page of SUPER_PAGES) {
  const nodes = featureMapNodes(page.id)
  assert.ok(nodes.length >= 1 && nodes.length <= FEATURE_MAP_LIMIT, `${page.id} has ${nodes.length} nodes`)
}

assert.deepEqual(
  auditFeatureMapUiSources({ launcher: launcherSource, orbit: orbitSource, css: orbitCss }),
  [],
  'real feature-map UI sources failed structural audit',
)

// ── 2. BOUNDARY: radial geometry, touch clearance, and exact limits.
assert.deepEqual(orbitLayout(0), [])
assert.deepEqual(orbitLayout(-2), [])
assert.deepEqual(orbitLayout(1.5), [])
assert.deepEqual(orbitLayout(1), [{ x: 50, y: 13 }])
assert.equal(minimumOrbitGapPx(1, 340), Number.POSITIVE_INFINITY)

const sixPoints = orbitLayout(6, 37)
assert.equal(sixPoints.length, 6)
for (const pt of sixPoints) {
  assert.ok(pt.x >= 10 && pt.x <= 90 && pt.y >= 10 && pt.y <= 90, `orbit point clipped: ${JSON.stringify(pt)}`)
}
const mobileGap = minimumOrbitGapPx(6, 340, 37)
assert.ok(mobileGap >= 110, `mobile orbit gap too tight (${mobileGap.toFixed(1)}px) for >=44px targets`)

const cloneMap = (): Record<SuperPageId, FeatureMapNode[]> =>
  Object.fromEntries(
    Object.entries(FEATURE_MAP).map(([k, v]) => [k, v.map((n) => ({ ...n }))]),
  ) as Record<SuperPageId, FeatureMapNode[]>

// Exact word-count boundaries: 3-word label + 6-word cue pass; 4-word label + 7-word cue fail.
{
  const atLimit = cloneMap()
  atLimit.records[0] = { id: 'health-data', label: 'One Two Three', cue: 'One two three four five six', to: '/health-data' }
  assert.deepEqual(auditFeatureMap(atLimit, { routes: realRoutes }), [])

  const overLabel = cloneMap()
  overLabel.records[0] = { id: 'health-data', label: 'One Two Three Four', cue: 'Short cue', to: '/health-data' }
  assert.ok(auditFeatureMap(overLabel, { routes: realRoutes }).some((p) => p.includes('label over 3 words')))

  const overCue = cloneMap()
  overCue.records[0] = { id: 'health-data', label: 'Data', cue: 'One two three four five six seven', to: '/health-data' }
  assert.ok(auditFeatureMap(overCue, { routes: realRoutes }).some((p) => p.includes('cue over 6 words')))
}

// ── 3. NEGATIVE (PAIRED): every rule must reject its exact violation by name.
{
  // >6 choices on one screen
  const sevenNodes = cloneMap()
  sevenNodes.human.push({ id: 'extra', label: 'Extra', cue: 'Too many', to: '/gene-info' })
  assert.ok(auditFeatureMap(sevenNodes, { routes: realRoutes }).some((p) => p.includes('7 choices > 6')))

  // Red-light / privileged route surfaced
  for (const blocked of ['/visit-os', '/poli', '/owner', '/doctor-review']) {
    assert.ok(FEATURE_MAP_BLOCKED_ROUTES.has(blocked))
    const withBlocked = cloneMap()
    withBlocked.simulate[0] = { id: 'blocked-test', label: 'Blocked', cue: 'Should fail', to: blocked }
    assert.ok(
      auditFeatureMap(withBlocked, { routes: [...realRoutes, blocked] }).some((p) => p.includes('blocked')),
      `blocked route ${blocked} slipped through`,
    )
  }

  // Non-existent / invented top-level route
  const invented = cloneMap()
  invented.records[0] = { id: 'ghost', label: 'Ghost', cue: 'Missing route', to: '/new-top-page' }
  assert.ok(auditFeatureMap(invented, { routes: realRoutes }).some((p) => p.includes('does not exist in the router')))

  // Wrong canonical category
  const wrongCat = cloneMap()
  wrongCat.human[0] = { id: 'misplaced', label: 'Record', cue: 'Wrong group', to: '/emr' }
  assert.ok(auditFeatureMap(wrongCat, { routes: realRoutes }).some((p) => p.includes('resolves to records')))

  // Duplicate route across categories
  const duplicate = cloneMap()
  duplicate.records.push({ id: 'dup', label: 'Body', cue: 'Dup route', to: '/body-explorer' })
  assert.ok(auditFeatureMap(duplicate, { routes: realRoutes }).some((p) => p.includes('already mapped')))

  // Forbidden wording
  for (const word of ['Mode lokal', 'HIPAA ready', 'Certified medical']) {
    const badCopy = cloneMap()
    badCopy.records[0] = { id: 'health-data', label: 'Data', cue: word, to: '/health-data' }
    assert.ok(
      auditFeatureMap(badCopy, { routes: realRoutes }).some((p) => p.includes('forbidden copy')),
      `forbidden copy "${word}" slipped through`,
    )
  }

  // Unknown category & fail-closed empty router
  const unknownCat = { ...cloneMap(), magic: [{ id: 'x', label: 'X', cue: 'Y', to: '/emr' }] }
  assert.ok(auditFeatureMap(unknownCat, { routes: realRoutes }).some((p) => p.includes('not a canonical category')))
  assert.ok(auditFeatureMap(FEATURE_MAP, { routes: [] }).includes('router inventory is empty'))
}

// ── 4. SABOTAGED GATE VERIFICATION: break UI sources and assert gate catches each one.
{
  const noLazy = launcherSource.replace("lazy(() => import('./FeatureMapOrbit'))", 'FeatureMapOrbit')
  assert.notEqual(noLazy, launcherSource)
  assert.ok(
    auditFeatureMapUiSources({ launcher: noLazy, orbit: orbitSource, css: orbitCss }).some((p) => p.includes('lazy-load')),
    'sabotage removing lazy() was not caught',
  )

  const withWebgl = `${orbitSource}\n// test\nconst ctx = canvas.getContext('webgl2')`
  assert.ok(
    auditFeatureMapUiSources({ launcher: launcherSource, orbit: withWebgl, css: orbitCss }).some((p) => p.includes('WebGL')),
    'sabotage injecting WebGL was not caught',
  )

  const noDark = orbitSource.replace('className="dark pmd-feature-map"', 'className="pmd-feature-map"')
  assert.notEqual(noDark, orbitSource)
  assert.ok(
    auditFeatureMapUiSources({ launcher: launcherSource, orbit: noDark, css: orbitCss }).some((p) => p.includes('dark marker')),
    'sabotage stripping dark marker was not caught',
  )

  const withLokal = orbitSource.replace('Pick a world', 'Mode lokal')
  assert.notEqual(withLokal, orbitSource)
  assert.ok(
    auditFeatureMapUiSources({ launcher: launcherSource, orbit: withLokal, css: orbitCss }).some((p) => p.includes('forbidden')),
    'sabotage injecting "lokal" was not caught',
  )
}

console.log(`feature-map-game-hub: 7 canonical worlds (6 orbit + hub), ${realRoutes.length} real routes verified, mobile gap ${mobileGap.toFixed(1)}px, positive+negative+boundary+sabotage PASS`)
