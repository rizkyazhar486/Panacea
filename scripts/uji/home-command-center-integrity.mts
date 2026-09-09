import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const home = readFileSync('src/pages/Beranda.tsx', 'utf8')
const routes = readFileSync('src/main.tsx', 'utf8')
const deferred = readFileSync('src/components/dashboard/DeferredHomeSections.tsx', 'utf8')

const quickActions = [...home.matchAll(/\{ to: '([^']+)', emoji: '[^']+', label: '([^']+)'/g)]
assert.ok(quickActions.length >= 10, 'Home must keep a broad high-utility action set')
for (const [, path, label] of quickActions) {
  const pathOnly = path.split('?')[0]
  assert.ok(
    routes.includes(`path=\"${pathOnly}\"`),
    `Home quick action ${label} must resolve to a registered route: ${pathOnly}`,
  )
}

assert.match(home, /vitalsAge\(vitals\)/, 'Home signals must expose recorded-data freshness when provenance exists')
assert.match(home, /vitals\.source/, 'Home signals must retain source identity when available')
assert.match(home, /Source\/time unavailable/, 'Home must fail closed when shared-vitals provenance is unavailable')
assert.doesNotMatch(home, /Recorded shared vitals/, 'Home must not imply provenance completeness when source and timestamp are absent')
assert.doesNotMatch(home, /unit: 'today'/, 'Home must not call a shared snapshot “today” without metric-level date evidence')
assert.match(home, /Recorded recovery inputs/, 'Readiness quick action must avoid an unvalidated train-vs-recover instruction')
assert.match(home, /Recorded hydration data/, 'Hydration quick action must avoid presenting an unreviewed target as a Home claim')
assert.match(home, /aria-live=\"polite\"/, 'Live Home signal rail must announce refreshes accessibly')
assert.match(home, /signals\.slice\(0, 5\)/, 'Home signal rail must stay bounded')
assert.match(home, /addEventListener\('storage', update\)/, 'Home must refresh when another tab changes local recorded data')
assert.match(home, /addEventListener\('focus', update\)/, 'Home must refresh when the app regains focus')
assert.match(home, /visibilitychange/, 'Home must refresh after returning from background')
assert.match(home, /removeEventListener\('storage', update\)/, 'Home must clean up storage listeners')
assert.match(home, /removeEventListener\('focus', update\)/, 'Home must clean up focus listeners')
assert.match(home, /IntersectionObserver/, 'Heavy Home sections must remain viewport-deferred')
assert.match(home, /LazyPerformanceVisualizationDeck/, 'Performance visualization must remain code-split')
assert.match(deferred, /Load 3D preview/, '3D anatomy preview must remain explicit opt-in')
assert.doesNotMatch(deferred, /setActivated\(true\).*useEffect/s, '3D preview must not auto-activate from an effect')

console.log('Home command center integrity: routes resolve, live signals retain provenance/freshness boundaries, cross-tab/resume refresh stays wired, heavy sections stay deferred, and 3D remains opt-in.')
