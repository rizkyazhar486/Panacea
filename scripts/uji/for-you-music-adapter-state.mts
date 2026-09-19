import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const stack = readFileSync(new URL('../../src/components/ForYouDailyStack.tsx', import.meta.url), 'utf8')
const catalog = readFileSync(new URL('../../src/lib/forYouWidgetCatalog.ts', import.meta.url), 'utf8')

// The music widget has no route (no real player to open), so before this fix
// tapping its card did nothing. It must now expose the same explicit
// not-connected disclosure that the small "i" affordance exposes.
assert.match(stack, /needsAdapter = widget\.sourcePolicy === 'adapter-required'/)
assert.match(stack, /aria-label=\{`\$\{widget\.title\} adapter status`\}/)

// The disclosure must name each configured adapter explicitly and never
// claim a connected/authorized state — Panacea has no Spotify/Apple Music
// backend integration yet, so the UI must say so rather than imply one.
assert.match(stack, /widget\.adapters\.map\(\(adapter\) =>/)
assert.match(stack, /Not connected — sign-in not configured/)
assert.doesNotMatch(stack, /Connected to Spotify/)
assert.doesNotMatch(stack, /Connected to Apple Music/)

assert.match(catalog, /adapters: \['spotify', 'apple-music'\]/)
assert.match(catalog, /sourcePolicy: 'adapter-required'/)

console.log('for-you-music-adapter-state: the music tile is reachable without a route and states an explicit, non-fabricated per-provider not-connected status')
