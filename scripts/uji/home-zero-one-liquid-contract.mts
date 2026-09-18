import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workspace = readFileSync('src/pages/HomeSocialWorkspace.tsx', 'utf8')
const deck = readFileSync('src/components/HomeCommandDeck.tsx', 'utf8')
const hero = readFileSync('src/components/HomeVisualLanding.tsx', 'utf8')
const heroCss = readFileSync('src/styles/home-intent-motion.css', 'utf8')
const glass = readFileSync('src/styles/home-liquid-control-layer.css', 'utf8')
const shell = readFileSync('src/components/Shell.tsx', 'utf8')
const launcher = readFileSync('src/components/SuperPageLauncher.tsx', 'utf8')
const convergence = readFileSync('src/styles/superpage-convergence.css', 'utf8')

// Zero-step: Home itself shows health context. One-step: primary destinations
// and universal actions are directly exposed without an intermediate menu.
assert.match(workspace, /<HomeHealthBrief \/>/, 'Home stopped exposing health context at zero steps')
const healthIndex = workspace.indexOf('<HomeHealthBrief />')
const heroIndex = workspace.indexOf('<HomeVisualLanding />')
assert.ok(healthIndex >= 0 && heroIndex >= 0 && healthIndex < heroIndex,
  'Home puts the promotional hero before the user\'s health state; useful content must win the first viewport')
assert.match(workspace, /<SuperPageLauncher \/>/,
  'Home lost its three one-tap super-page launcher')
assert.doesNotMatch(workspace, /data-panacea-primary-nav/,
  'Home reintroduced a persistent bottom navigation dock')
assert.match(launcher, /SUPER_PAGES\.map\(/,
  'the launcher stopped deriving its destinations from the canonical three-space model')

const heroActions = [...hero.matchAll(/\{ to: '([^']+)', label: '([^']+)'/g)]
assert.deepEqual(heroActions.map((m) => m[1]), ['/chatbot', '/harian'],
  'universal one-tap actions must remain Ask Panacea + Log today')

// Repeated real behavior earns a one-tap shortcut; no guessed shortcuts and no
// extra disclosure step before opening a most-used destination.
assert.match(deck, /!showIndex && pintasan\.length > 0/, 'most-used shortcuts are not surfaced in the default state')
assert.match(deck, /aria-label="Most used capabilities"/, 'one-tap personalized shortcut rail is missing')
assert.match(deck, /pintasan\.map\(/, 'the one-tap rail does not use the existing evidence-based usage ranking')

// The logged-in product should reach useful data quickly instead of spending
// most of the first viewport on a marketing hero.
assert.match(heroCss, /min-height:\s*190px/,
  'secondary action panel grew back into a majority-viewport marketing surface')
assert.doesNotMatch(hero, /pointermove|pointerleave|panacea-intent-hero__media|panacea-intent-hero__scan|panacea-intent-hero__halo/,
  'Home action panel reintroduced decorative pointer/parallax media')
assert.doesNotMatch(heroCss, /@keyframes|animation:/,
  'Home action panel reintroduced decorative ambient animation')

// Liquid Glass is a CONTROL layer, not a card skin.
assert.match(convergence, /\.pmd-command-spaces[\s\S]*backdrop-filter:\s*blur\(24px\)/,
  'the compact command dropdown lost its liquid control material')
assert.match(convergence, /\.pmd-liquid-metal[\s\S]*linear-gradient/,
  'the super-page app icons lost their liquid-metal material')
assert.match(glass, /\.panacea-intent-action[\s\S]*backdrop-filter: blur\(16px\)/,
  'contextual hero controls lost their glass treatment')
assert.doesNotMatch(glass, /panacea-instrument-(cell|rail)|panacea-bento-tile/,
  'Liquid Glass leaked into content/data surfaces; keep those flat and readable')
assert.match(glass, /prefers-reduced-transparency: reduce/,
  'glass layer has no reduced-transparency fallback')
assert.match(glass, /@supports not \(\(-webkit-backdrop-filter:/,
  'glass layer has no solid fallback for unsupported browsers')

// Exactly one primary chrome system: the top command bar + its dropdown.
// The Home launcher is content navigation, not a second persistent chrome layer.
assert.doesNotMatch(shell, /DrawerNav|menuOpen|setMenuOpen/,
  'drawer/sidebar navigation returned and competes with the command bar')
assert.match(shell, /aria-label="Open Panacea spaces"/,
  'the command bar lost its compact super-page trigger')
assert.match(shell, /SUPER_PAGES\.map\(/,
  'the command dropdown no longer exposes the canonical three super pages')

assert.doesNotMatch(shell, /className="orb absolute/,
  'global Shell reintroduced decorative gradient orbs that carry no state or information')

assert.doesNotMatch(shell, /aria-label="Log Out"/,
  'global header must not duplicate logout as a permanent standalone control')
assert.match(shell, /onClick=\{doLogout\}[\s\S]{0,260}?Log out/i,
  'logout must remain reachable inside the compact command dropdown')
assert.match(convergence, /prefers-reduced-motion: reduce/,
  'new motion layer has no reduced-motion fallback')
assert.match(convergence, /prefers-reduced-transparency: reduce/,
  'new material layer has no reduced-transparency fallback')

console.log('home-zero-one-liquid-contract: zero-step health context, one-tap super pages/actions/recents, command-bar-only chrome, purposeful liquid controls, and accessible fallbacks.')
