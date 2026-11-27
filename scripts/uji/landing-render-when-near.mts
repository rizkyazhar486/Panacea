// The landing defers style, layout and paint of every block below the hero until it nears the viewport
// (RenderWhenNear: content-visibility auto with the block's measured height as placeholder). Pinned here:
//   - the wrapper's exact style and rounding; the phone height below Tailwind's `lg` breakpoint, the desktop height at
//     and above it (and the phone height when the viewport cannot be queried);
//   - an invalid estimate for the current viewport renders the block unwrapped;
//   - the first two screens (header, hero, four doors) are never deferred; the pricing block below them is.
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }

const { build } = await import('esbuild')
const out = await build({
  stdin: { contents: "export { RenderWhenNear } from './src/pages/landing/components/RenderWhenNear.tsx'", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom'], logLevel: 'silent',
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/landing-render-when-near.uji.mjs', out.outputFiles[0]!.text)
const { RenderWhenNear } = await import(pathToFileURL(resolve('node_modules/.cache/landing-render-when-near.uji.mjs')).href)

const g = globalThis as { window?: unknown }
/** Renders under a stubbed viewport: `query` is what matchMedia answers true to; `null` stubs no window at all. */
function html(phone: number, desktop: number, viewport: { query: string } | 'no-matchMedia' | null = null) {
  if (viewport === null) delete g.window
  else if (viewport === 'no-matchMedia') g.window = {}
  else g.window = { matchMedia: (q: string) => ({ matches: q === viewport.query }) }
  try {
    return renderToStaticMarkup(createElement(RenderWhenNear, { phone, desktop }, createElement('section', null, 'x')))
  } finally {
    delete g.window
  }
}
const WIDE = { query: '(min-width: 1024px)' }
const NARROW = { query: 'nothing matches' }
const wrapped = (px: number) => `<div style="content-visibility:auto;contain-intrinsic-size:auto ${px}px"><section>x</section></div>`

gagal('layar_sempit_memakai_tinggi_ponsel_dibulatkan', () => {
  assert.equal(html(1144, 1117, NARROW), wrapped(1144))
  assert.equal(html(1143.6, 1117, NARROW), wrapped(1144), 'rounded to whole pixels')
  assert.equal(html(1144, 1117, null), wrapped(1144), 'no window (server render): the phone height')
})

gagal('layar_lebar_memakai_tinggi_desktop', () => {
  assert.equal(html(1144, 1117, WIDE), wrapped(1117))
  assert.equal(html(1144, 1116.5, WIDE), wrapped(1117), 'rounded to whole pixels')
  // Twin: a query other than the lg breakpoint matching does not switch to the desktop height.
  assert.equal(html(1144, 1117, { query: '(min-width: 768px)' }), wrapped(1144))
})

gagal('tanpa_matchMedia_memakai_tinggi_ponsel_tanpa_galat', () => {
  assert.equal(html(1144, 1117, 'no-matchMedia'), wrapped(1144))
})

gagal('perkiraan_tidak_sah_untuk_layar_ini_merender_tanpa_pembungkus', () => {
  for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -10]) {
    assert.equal(html(bad, 1117, NARROW), '<section>x</section>', `phone ${bad} on a narrow screen`)
    assert.equal(html(1144, bad, WIDE), '<section>x</section>', `desktop ${bad} on a wide screen`)
  }
  // Twins: only the estimate for the current viewport counts, and the smallest valid one is wrapped.
  assert.equal(html(Number.NaN, 1117, WIDE), wrapped(1117))
  assert.equal(html(1144, Number.NaN, NARROW), wrapped(1144))
  assert.equal(html(1, 1117, NARROW), wrapped(1))
})

gagal('layar_pertama_tidak_ditunda_hanya_tarif_ditunda', () => {
  const landing = readFileSync('src/pages/landing/Landing.tsx', 'utf8')
  const firstDeferred = landing.indexOf('<RenderWhenNear')
  assert.ok(firstDeferred > 0)
  // Header, hero and the four doors are the first two screens: never deferred.
  for (const firstScreen of ['<LandingHeader', '<HeroSection', '<FourDoorsSection']) {
    const at = landing.indexOf(firstScreen)
    assert.ok(at > 0 && at < firstDeferred, `${firstScreen} renders before anything is deferred`)
  }
  assert.match(landing, /<RenderWhenNear phone=\{[1-9]\d*\} desktop=\{[1-9]\d*\}><PricingSection[ />]/,
    'PricingSection is deferred with positive phone and desktop heights')
  assert.equal((landing.match(/<RenderWhenNear /g) ?? []).length, 1, 'nothing else is wrapped')
})

console.log('landing render-when-near: the first two screens render at once; pricing is deferred with its measured phone/desktop height; an invalid estimate renders the block normally')
