import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const prosa = readFileSync(new URL('../../src/components/Prosa.tsx', import.meta.url), 'utf8')
const bell = readFileSync(new URL('../../src/components/NotificationBell.tsx', import.meta.url), 'utf8')
const training = readFileSync(new URL('../../src/pages/PusatLatihan.tsx', import.meta.url), 'utf8')
const shellCss = readFileSync(new URL('../../public/shell-mobile-compact-v49.css', import.meta.url), 'utf8')
const index = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')

assert.match(prosa, /baris = 1/)
assert.match(prosa, /aria-label=\{buka \? 'Hide context' : 'Show context'\}/)
assert.match(prosa, />\s*i\s*<\/button>/)

assert.match(bell, /pmd-notification-button/)
assert.match(bell, /pmd-notification-badge/)
assert.match(bell, /unread > 99 \? '99\+' : unread/)

assert.match(shellCss, /header\.kaca\.panacea-command-bar/)
assert.match(shellCss, /max-height: 62px !important/)
assert.match(shellCss, /overflow: visible !important/)
assert.match(shellCss, /\.pmd-notification-badge/)

assert.match(training, /PerformanceVisualizationDeck mode="home"/)
assert.doesNotMatch(training, /<FightHero/)
assert.doesNotMatch(training, /Collects age, height, weight, goal, equipment, injuries and restrictions first/)

assert.match(index, /shell-mobile-compact-v49\.css\?v=20260918-1/)
assert.match(index, /panacea-ruthless-simple-v50\.css\?v=20260919-2/)
assert.ok(index.indexOf('panacea-ruthless-simple-v50.css') > index.indexOf('panacea-shell-mobile-compact-v49.css'))
assert.match(index, /MAINTENANCE_VERSION = '20260919-v50'/)

console.log('mobile-visual-first-repair: compact header, unclipped notification count, v50 final simplicity layer, one-line context, and live Training visuals are locked')
