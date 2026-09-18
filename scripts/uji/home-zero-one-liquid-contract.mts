import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workspace = readFileSync('src/pages/HomeSocialWorkspace.tsx', 'utf8')
const deck = readFileSync('src/components/HomeCommandDeck.tsx', 'utf8')
const hero = readFileSync('src/components/HomeVisualLanding.tsx', 'utf8')
const funWidgets = readFileSync('src/components/HomeFunWidgetRail.tsx', 'utf8')
const funWidgetsCss = readFileSync('src/styles/home-fun-widgets.css', 'utf8')
const heroCss = readFileSync('src/styles/home-intent-motion.css', 'utf8')
const glass = readFileSync('src/styles/home-liquid-control-layer.css', 'utf8')
const shell = readFileSync('src/components/Shell.tsx', 'utf8')
const widgetRegistry = readFileSync('src/lib/homeWidgets.ts', 'utf8')
const canonicalWidgetCount = [...widgetRegistry.matchAll(/\\{\\s*id:\\s*'[^']+'/g)].length

// Zero-step: Home itself shows health context. One-step: primary destinations
// and universal actions are directly exposed without an intermediate menu.
assert.match(workspace, /<HomeHealthBrief \/>/, 'Home stopped exposing health context at zero steps')
assert.match(workspace, /import \{ HomeFunWidgetRail \}/, 'Home stopped importing the live fun-widget rail')
assert.match(workspace, /<HomeFunWidgetRail \/>/, 'Home lost the live fun-widget rail from the rendered Home surface')

// Fun widgets must be real mini-apps backed by the existing feature universe and
// real local health state, not a decorative three-card mockup.
assert.match(funWidgets, /import \{ WIDGETS, type WidgetDef \} from '\.\.\/lib\/homeWidgets'/,
  'fun widgets stopped deriving from the canonical feature registry')
assert.match(funWidgets, /DEFAULT_WIDGETS = \[/, 'Home fun widgets lost their explicit starter set')
assert.match(funWidgets, /getVitals\(\)/, 'live widgets stopped reading the shared vitals source')
assert.match(funWidgets, /getWorkouts\(\)/, 'live widgets stopped reading the shared workout source')
assert.match(funWidgets, /state\.foods/, 'live widgets stopped reading nutrition state')
assert.match(funWidgets, /state\.sleepLogs/, 'live widgets stopped reading sleep state')
assert.match(funWidgets, /panacea:health-updated/, 'live widgets no longer refresh from the shared health event stream')
assert.match(funWidgets, /function FocusWidget\(\)[\s\S]*setRunning[\s\S]*window\.setInterval/,
  'focus widget regressed into decoration instead of a working timer')
assert.match(funWidgets, /Customize · \{WIDGETS\.length\}/, 'Home lost direct customization across the full widget universe')
assert.match(funWidgets, /Widget universe/, 'customizable widget picker is missing')
assert.match(funWidgets, /panacea-fun-picker-grid/, 'feature picker lost its scalable grid surface')
assert.match(funWidgets, /localStorage\.setItem\(STORAGE_KEY/, 'widget customization no longer persists')
assert.match(funWidgetsCss, /scroll-snap-type:\s*x mandatory/, 'fun widget rail lost mobile swipe snapping')
assert.match(funWidgetsCss, /prefers-reduced-motion: reduce/, 'fun widget motion has no reduced-motion escape')

const healthIndex = workspace.indexOf('<HomeHealthBrief />')
const funIndex = workspace.indexOf('<HomeFunWidgetRail />')
const legacyWidgetIndex = workspace.indexOf('<RelWidgetRumah />')
const heroIndex = workspace.indexOf('<HomeVisualLanding />')
assert.ok(healthIndex >= 0 && funIndex > healthIndex && legacyWidgetIndex > funIndex && heroIndex > legacyWidgetIndex,
  'Home must show health context, live mini-app widgets, preserved legacy widgets, then the secondary action hero')
assert.match(workspace, /data-panacea-primary-nav/, 'Home lost its single persistent primary navigation layer')
for (const label of ['Home', 'Your Body', 'Clinical', 'For You']) {
  assert.match(workspace, new RegExp(\`<span>\${label}<\\/span>\`), \`primary navigation lost \${label}\`)
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

console.log('home-zero-one-liquid-contract: zero-step health context, live customizable mini-app widgets, one-tap primary/actions/recents, one navigation system, Liquid Glass confined to controls, and no duplicate header logout.')
