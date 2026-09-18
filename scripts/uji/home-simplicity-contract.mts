import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SUPER_PAGES } from '../../src/lib/superPages.ts'

const landing = readFileSync('src/components/HomeVisualLanding.tsx', 'utf8')
const deck = readFileSync('src/components/HomeCommandDeck.tsx', 'utf8')
const workspace = readFileSync('src/pages/HomeSocialWorkspace.tsx', 'utf8')

// Simplicity is not feature deletion. The persistent dock owns top-level
// navigation; the hero is allowed only contextual actions, so the same four
// super-pages do not compete in two or three places above the fold.
const heroActions = [...landing.matchAll(/\{ to: '([^']+)', label: '([^']+)'/g)]
assert.equal(heroActions.length, 2, `Home hero exposes ${heroActions.length} actions; keep one focal message and at most two contextual actions`)
assert.deepEqual(heroActions.map((m) => m[1]), ['/chatbot', '/harian'],
  'Hero should keep universal actions (ask + log), not duplicate the four top-level navigation destinations')
assert.doesNotMatch(landing, /Your Body|Clinical|For You/,
  'Hero duplicates persistent top-level navigation again')

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

// Home itself is the zero-step surface; three one-tap super-page launchers
// replace the persistent dock without creating another navigation bar.
assert.deepEqual(SUPER_PAGES.map((space) => space.label), ['Your Body', 'Clinical', 'For You'],
  'the primary product model drifted away from exactly three super pages')
assert.match(workspace, /<SuperPageLauncher \/>/,
  'Home lost the one-tap three-super-page launcher')
assert.doesNotMatch(workspace, /data-panacea-primary-nav/,
  'a persistent bottom navigation dock returned and competes with the command bar')

console.log('home-simplicity-contract: one focal hero, two contextual actions, search-led Explore, complete capability reachability, and exactly three one-tap super pages.')
