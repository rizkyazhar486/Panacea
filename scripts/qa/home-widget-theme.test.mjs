import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

const tumpukan = read('src/components/Tumpukan.tsx')
const scopedGuard = read('src/styles/widget-dark-surface-v29.css')
const emergencyGuard = read('public/home-widget-dark-v31.css')
const index = read('index.html')

test('Living Instrument mounts the active source widget, not only the filtered index', () => {
  assert.match(tumpukan, /const originalIndex = aktifItem\?\.i \?\? aktif/)
  assert.match(tumpukan, /originalIndex \+ lookAhead \+ 1/)
  assert.match(tumpukan, /widget-instrument-loading-v29/)
})

test('Dark mode guards every nested widget card and loading surface', () => {
  for (const css of [scopedGuard, emergencyGuard]) {
    assert.match(css, /\.dark \.panacea-home \.widget-instrument-slide-v5 \.kaca/)
    assert.match(css, /\.widget-instrument-loading-v29/)
    assert.match(css, /background:#0b1119!important/)
    assert.match(css, /background-image:none!important/)
    assert.match(css, /color:#f8fafc!important/)
  }
})

test('Final-authority Dark Home guard loads after the general Home contrast layer', () => {
  const contrast = index.indexOf('/home-contrast-v27.css')
  const darkGuard = index.indexOf('/home-widget-dark-v31.css')
  assert.ok(contrast >= 0, 'Home contrast layer must remain registered')
  assert.ok(darkGuard > contrast, 'Dark widget guard must load after the general contrast layer')
  assert.match(index, /MAINTENANCE_VERSION = '20260908-v31'/)
})
