import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const training = readFileSync(new URL('../../src/pages/PusatLatihan.tsx', import.meta.url), 'utf8')
const bento = readFileSync(new URL('../../src/components/TrainingLabBento.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../../src/styles/training-lab-bento.css', import.meta.url), 'utf8')
const tabs = readFileSync(new URL('../../src/components/HalamanTab.tsx', import.meta.url), 'utf8')

assert.match(training, /<TrainingLabBento snapshot=\{bento\} \/>/)
assert.match(training, /<details className="training-depth-disclosure">/)
assert.match(training, /<PerformanceVisualizationDeck mode="home" \/>/)
assert.match(training, /<details className="training-audit-disclosure">/)
assert.match(training, /subjudul="Train · measure · adapt"/)
assert.doesNotMatch(training, /Decision first: next session/)
assert.doesNotMatch(training, /Weekly calendar for push, pull, legs and abs/)
assert.doesNotMatch(training, /Training-load model paused rather than inventing/)

for (const target of ['pelatih', 'progres', 'fisiologi', 'rencana', 'lab']) {
  assert.match(bento, new RegExp(`to="/latihan\\?t=${target}"`))
}
assert.match(bento, /freshnessSeries/)
assert.match(bento, /data-active=\{active === 'pelatih' \? 'true' : 'false'\}/)

assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
assert.match(css, /\.training-lab-bento-card--lead/)
assert.match(css, /\.training-lab-bento-card\[data-active='true'\]/)
assert.match(css, /min-height: 46px/)
assert.match(css, /prefers-reduced-motion/)

/* Shared global tab simplification remains intact; Training must build on it,
   not replace/revert the concurrent compact-tab work. */
assert.match(tabs, /const PRIMARY_TAB_LIMIT = 7/)
assert.match(tabs, /More \$\{moreTabs\.length\}/)

console.log('training-comfort: bento-first hierarchy, concise copy, progressive detail and shared compact tabs are locked')
