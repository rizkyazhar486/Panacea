import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SUPER_PAGES } from '../../src/lib/superPages.ts'

const landing = readFileSync('src/components/HomeVisualLanding.tsx', 'utf8')
const deck = readFileSync('src/components/HomeCommandDeck.tsx', 'utf8')
const workspace = readFileSync('src/pages/HomeSocialWorkspace.tsx', 'utf8')
const healthBrief = readFileSync('src/components/HomeHealthBrief.tsx', 'utf8')
const essentialTools = readFileSync('src/components/HomeEssentialTools.tsx', 'utf8')
const liveRail = readFileSync('src/components/HomeLiveWidgetRail.tsx', 'utf8')

// Simplicity is not feature deletion. Home stays an entry surface; the hero is
// allowed only contextual actions so category pages do not compete with it.
const heroActions = [...landing.matchAll(/\{ to: '([^']+)', label: '([^']+)'/g)]
assert.equal(heroActions.length, 2, `Home hero exposes ${heroActions.length} actions; keep one focal message and at most two contextual actions`)
assert.deepEqual(heroActions.map((m) => m[1]), ['/chatbot', '/harian'],
  'Hero should keep universal actions (ask + log), not duplicate category destinations')
for (const category of SUPER_PAGES) {
  assert.equal(
    heroActions.some((match) => match[2] === category.label),
    false,
    `Hero duplicates category-page navigation for ${category.label}`,
  )
}

// The capability area is retrieval, not another navigation bar. Search first;
// the complete catalogue remains one disclosure away and is never truncated.
assert.doesNotMatch(deck, /panacea-command-domains|DIRECT_LAUNCHES|panacea-direct-launch/,
  'Explore grew a second navigation system again instead of staying search-led')
assert.match(deck, /Search Panacea capabilities/, 'Explore lost its search-first path')
assert.match(deck, /All \$\{uniqueFeatures\.length\} capabilities/,
  'Explore no longer states the complete catalogue count')
assert.match(deck, /group\.items\.map\(/, 'The full capability index must remain reachable when browsing')
assert.match(deck, /gabungKatalog\(FITUR_DARI_HUB, NAV_UNTUK_PENGATURAN\)/,
  'Simplifying the surface must not drop menu-only destinations')

// Home itself is the zero-step entry surface. Seven compact one-tap category
// launchers expose semantic lenses while all feature routes remain deeper.
assert.deepEqual(
  SUPER_PAGES.map((space) => space.id),
  ['human', 'health', 'clinical', 'explore', 'simulate', 'records', 'for-you'],
  'the primary product model drifted away from the seven category pages',
)
assert.equal(
  SUPER_PAGES.every((space) => space.stateSource === 'canonical-human-state'),
  true,
  'category pages must remain projections of one canonical human state',
)
assert.match(workspace, /<SuperPageLauncher \/>/,
  'Home lost the one-tap category-page launcher')
assert.doesNotMatch(workspace, /data-panacea-primary-nav/,
  'a persistent bottom navigation dock returned and competes with the command bar')

const homeOrder = [
  workspace.indexOf('<HomeHealthBrief />'),
  workspace.indexOf('<HomeVisualLanding />'),
  workspace.indexOf('<HomeEssentialTools />'),
  workspace.indexOf('<SuperPageLauncher />'),
  workspace.indexOf('<HomeLiveWidgetRail />'),
  workspace.indexOf('<HomeCommandDeck />'),
]
assert.ok(homeOrder.every((index) => index >= 0), 'Home lost a required first-viewport or discovery surface')
assert.deepEqual(homeOrder, [...homeOrder].sort((a, b) => a - b),
  'Home hierarchy drifted: health status → universal actions → daily tools must precede discovery')
assert.equal((essentialTools.match(/\{ to: '/g) ?? []).length, 3,
  'Daily tools must stay bounded to exactly three one-tap utilities')
assert.match(healthBrief, /aria-label="Today health instruments"/,
  'Home lost the concise health-status anchor')

assert.match(workspace, /<HomeLiveWidgetRail \/>/,
  'Home lost the compact live-health rail required for dense progressive instrumentation')
assert.equal((liveRail.match(/\{ key: '/g) ?? []).length, 33,
  'The compact live-health rail must keep the complete 33-signal registry')
assert.match(liveRail, /const vitals = useVitals\(\)/,
  'Home live instruments must subscribe to the shared health-data bus instead of freezing a one-time snapshot')
assert.doesNotMatch(liveRail, /getVitals\(\)/,
  'Home live instrument rail regressed to a non-reactive direct snapshot')
assert.match(liveRail, /overflow-x-auto/,
  'Dense Home instruments must remain a progressive horizontal rail instead of becoming a dashboard wall')

console.log('home-first-viewport-contract: focal first viewport + seven shared-state categories + 33 reactive progressive health instruments.')
