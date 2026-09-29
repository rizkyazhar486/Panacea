import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SUPER_PAGES } from '../../src/lib/superPages.ts'

const landing = readFileSync('src/components/HomeVisualLanding.tsx', 'utf8')
const deck = readFileSync('src/components/HomeCommandDeck.tsx', 'utf8')
const workspace = readFileSync('src/pages/HomeSocialWorkspace.tsx', 'utf8')

// Simplicity is information compression, not feature deletion. The hero owns
// universal actions while the launcher owns the bounded category model.
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

// The capability area remains retrieval, not another navigation tree.
assert.doesNotMatch(deck, /panacea-command-domains|DIRECT_LAUNCHES|panacea-direct-launch/,
  'Explore grew a second navigation system again instead of staying search-led')
assert.match(deck, /Search Panacea capabilities/, 'Explore lost its search-first path')
assert.match(deck, /All \$\{uniqueFeatures\.length\} capabilities/,
  'Explore no longer states the complete catalogue count')
assert.match(deck, /group\.items\.map\(/, 'The full capability index must remain reachable when browsing')
assert.match(deck, /gabungKatalog\(FITUR_DARI_HUB, NAV_UNTUK_PENGATURAN\)/,
  'Simplifying the surface must not drop menu-only destinations')

// Category count is intentionally bounded while all seven categories share one
// canonical human-state source.
assert.deepEqual(
  SUPER_PAGES.map((space) => space.id),
  ['human', 'health', 'clinical', 'explore', 'simulate', 'records', 'for-you'],
  'the primary product model drifted away from the seven category pages',
)
assert.equal(
  SUPER_PAGES.every((space) => space.stateSource === 'canonical-human-state'),
  true,
  'category pages must not become independent state silos',
)
assert.match(workspace, /<SuperPageLauncher \/>/,
  'Home lost the one-tap category-page launcher')
assert.doesNotMatch(workspace, /data-panacea-primary-nav/,
  'a persistent bottom navigation dock returned and competes with the command bar')

console.log('home-simplicity-contract: focal actions + search-led discovery + seven shared-state category pages without deleting capabilities.')
