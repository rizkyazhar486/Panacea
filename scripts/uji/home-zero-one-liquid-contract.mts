import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workspace = readFileSync('src/pages/HomeSocialWorkspace.tsx', 'utf8')
const deck = readFileSync('src/components/HomeCommandDeck.tsx', 'utf8')
const hero = readFileSync('src/components/HomeVisualLanding.tsx', 'utf8')
const heroCss = readFileSync('src/styles/home-intent-motion.css', 'utf8')
const health = readFileSync('src/components/HomeHealthBrief.tsx', 'utf8')
const healthCss = readFileSync('src/styles/home-human-interface.css', 'utf8')
const glass = readFileSync('src/styles/home-liquid-control-layer.css', 'utf8')
const shell = readFileSync('src/components/Shell.tsx', 'utf8')

// Zero-step: Home itself shows health context. One-step: primary destinations
// and universal actions are directly exposed without an intermediate menu.
assert.match(workspace, /<HomeHealthBrief \/>/, 'Home stopped exposing health context at zero steps')
const healthIndex = workspace.indexOf('<HomeHealthBrief />')
const heroIndex = workspace.indexOf('<HomeVisualLanding />')
assert.ok(healthIndex >= 0 && heroIndex >= 0 && healthIndex < heroIndex,
  'Home puts the promotional hero before the user\'s health state; useful content must win the first viewport')
assert.match(workspace, /data-panacea-primary-nav/, 'Home lost its single persistent primary navigation layer')
assert.match(health, /className="panacea-health-bento"/, 'Home health state regressed from bento to a flat dashboard strip')
for (const key of ['primary', 'sleep', 'heart', 'vo2', 'hrv', 'nutrition', 'training']) {
  assert.match(health, new RegExp(`key: '${key}'`), `health bento lost ${key}`)
}
assert.match(healthCss, /grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/,
  'desktop health bento lost its dense 12-column composition')
assert.match(healthCss, /panacea-bento-tile\[data-span='wide'\]/,
  'capability browser lost semantic wide bento tiles')
for (const label of ['Home', 'Your Body', 'Clinical', 'For You']) {
  assert.match(workspace, new RegExp(`<span>${label}<\\/span>`), `primary navigation lost ${label}`)
}

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
assert.match(glass, /\.panacea-liquid-dock[\s\S]*backdrop-filter: blur\(20px\)/,
  'primary navigation no longer has the intended liquid control material')
assert.match(glass, /\.panacea-intent-action[\s\S]*backdrop-filter: blur\(16px\)/,
  'contextual hero controls lost their glass treatment')
assert.doesNotMatch(glass, /panacea-instrument-(cell|rail)|panacea-bento-tile/,
  'Liquid Glass leaked into content/data surfaces; keep those flat and readable')
assert.match(glass, /prefers-reduced-transparency: reduce/,
  'glass layer has no reduced-transparency fallback')
assert.match(glass, /@supports not \(\(-webkit-backdrop-filter:/,
  'glass layer has no solid fallback for unsupported browsers')

// Exactly one navigation system on Home: hide the global draggable menu there,
// but nowhere else.
assert.match(glass, /body:has\(\.panacea-liquid-home\) button\[aria-label="Buka menu navigasi"\]/,
  'duplicate global navigation is visible on Home again')

assert.doesNotMatch(shell, /className="orb absolute/,
  'global Shell reintroduced decorative gradient orbs that carry no state or information')

assert.doesNotMatch(shell, /aria-label="Log Out"/,
  'global header duplicates logout even though the mobile drawer already owns that secondary action')
assert.match(shell, /onClick=\{doLogout\}[\s\S]{0,240}?Log Out/,
  'removing duplicate header logout must not remove logout from the drawer')

console.log('home-zero-one-liquid-contract: zero-step health context, one-tap primary/actions/recents, one navigation system, Liquid Glass confined to controls, and no duplicate header logout.')
