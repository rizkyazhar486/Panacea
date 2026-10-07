import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { emptyHomeDailyState, homeDailyStateSignature, parseHomeDailyState } from '../../src/lib/homeCrossTabDailyState.ts'

const home = readFileSync('src/pages/dashboard/Beranda.tsx', 'utf8')
const routedHome = readFileSync('src/pages/dashboard/Home.tsx', 'utf8')
const activeHome = readFileSync('src/pages/HomeSocialWorkspace.tsx', 'utf8')
const activeHomeHero = readFileSync('src/components/HomeVisualLanding.tsx', 'utf8')
const activeHomeIntent = readFileSync('src/styles/home-intent-motion.css', 'utf8')
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
assert.match(home, /role=\"status\"[\s\S]*aria-live=\"polite\"[\s\S]*aria-busy=\"true\"/, 'Deferred Home loading cards must expose a polite busy status')
assert.match(home, /className=\"sr-only\">Loading \{label\}<\/span>/, 'Deferred loading status must include readable assistive text')
assert.match(home, /aria-busy=\"true\"[\s\S]*<div aria-hidden=\"true\">/, 'Home loading skeleton visuals must stay out of the accessibility tree')
assert.match(home, /signals\.slice\(0, 5\)/, 'Home signal rail must stay bounded')
assert.match(home, /IntersectionObserver/, 'Heavy Home sections must remain viewport-deferred')
assert.match(home, /LazyPerformanceVisualizationDeck/, 'Performance visualization must remain code-split')
assert.match(home, /home-mobile-stability\.css/, 'Home must load its touch/reduced-motion stability stylesheet')
assert.match(mobileStability, /@media \(hover: none\) and \(pointer: coarse\)/, 'Touch devices must retain the compositor reduction boundary')
assert.match(mobileStability, /backdrop-filter: none !important/, 'Touch Home must disable stacked backdrop filters')
assert.match(mobileStability, /\.home-icon-button[\s\S]*width: 44px !important;[\s\S]*height: 44px !important;/, 'Primary icon controls must keep a 44x44 touch floor')
assert.match(routedHome, /return <HomeSocialWorkspace \/>/, 'The routed default Home must render HomeSocialWorkspace')
assert.match(activeHome, /className="panacea-liquid-home/, 'The active routed Home root must remain panacea-liquid-home')
assert.match(activeHome, /<HomeVisualLanding \/>/, 'The active routed Home must mount its primary action surface')
assert.match(activeHomeHero, /className="panacea-intent-action"/, 'Active Home hero actions must use the guarded action class')
assert.match(activeHomeIntent, /\.panacea-intent-action\s*\{[\s\S]*?min-height:\s*50px;/, 'Active Home hero actions must keep a touch target above the 44px floor')
assert.match(activeHomeIntent, /@media \(max-width: 680px\)[\s\S]*?\.panacea-intent-action\s*\{[\s\S]*?min-height:\s*48px;/, 'Active Home hero actions must remain at least 44px tall on phones')
assert.match(activeHomeIntent, /\.panacea-intent-action:focus-visible\s*\{[\s\S]*?outline:\s*3px solid[\s\S]*?outline-offset:\s*2px;/, 'Active Home hero actions must retain a visible keyboard focus ring')
assert.match(mobileStability, /prefers-reduced-motion: reduce/, 'Home must respect reduced-motion preferences')
assert.match(deferred, /Load 3D preview/, '3D anatomy preview must remain explicit opt-in')
assert.doesNotMatch(deferred, /setActivated\(true\).*useEffect/s, '3D preview must not auto-activate from an effect')

console.log('Home command center integrity: routes resolve, legacy command-center safeguards remain fail-closed, the routed Home surface is explicitly guarded, keyboard focus remains visible, active Home touch targets stay above 44px, mobile stability is active, heavy sections stay deferred, and 3D remains opt-in.')
