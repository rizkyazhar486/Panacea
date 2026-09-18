import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const landing = readFileSync('src/components/HomeVisualLanding.tsx', 'utf8')
const deck = readFileSync('src/components/HomeCommandDeck.tsx', 'utf8')
const workspace = readFileSync('src/pages/HomeSocialWorkspace.tsx', 'utf8')
const shell = readFileSync('src/components/Shell.tsx', 'utf8')
const commandBarLogic = readFileSync('src/lib/interaction/commandBar.ts', 'utf8')

// Simplicity is not feature deletion. There is no navigation bar. The
// direction-aware top surface is utility chrome only; capability access stays
// search-led and contextual instead of occupying persistent screen space.
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

// Home no longer owns a persistent navigation dock. The global top command
// bar stays out of the way while reading and returns on upward scroll.
assert.doesNotMatch(workspace, /panacea-liquid-dock|data-panacea-primary-nav/,
  'Home brought back a permanent bottom navigation dock')
assert.match(shell, /data-panacea-command-bar=\{keadaanBilah\}/,
  'Shell lost the top command bar')
assert.doesNotMatch(shell, /panacea-command-primary-links|aria-label="Primary"/,
  'destination navigation returned inside the utility header')
assert.match(commandBarLogic, /return delta > 0 \? 'hidden' : 'shown'/,
  'top command bar is no longer direction-aware')
assert.doesNotMatch(shell, /DrawerNav|setMenuOpen|menuOpen|FabNavigasi/,
  'secondary drawer/FAB navigation returned')
assert.doesNotMatch(shell, /aria-label="Open menu"|DrawerNav|FabNavigasi/,
  'drawer, hamburger, or floating navigation returned')

console.log('home-simplicity-contract: search-led capability access, zero navigation bars, and a clean reveal-on-scroll utility header across mobile and desktop.')
