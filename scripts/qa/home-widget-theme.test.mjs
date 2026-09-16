import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const index = fs.readFileSync('index.html', 'utf8')
const semangat = fs.readFileSync('src/components/HomeWidgetSemangat.tsx', 'utf8')
const scopedGuard = fs.readFileSync('src/styles/home-widget-dark-v31.css', 'utf8')
const emergencyGuard = fs.readFileSync('src/styles/home-widget-mobile-v33.css', 'utf8')
const comfortGuard = fs.readFileSync('src/styles/home-dark-comfort-v34.css', 'utf8')
const commandGuard = fs.readFileSync('public/home-cosmic-command-v35.css', 'utf8')
const readabilityGuard = fs.readFileSync('public/home-readability-v36.css', 'utf8')
const mobileShellGuard = fs.readFileSync('src/styles/home-mobile-shell-repair-v45.css', 'utf8')
const liquidReference = fs.readFileSync('src/styles/home-liquid-reference.css', 'utf8')
const greenMaterial = fs.readFileSync('src/styles/home-green-material-v48.css', 'utf8')

const normalized = (value) => value.replace(/\s+/g, ' ')

test('Living Instrument mounts the active source widget, not only the filtered index', () => {
  assert.match(semangat, /const ActiveWidget = SOURCE_WIDGETS\[activeSource\.id\]/)
  assert.match(semangat, /<ActiveWidget \/>/)
})

test('Dark mode guards every nested widget card and loading surface', () => {
  for (const css of [scopedGuard, emergencyGuard]) {
    assert.match(css, /\.dark \.living-instrument-card/)
    assert.match(css, /\.dark \.living-instrument-card \*/)
    assert.match(css, /\.dark \.living-instrument-loading/)
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
  // Kunci perawatan cache harus ikut naik setiap kali lapisan presentasi naik;
  // kalau tidak, pengguna lama tetap memakai stylesheet lama dari cache.
  //
  // Versinya TIDAK lagi ditulis sebagai teks tetap di sini. Versi tetap membuat
  // gerbang ini gagal pada setiap kenaikan yang sah — dan gerbang yang gagal
  // karena hal yang sah akan ditulis ulang, bukan dibaca. Angkanya dibaca dari
  // index.html sendiri, sehingga yang diperiksa adalah hubungannya: kunci
  // perawatan tidak boleh tertinggal dari lapisan presentasi tertinggi.
  const lapisan = [...index.matchAll(/\/panacea-[a-z0-9-]+-v(\d+)\.css/g)].map((m) => Number(m[1]))
  assert.ok(lapisan.length > 0, 'index.html no longer links any versioned panacea-* presentation layer')
  const tertinggi = Math.max(...lapisan)
  const kunci = index.match(/MAINTENANCE_VERSION = '(\d{8})-v(\d+)'/)
  assert.ok(kunci, "MAINTENANCE_VERSION is missing or no longer shaped 'YYYYMMDD-vN'")
  const versiKunci = Number(kunci?.[2])
  assert.equal(
    versiKunci,
    tertinggi,
    versiKunci < tertinggi
      ? `the cache maintenance key is still v${versiKunci} while index.html already loads v${tertinggi}; ` +
        'returning users would keep serving the older stylesheet from cache'
      : `the cache maintenance key claims v${versiKunci} but the newest presentation layer linked from ` +
        `index.html is v${tertinggi}; the key names a release that is not shipped`,
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
  assert.doesNotMatch(comfortGuard, /\.panacea-home \.kaca \*\s*\{[^}]*color:/s)
})

test('Global widget controls stay stable while per-widget identity remains available', () => {
  assert.match(semangat, /className="living-instrument-global-controls"/)
  assert.match(semangat, /className="living-instrument-source-identity"/)
  assert.match(semangat, /activeSource\.name/)
  assert.match(commandGuard, /\.living-instrument-global-controls/)
  assert.match(commandGuard, /\.living-instrument-source-identity/)
})

test('Home v35 keeps transient active slides compact and theme-safe', () => {
  assert.match(commandGuard, /\.living-instrument-stage\[aria-hidden='false'\]/)
  assert.match(commandGuard, /height:184px!important/)
  assert.match(commandGuard, /max-height:184px!important/)
  assert.match(commandGuard, /overflow:hidden!important/)
})

test('Home v35 separates mobile widget identity from global controls', () => {
  assert.match(commandGuard, /@media \(max-width:720px\)/)
  assert.match(commandGuard, /\.living-instrument-source-identity/)
  assert.match(commandGuard, /\.living-instrument-global-controls/)
})

test('Mobile dashboard restoration never blanket-recolors widget descendants', () => {
  assert.doesNotMatch(mobileShellGuard, /\.home-widget-card \*\s*\{[^}]*color:/s)
  assert.doesNotMatch(liquidReference, /\.home-widget-card \*\s*\{[^}]*color:/s)
  assert.doesNotMatch(greenMaterial, /\.home-widget-card \*\s*\{[^}]*color:/s)
})

test('Mobile loading cards stay explicit black-green instead of gray placeholders', () => {
  const css = normalized(mobileShellGuard)
  assert.match(css, /background:rgba\(2,9,7,\.94\)!important/)
  assert.match(css, /border-color:rgba\(69,255,180,\.18\)!important/)
})

test('HIG v41 is loaded once as the final Home cascade and keeps comfort fallbacks', () => {
  const occurrences = [...index.matchAll(/panacea-hig-v41\.css/g)].length
  assert.equal(occurrences, 1)
  assert.match(index, /panacea-hig-v41\.css\?v=20260915-1/)
  assert.match(readabilityGuard, /prefers-reduced-motion/)
})
