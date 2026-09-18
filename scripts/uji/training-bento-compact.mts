import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const training = readFileSync(new URL('../../src/pages/PusatLatihan.tsx', import.meta.url), 'utf8')
const tabs = readFileSync(new URL('../../src/components/HalamanTab.tsx', import.meta.url), 'utf8')
const bento = readFileSync(new URL('../../src/components/TrainingLabBento.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../../src/styles/training-lab-bento.css', import.meta.url), 'utf8')

assert.match(training, /<TrainingLabBento snapshot=\{bento\} \/>/)
assert.match(training, /tabLayout="compact"/)
assert.match(training, /featuredTabIds=\{\['organizer', 'gps', 'sesi'\]\}/)
assert.match(training, /<details className="training-depth-disclosure">/)
assert.match(training, /<PerformanceVisualizationDeck mode="home" \/>/)
assert.match(training, /<details className="training-audit-disclosure">/)
assert.doesNotMatch(training, /<FightHero/)
assert.doesNotMatch(training, /Decision first: next session/)
assert.doesNotMatch(training, /Weekly calendar for push, pull, legs and abs/)

for (const target of ['pelatih', 'progres', 'fisiologi', 'rencana', 'lab']) {
  assert.match(bento, new RegExp(`to="/latihan\\?t=${target}"`))
}
assert.match(bento, /data-active=\{active === 'pelatih' \? 'true' : 'false'\}/)
assert.match(bento, /freshnessSeries/)
assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
assert.match(css, /\.training-lab-bento-card--lead/)
assert.match(css, /\.training-lab-bento-card\[data-active='true'\]/)
assert.match(css, /prefers-reduced-motion/)

assert.match(tabs, /tabLayout = 'scroll'/)
assert.match(tabs, /halaman-tab-more/)
assert.match(tabs, /halaman-tab-more-grid/)
assert.match(tabs, /setMoreOpen\(false\)/)
assert.match(css, /\.halaman-tab-primary/)
assert.match(css, /min-height: 44px/)
assert.match(css, /\.halaman-tab-more-grid/)

console.log('training-bento-compact: primary bento, compact copy, interactive states, and preserved deep performance view are locked')
