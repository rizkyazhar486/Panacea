import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { homeStyles } from '../bangun/home-stable-css.mjs'

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8')

test('P0: stable stylesheet exactly matches the four Home source CSS files plus material import', () => {
  assert.equal(read('public/home-styles.css'), homeStyles(), 'build output drift would make old tabs render stale styles')
  assert.match(homeStyles(), /panacea-human-home/)
})

test('P0: Home lazy route does not import per-deployment CSS chunk', () => {
  const home = read('src/pages/HomeSocialWorkspace.tsx')
  for (const name of [
    'home-liquid-reference.css', 'home-green-material-v48.css', 'home-human-interface.css',
    'home-liquid-control-layer.css', 'home-compact-responsive.css',
  ]) assert.ok(!home.includes(`import '../styles/${name}'`), `remove hashed Home chunk CSS import: ${name}`)
})

test('P0: HTML loads stable Home styles before Vite entry without render-blocking stylesheet tag', () => {
  const html = read('index.html')
  const start = html.indexOf('data-panacea-home-styles')
  const entry = html.indexOf('type="module" src="/src/main.tsx"')
  assert.ok(start > 0 && entry > start)
  assert.match(html.slice(start, entry), /link\.href = '\/home-styles\.css'/)
  assert.match(html.slice(start, entry), /link\.rel = 'stylesheet'/)
})

test('P0: production cache header forces Home stylesheet revalidation', () => {
  const json = JSON.parse(read('vercel.json'))
  const entry = json.headers.find((x) => x.source === '/home-styles.css')
  assert.ok(entry)
  assert.ok(entry.headers.some((x) => x.key === 'Cache-Control' && /no-cache/.test(x.value)))
})

test('P0: known stale iPhone Home CSS URL resolves to stable CSS without a broad asset fallback', () => {
  const json = JSON.parse(read('vercel.json'))
  const incident = '/assets/Home-D8IB3ISB.css'
  const route = (json.rewrites || []).find((x) => x.source === incident)
  assert.deepEqual(route, { source: incident, destination: '/home-styles.css' })
  assert.equal((json.rewrites || []).some((x) => x.source.startsWith('/assets/') && (x.source.includes('*') || x.source.includes('(.*)'))), false, 'do not turn unrelated missing JS/CSS into a false HTTP 200')
})
