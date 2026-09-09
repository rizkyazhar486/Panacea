import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emptyHomeDailyState, homeDailyStateSignature, parseHomeDailyState } from '../../src/lib/homeCrossTabDailyState.ts'

const home = readFileSync('src/pages/Beranda.tsx', 'utf8')
const routes = readFileSync('src/main.tsx', 'utf8')
const deferred = readFileSync('src/components/dashboard/DeferredHomeSections.tsx', 'utf8')
const mobileStability = readFileSync('src/styles/home-mobile-stability.css', 'utf8')

const quickActions = [...home.matchAll(/\{ to: '([^']+)', emoji: '[^']+', label: '([^']+)'/g)]
assert.ok(quickActions.length >= 10, 'Home must keep a broad high-utility action set')
for (const [, path, label] of quickActions) {
  const pathOnly = path.split('?')[0]
  assert.ok(routes.includes(`path=\"${pathOnly}\"`), `Home quick action ${label} must resolve to a registered route: ${pathOnly}`)
}

assert.deepEqual(parseHomeDailyState(null), null)
assert.deepEqual(parseHomeDailyState('not-json'), null)
assert.deepEqual(parseHomeDailyState('{}'), null)
assert.deepEqual(parseHomeDailyState(JSON.stringify({ foods: [], sleepLogs: [], wellness: [] })), null)

const valid = parseHomeDailyState(JSON.stringify({
  foods: [{ date: '2026-09-09', calories: 500 }],
  sleepLogs: [{ date: '2026-09-09', hours: 7.5 }],
  wellness: { '2026-09-09': { mood: 4 } },
  account: { name: 'must-not-rehydrate' },
}))
assert.ok(valid, 'Valid daily state should be adopted')
assert.equal('account' in valid, false, 'Cross-tab Home parser must not rehydrate unrelated global state')
assert.notEqual(homeDailyStateSignature(valid), '', 'Valid daily state must have a deterministic signature')
assert.deepEqual(emptyHomeDailyState(), { foods: [], sleepLogs: [], wellness: {} })

assert.match(home, /PANACEA_STATE_STORAGE_KEY/, 'Home must scope cross-tab adoption to the persisted Panacea state key')
assert.match(home, /event\.key !== PANACEA_STATE_STORAGE_KEY/, 'Unrelated storage events must not replace Home daily state')
assert.match(home, /parseHomeDailyState\(event\.newValue\)/, 'Home must parse the new storage snapshot before adoption')
assert.match(home, /setExternalDailyState\(null\)/, 'A local daily-state change must clear the external snapshot')
assert.match(home, /removeEventListener\('storage', onStorage\)/, 'Home must clean up the storage listener')
assert.match(home, /vitalsAge\(vitals\)/, 'Home signals must expose recorded-data freshness when provenance exists')
assert.match(home, /Source\/time unavailable/, 'Home must fail closed when shared-vitals provenance is unavailable')
assert.doesNotMatch(home, /Recorded shared vitals/, 'Home must not imply provenance completeness when source and timestamp are absent')
assert.doesNotMatch(home, /unit: 'today'/, 'Home must not call a shared snapshot “today” without metric-level date evidence')
assert.match(home, /aria-live=\"polite\"/, 'Live Home signal rail must announce refreshes accessibly')
assert.match(home, /signals\.slice\(0, 5\)/, 'Home signal rail must stay bounded')
assert.match(home, /IntersectionObserver/, 'Heavy Home sections must remain viewport-deferred')
assert.match(home, /LazyPerformanceVisualizationDeck/, 'Performance visualization must remain code-split')
assert.match(home, /home-mobile-stability\.css/, 'Home must load its touch/reduced-motion stability stylesheet')
assert.match(mobileStability, /@media \(hover: none\) and \(pointer: coarse\)/, 'Touch devices must retain the compositor reduction boundary')
assert.match(mobileStability, /backdrop-filter: none !important/, 'Touch Home must disable stacked backdrop filters')
assert.match(mobileStability, /\.home-icon-button[\s\S]*width: 44px !important;[\s\S]*height: 44px !important;/, 'Primary icon controls must keep a 44x44 touch floor')
assert.match(mobileStability, /\.home-primary-action,[\s\S]*\.home-secondary-action,[\s\S]*min-height: 44px !important;/, 'Hero actions must keep a 44px touch-height floor')
assert.match(mobileStability, /prefers-reduced-motion: reduce/, 'Home must respect reduced-motion preferences')
assert.match(deferred, /Load 3D preview/, '3D anatomy preview must remain explicit opt-in')
assert.doesNotMatch(deferred, /setActivated\(true\).*useEffect/s, '3D preview must not auto-activate from an effect')

console.log('Home command center integrity: routes resolve, cross-tab daily state is narrow/fail-closed, provenance is honest, primary touch targets keep a 44px floor, mobile stability is active, heavy sections stay deferred, and 3D remains opt-in.')
