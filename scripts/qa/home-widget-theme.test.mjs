import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

const tumpukan = read('src/components/Tumpukan.tsx')
const semangat = read('src/components/UbinSemangat.tsx')
const scopedGuard = read('src/styles/widget-dark-surface-v29.css')
const emergencyGuard = read('public/home-widget-dark-v31.css')
const comfortGuard = read('src/styles/home-dark-comfort-v34.css')
const activeGuard = read('src/styles/home-widget-active-v35.css')
const mobileStability = read('src/styles/home-mobile-stability.css')
const readabilityGuard = read('public/home-readability-v36.css')
const higFoundation = read('public/panacea-hig-v41.css')
const index = read('index.html')

test('Living Instrument mounts the active source widget, not only the filtered index', () => {
  assert.match(tumpukan, /const originalIndex = aktifItem\?\.i \?\? aktif/)
  assert.match(tumpukan, /originalIndex \+ lookAhead \+ 1/)
  assert.match(tumpukan, /widget-instrument-loading-v29/)
})

test('Dark mode guards every nested widget card and loading surface', () => {
  for (const css of [scopedGuard, emergencyGuard]) {
    assert.match(css, /\.widget-instrument-loading-v29/)
    assert.match(css, /Loading widget…/)
    assert.match(css, /background:#0a0f16!important/)
    assert.match(css, /color:#dbe7ef!important/)
    assert.match(css, /\.widget-instrument-slide-v5 \.kaca/)
    assert.match(css, /background:#0b1119!important/)
    assert.match(css, /background-image:none!important/)
    assert.match(css, /color:#f8fafc!important/)
  }
})

test('Active Suspense fallback cannot retain a giant previous widget canvas', () => {
  for (const css of [scopedGuard, emergencyGuard]) {
    assert.match(css, /aria-hidden='false'/)
    assert.match(css, /height:184px!important/)
    assert.match(css, /max-height:184px!important/)
  }
})

test('Final-authority Dark Home guard loads after the general Home contrast layer', () => {
  const contrast = index.indexOf('/home-contrast-v27.css')
  const darkGuard = index.indexOf('/home-widget-dark-v31.css?v=20260909-1')
  assert.ok(contrast >= 0, 'Home contrast layer must remain registered')
  assert.ok(darkGuard > contrast, 'Dark widget guard must load after the general contrast layer')

  const maintenanceMatch = index.match(/MAINTENANCE_VERSION = '\d{8}-v(\d+)'/)
  assert.ok(maintenanceMatch, 'Home cache maintenance version must remain registered')
  const loadedPanaceaVersions = [...index.matchAll(/\/panacea-[^"'?\s]+-v(\d+)\.(?:css|js)(?:\?[^"']*)?/g)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite)
  assert.ok(loadedPanaceaVersions.length > 0, 'At least one versioned Panacea runtime layer must be loaded')
  assert.equal(
    Number(maintenanceMatch[1]),
    Math.max(...loadedPanaceaVersions),
    'Cache maintenance version must track the latest loaded Panacea runtime layer',
  )
})

test('Home v34 removes decorative outline leakage without recoloring semantic data', () => {
  assert.match(semangat, /import '\.\.\/styles\/home-dark-comfort-v34\.css'/)
  assert.match(comfortGuard, /--pmd-calm-surface:rgba\(9,14,22,\.82\)/)
  assert.match(comfortGuard, /--pmd-calm-border:rgba\(255,255,255,\.085\)/)
  assert.match(comfortGuard, /\.panacea-home \.kaca\{/)
  assert.match(comfortGuard, /border:1px solid var\(--pmd-calm-border\)!important/)
  assert.match(comfortGuard, /\.panacea-home \.kaca::before/)
  assert.match(comfortGuard, /content:none!important/)
  assert.doesNotMatch(comfortGuard, /svg\s*[,{]/, 'v34 must not override chart/reference SVG semantics')
})

test('Global widget controls stay stable while per-widget identity remains available', () => {
  assert.match(comfortGuard, /\.widget-instrument-edit-v5/)
  assert.match(comfortGuard, /background:rgba\(0,191,99,\.085\)!important/)
  assert.match(comfortGuard, /color:#53dfa0!important/)
  assert.match(comfortGuard, /@media\(max-width:430px\)/)
  assert.match(comfortGuard, /grid-template-columns:minmax\(0,1fr\)!important/)
  assert.match(comfortGuard, /\.widget-instrument-title-v5/)
  assert.match(comfortGuard, /white-space:normal!important/)
})

test('Home v35 keeps transient active slides compact and theme-safe', () => {
  assert.match(comfortGuard, /@import '\.\/home-widget-active-v35\.css'/)
  assert.match(activeGuard, /aria-hidden='false'\]:empty/)
  assert.match(activeGuard, /widget-instrument-loading-v29/)
  assert.match(activeGuard, /height:184px!important/)
  assert.match(activeGuard, /max-height:184px!important/)
  assert.match(activeGuard, /background:#090f17!important/)
  assert.doesNotMatch(activeGuard, /svg\s*[,{]/, 'v35 must not override semantic chart/reference SVG data')
})

test('Home v35 separates mobile widget identity from global controls', () => {
  assert.match(activeGuard, /@media\(max-width:430px\)/)
  assert.match(activeGuard, /justify-content:space-between!important/)
  assert.match(activeGuard, /max-width:min\(68vw,240px\)!important/)
  assert.match(activeGuard, /widget-instrument-label-v5/)
  assert.match(activeGuard, /font-size:11px!important/)
})

test('Mobile dashboard restoration never blanket-recolors widget descendants', () => {
  assert.match(mobileStability, /section\[aria-labelledby="my-dashboard-title"\] > div:first-child h2/)
  assert.match(mobileStability, /section\[aria-labelledby="my-dashboard-title"\] > div:first-child p/)
  assert.doesNotMatch(
    mobileStability,
    /section\[aria-labelledby="my-dashboard-title"\]\s+div\s*\{[^}]*color:\s*#fff/s,
    'Dashboard mobile guard must not force every nested widget div to white',
  )
})

test('Mobile loading cards stay explicit black-green instead of gray placeholders', () => {
  assert.match(mobileStability, /\.home-loading-card\s*\{[^}]*background:\s*#000\s*!important/s)
  assert.match(mobileStability, /\.home-loading-card\s*\{[^}]*border-color:\s*rgba\(0,\s*191,\s*99,\s*\.22\)\s*!important/s)
  assert.match(mobileStability, /\.home-loading-card \[aria-hidden="true"\] > div\s*\{[^}]*background:\s*rgba\(0,\s*191,\s*99,\s*\.18\)\s*!important/s)
})

test('HIG v41 is loaded once as the final Home cascade and keeps comfort fallbacks', () => {
  const readability = index.indexOf('/home-readability-v36.css?v=20260915-2')
  const hig = index.indexOf('/panacea-hig-v41.css?v=20260915-1')
  assert.ok(readability >= 0, 'Home readability guard must remain registered')
  assert.ok(hig > readability, 'HIG foundation must load after the final Home legacy guard')
  assert.doesNotMatch(readabilityGuard, /@import\s+url\([^)]*panacea-hig-v41/, 'HIG foundation must not be loaded twice')
  assert.match(higFoundation, /--pmd-ease-spring:/)
  assert.match(higFoundation, /\.pmd-control-material/)
  assert.match(higFoundation, /prefers-reduced-motion/)
  assert.match(higFoundation, /html\.pmd-low-memory/)
  assert.match(readabilityGuard, /--pmd-v36-panel:#050b14/)
  assert.match(readabilityGuard, /--pmd-v36-card:#08111d/)
  assert.doesNotMatch(readabilityGuard, /--pmd-v36-panel:#f8fafc/)
})
