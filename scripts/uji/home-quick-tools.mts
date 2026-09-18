import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const papan = readFileSync('src/components/PapanWidget.tsx', 'utf8')
const css = readFileSync('src/styles/rel-widget-rumah.css', 'utf8')

// Quick tools must reuse the real stateful mini-apps, not create decorative
// copies that drift from the canonical timer/focus/breathing behavior.
for (const component of ['UbinPewaktu', 'UbinFokus', 'UbinNapas']) {
  assert.match(papan, new RegExp(`<${component} \\/>`), `Quick tools lost real ${component}`)
}

assert.match(papan, /aria-label="Quick live tools"/, 'Quick-tool surface is no longer reachable on Home')
assert.match(papan, /data-tool="timer"/, 'Timer is no longer surfaced as a quick tool')
assert.match(papan, /data-tool="focus"/, 'Focus is no longer surfaced as a quick tool')
assert.match(papan, /data-tool="breathing"/, 'Breathing is no longer surfaced as a quick tool')
assert.match(
  papan,
  /!pilihan\.some\(\(id\) => id === 'pewaktu' \|\| id === 'fokus' \|\| id === 'napas'\)/,
  'Users with no quick tools selected lost the direct add path',
)
assert.match(papan, /Add quick tools/, 'Quick-tool empty state no longer opens widget management')

// Those three components used to be buried in the huge Summary Tumpukan.
// Keep a single renderer for each tool so state, timers, sound, and vibration
// cannot run in two places at once.
for (const key of ['pewaktu', 'fokus', 'napas']) {
  assert.doesNotMatch(
    papan,
    new RegExp(`kunci: '${key}'`),
    `${key} was duplicated back into the Summary carousel`,
  )
}

assert.match(css, /\.home-fun-mini__rail[\s\S]*overflow-x:\s*auto/, 'Quick tools no longer swipe horizontally')
assert.match(css, /\.home-fun-mini__rail[\s\S]*scroll-snap-type:\s*x mandatory/, 'Quick tools lost mobile snap behavior')
assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*home-fun-mini/, 'Quick tools lost reduced-motion handling')
assert.match(css, /flex:\s*0 0 min\(86vw, 354px\)/, 'Quick tools no longer expose the next card edge on mobile')

console.log('home-quick-tools: real Timer, Focus, and Breathing mini-apps are discoverable, swipeable, configurable, non-duplicated, and motion-safe.')
